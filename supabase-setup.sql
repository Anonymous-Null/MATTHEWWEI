-- Run once in your Supabase project's SQL Editor. No passwords or keys go here.
begin;
create table if not exists public.dashboard_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  entries jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint dashboard_sync_size check (octet_length(entries::text) <= 8000000)
);
alter table public.dashboard_sync enable row level security;
alter table public.dashboard_sync force row level security;
revoke all on public.dashboard_sync from anon;
grant select, insert, update on public.dashboard_sync to authenticated;
drop policy if exists dashboard_owner_select on public.dashboard_sync;
create policy dashboard_owner_select on public.dashboard_sync for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists dashboard_owner_insert on public.dashboard_sync;
create policy dashboard_owner_insert on public.dashboard_sync for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists dashboard_owner_update on public.dashboard_sync;
create policy dashboard_owner_update on public.dashboard_sync for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- The database locks this account's row and merges individual versioned entries.
-- Clients never upload an unconditional replacement of the whole dashboard.
drop function if exists public.merge_dashboard(jsonb);
create or replace function public.merge_dashboard(changes jsonb default '{}'::jsonb, known_revision text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  current_entries jsonb;
  item record;
  previous jsonb;
  stamp bigint;
  revision text;
begin
  if owner_id is null then raise exception 'Sign in to sync'; end if;
  if jsonb_typeof(changes) is distinct from 'object' or octet_length(changes::text) > 4000000 then raise exception 'Invalid sync payload'; end if;
  insert into public.dashboard_sync(user_id) values(owner_id) on conflict(user_id) do nothing;
  select entries into current_entries from public.dashboard_sync where user_id = owner_id for update;
  for item in select key, value from jsonb_each(changes) loop
    if length(item.key) > 2200 or jsonb_typeof(item.value) is distinct from 'object'
      or jsonb_typeof(item.value->'clock') is distinct from 'number'
      or (item.value->>'clock') !~ '^[0-9]{1,16}$'
      or jsonb_typeof(item.value->'actor') is distinct from 'string'
      or (item.value->>'actor') !~ '^[A-Za-z0-9_-]{1,128}$'
      or jsonb_typeof(item.value->'deleted') is distinct from 'boolean'
      or not (item.value ? 'value') then raise exception 'Invalid sync entry'; end if;
    stamp := (item.value->>'clock')::bigint;
    if stamp < 1 or stamp > 9007199254740991 then raise exception 'Invalid sync version'; end if;
    previous := current_entries->item.key;
    if previous is null or stamp > (previous->>'clock')::bigint
      or (stamp = (previous->>'clock')::bigint and (item.value->>'actor') collate "C" > (previous->>'actor') collate "C") then
      current_entries := jsonb_set(current_entries, array[item.key], item.value, true);
    end if;
  end loop;
  if current_entries is distinct from (select entries from public.dashboard_sync where user_id = owner_id) then
    update public.dashboard_sync set entries = current_entries, updated_at = now() where user_id = owner_id;
  end if;
  select updated_at::text into revision from public.dashboard_sync where user_id = owner_id;
  if known_revision is not null and known_revision = revision then
    return jsonb_build_object('unchanged', true, 'revision', revision);
  end if;
  return jsonb_build_object('entries', current_entries, 'revision', revision);
end;
$$;
revoke all on function public.merge_dashboard(jsonb,text) from public, anon;
grant execute on function public.merge_dashboard(jsonb,text) to authenticated;
commit;
