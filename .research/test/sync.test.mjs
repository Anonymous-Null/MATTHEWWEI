import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {SyncJournal, applyEntries, mergeEntries, flattenPersonal} from '../../sync-core.js';
import {checkConfig} from '../../sync-client.js';

const empty=()=>({version:1,tasks:[],studySessions:[],runs:[],moments:[],events:[],bookmarks:[],knownWords:[],completedEvents:[],sessions:{},youtubeSessions:{},duolingoDays:{},recapHighlights:{},notepad:{text:'',open:false},sheetUrl:'',sheetEvents:[],sheetFetchedAt:null,news:{cached:true}});
const entry=(value,clock=1,actor='device-a',deleted=false)=>({value,clock,actor,deleted});
const journal=(actor,initial=empty(),saved)=>new SyncJournal({actor,initial,empty:empty(),saved,now:()=>100});
const valid=value=>value;

test('separate offline tasks and individual exercise sets merge without blank defaults clearing a set',()=>{
  const a=empty(),b=empty();a.tasks.push({id:'a',title:'History'});b.tasks.push({id:'b',title:'Math'});
  a.sessions['2026-10-18-am']={pushups:true,situps:false};b.sessions['2026-10-18-am']={pushups:false,situps:true};
  a.notepad.text='Keep my plan';
  const ja=journal('a',a),jb=journal('b',b),remote=mergeEntries(ja.changes(),jb.changes());
  const result=jb.accept(remote,b,valid);
  assert.deepEqual(result.tasks.map(t=>t.id),['a','b']);assert.deepEqual(result.sessions['2026-10-18-am'],{pushups:true,situps:true});assert.equal(result.notepad.text,'Keep my plan');assert.equal(jb.pending.size,0);
  assert.deepEqual(result.news,{cached:true});
});
test('deletions persist as tombstones and older offline data cannot resurrect a task',()=>{
  const state=empty();state.tasks=[{id:'a',title:'Remove me'}];const a=journal('a',state),old=structuredClone(a.entries);
  a.accept(old,state,valid);state.tasks=[];a.capture(state);
  const result=applyEntries(state,mergeEntries(a.entries,old));assert.equal(result.tasks.length,0);assert.equal(a.entries['["tasks","a"]'].deleted,true);
});
test('edits made during a save response stay pending; reload retains them',()=>{
  const state=empty(),a=journal('a',state);state.notepad.text='First';a.capture(state);const sent=structuredClone(a.changes());
  state.notepad.text='Second';a.capture(state);const next=a.accept(sent,state,valid);
  assert.equal(next.notepad.text,'Second');assert.equal(a.pending.size,1);
  const reloaded=journal('new-tab',next,a.saved());assert.equal(reloaded.pending.size,1);assert.equal(reloaded.changes()['["notepad","text"]'].value,'Second');
});
test('concurrent changes converge independent of delivery order; invalid data is not acknowledged',()=>{
  const key='["notepad","text"]',left={[key]:entry('A',5,'a')},right={[key]:entry('B',5,'b')};
  assert.deepEqual(mergeEntries(left,right),mergeEntries(right,left));
  const state=empty();state.notepad.text='Local';const a=journal('a',state),before=a.saved();
  assert.throws(()=>a.accept({[key]:entry('Remote',500,'b')},state,()=>{throw Error('Bad backup');}));assert.deepEqual(a.saved(),before);
  assert.throws(()=>mergeEntries({}, {'["sessions","__proto__","pushups"]':entry(true)}));
});
test('all personal collections sync; credentials, news, caches, and notepad open state do not',()=>{
  const state=empty();state.knownWords=['obdurate'];state.completedEvents=['event-key'];state.youtubeSessions={'2026-10-18-am':{completed:true}};state.duolingoDays={'2026-10-18':{completed:true}};state.notepad={text:'Hello',open:true};state.auth={secret:'never'};
  for(const field of ['tasks','studySessions','runs','moments','events','bookmarks'])state[field]=[{id:field}];
  const keys=Object.keys(flattenPersonal(state)).join(' ');assert.doesNotMatch(keys,/auth|news|open|sheetEvents/);
  const result=applyEntries(empty(),journal('a',state).entries);assert.equal(result.notepad.open,false);assert.equal(result.duolingoDays['2026-10-18'].completed,true);assert.equal(result.runs[0].id,'runs');
});
test('only supported Supabase URLs and public browser keys are accepted',()=>{
  assert.equal(checkConfig({url:'https://my-project.supabase.co/',publishableKey:'sb_publishable_abcdefghijklm'}).url,'https://my-project.supabase.co');
  for(const url of ['http://my-project.supabase.co','https://evil.example','https://my-project.supabase.co/evil'])assert.throws(()=>checkConfig({url,publishableKey:'sb_publishable_abcdefghijklm'}));
  assert.throws(()=>checkConfig({url:'https://my-project.supabase.co',publishableKey:'sb_secret_abcdefghijklm'}));
  const key=role=>'header.'+btoa(JSON.stringify({role}))+'.signature';
  assert.throws(()=>checkConfig({url:'https://my-project.supabase.co',publishableKey:key('service_role')}));
  assert.ok(checkConfig({url:'https://my-project.supabase.co',publishableKey:key('anon')}));
});

export async function testDatabase(){
  const db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); grant usage on schema auth to authenticated; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  const sql=await readFile(new URL('../../supabase-setup.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  return db;
}
test('real PostgreSQL enforces account isolation, rejects anonymous saves, and atomically merges versions',async()=>{
  const db=await testDatabase();
  const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
  try{
    await db.query('insert into auth.users values ($1),($2)',[a,b]);
    await db.exec('set role anon');await assert.rejects(db.query('select public.merge_dashboard($1::jsonb)',['{}']),/permission denied/);await db.exec('reset role');
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${a}';`);
    const key='["notepad","text"]',changes={[key]:entry('Private A',2)};
    let result=await db.query('select public.merge_dashboard($1::jsonb) as data',[JSON.stringify(changes)]);assert.equal(result.rows[0].data.entries[key].value,'Private A');
    await db.query('select public.merge_dashboard($1::jsonb)',[JSON.stringify({[key]:entry('Stale',1)})]);
    result=await db.query('select public.merge_dashboard($1::jsonb) as data',['{}']);assert.equal(result.rows[0].data.entries[key].value,'Private A');
    const revision=result.rows[0].data.revision;
    result=await db.query('select public.merge_dashboard($1::jsonb,$2) as data',['{}',revision]);assert.equal(result.rows[0].data.unchanged,true);assert.equal(result.rows[0].data.entries,undefined,'Idle polls do not repeatedly download private history');
    await db.exec(`set request.jwt.claim.sub='${b}'`);assert.equal((await db.query('select * from public.dashboard_sync')).rows.length,0);
    await assert.rejects(db.query('insert into public.dashboard_sync(user_id) values($1)',[a]),/row-level security/);
    assert.equal((await db.query('update public.dashboard_sync set entries=\'{}\' where user_id=$1 returning *',[a])).rows.length,0);
    await db.query('select public.merge_dashboard($1::jsonb)',[JSON.stringify({[key]:entry('Private B')})]);
    await db.exec(`set request.jwt.claim.sub='${a}'`);
    assert.equal((await db.query('select entries from public.dashboard_sync')).rows[0].entries[key].value,'Private A');
    await assert.rejects(db.query('select public.merge_dashboard($1::jsonb)',[JSON.stringify({bad:{clock:-1,actor:'a',deleted:false,value:'bad'}})]),/Invalid sync/);
    await db.exec("set request.jwt.claim.sub=''");await assert.rejects(db.query('select public.merge_dashboard($1::jsonb)',['{}']),/Sign in/);
  }finally{await db.close();}
});

test('task stars sync and unstar without dropping an older task’s fields',()=>{
  const desktop=empty();desktop.tasks=[{id:'legacy',title:'Read history',subject:'history',minutes:30,completed:false,createdAt:'2026-10-25T12:00:00Z'}];
  const j=journal('desktop',desktop);j.accept(j.entries,desktop,valid);
  desktop.tasks[0].starred=true;j.capture(desktop);
  const mobile=applyEntries(empty(),j.entries);assert.equal(mobile.tasks[0].starred,true);assert.equal(mobile.tasks[0].minutes,30);
  const phone=journal('phone',mobile);phone.accept(j.entries,mobile,valid);mobile.tasks[0].starred=false;phone.capture(mobile);
  const result=applyEntries(desktop,mergeEntries(j.entries,phone.entries));assert.equal(result.tasks[0].starred,false);assert.equal(result.tasks[0].title,'Read history');
});
