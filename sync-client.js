import {SyncJournal, flattenPersonal, mergeEntries} from './sync-core.js';

const CONFIG = 'matthewwei:sync-config:v1';
const AUTH = 'matthewwei:sync-auth:v1';
const JOURNAL = 'matthewwei:sync-journal:v1';
const RECOVERY = 'matthewwei:before-sync:v1';
const $ = selector => document.querySelector(selector);
const read = key => { const value = localStorage.getItem(key); return value ? JSON.parse(value) : null; };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export function checkConfig(value) {
  const url = new URL(value?.url);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.port || url.username || url.password || !['', '/'].includes(url.pathname) || url.search || url.hash) throw new Error('Use the project URL from Supabase, such as https://your-project.supabase.co.');
  const key = String(value?.publishableKey || '').trim();
  let anon = false;
  try { anon = JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role === 'anon'; } catch { /* New publishable keys are not JWTs. */ }
  if (!/^sb_publishable_[\w-]{10,200}$/.test(key) && !anon || key.startsWith('sb_secret_')) throw new Error('Use a publishable key (sb_publishable_…) or the legacy anon key. Never use a secret or service_role key.');
  return {url: url.origin, publishableKey: key};
}

export async function connectSync(hooks) {
  let config = null, auth = null, journal, owner = null, ready = false;
  let active = false, flushing = false, timer = null, generation = 0, lastEdit = 0, refreshPromise = null;
  let recoveryMode = false, applying = false, lastError = '';
  let lastRevision = null;
  const device = crypto.randomUUID();
  const status = (text, mode = '') => {
    $('#sync-status').textContent = text;
    $('#sync-open').textContent = text;
    $('#sync-open').dataset.mode = mode;
  };
  const renderAccount = () => {
    $('#sync-login').hidden = !config || Boolean(auth);
    $('#sync-account').hidden = !auth;
    $('#sync-email-label').textContent = auth?.user?.email || '';
    $('#sync-project').open = !config;
    $('#sync-recovery-password').hidden = !recoveryMode;
    $('#sync-recovery-download').hidden = !localStorage.getItem(RECOVERY);
  };
  const saveJournal = () => {
    // Another tab can have queued edits even when its copy of the page closes.
    const other = read(JOURNAL);
    if (other && (!owner || !other.owner || other.owner === owner)) {
      journal.entries = mergeEntries(journal.entries, other.entries || {});
      for (const key of other.pending || []) journal.pending.add(key);
      journal.clock = Math.max(journal.clock, ...Object.values(journal.entries).map(entry => entry.clock));
    }
    write(JOURNAL, {...journal.saved(), owner});
  };
  const schedule = (delay = 900) => {
    if (!auth || !active) return;
    clearTimeout(timer); timer = setTimeout(() => void flush(), delay);
  };
  const localChange = state => {
    if (!ready || applying) return;
    try {
      const before = JSON.stringify(journal.changes());
      journal.capture(state); saveJournal();
      if (before !== JSON.stringify(journal.changes())) {
        lastEdit = Date.now();
        status(auth ? 'Saved here · syncing…' : 'Saved on this device · Sign in to sync', 'pending');
        schedule();
      }
    } catch (error) { status(`Saved here · sync paused: ${error.message}`, 'error'); }
  };
  async function request(path, body, {token, method = 'POST'} = {}) {
    const response = await fetch(`${config.url}${path}`, {
      method, headers: {apikey: config.publishableKey, 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(15000), cache:'no-store',
    });
    const text = await response.text();
    if (text.length > 8_000_000) throw new Error('The online save is too large. Export a backup and contact support.');
    let result; try { result = text ? JSON.parse(text) : {}; } catch { throw new Error('The save service returned an unreadable response.'); }
    if (!response.ok) {
      const error = new Error(response.status === 401 ? 'Your sign-in expired. Sign in again; your local edits are kept.' : result.msg || result.message || result.error_description || 'The save service is unavailable.');
      error.status = response.status; throw error;
    }
    return result;
  }
  async function accessToken(force = false) {
    if (!auth) throw new Error('Sign in to sync.');
    if (!force && auth.expires_at > Date.now()/1000 + 90) return auth.access_token;
    if (!refreshPromise) refreshPromise = (async () => {
      const capturedGeneration = generation;
      const refresh = async () => {
        const stored = read(AUTH);
        if (stored?.user?.id === auth?.user?.id && stored.expires_at > Date.now()/1000 + 90) return stored;
        return request('/auth/v1/token?grant_type=refresh_token', {refresh_token: stored?.refresh_token || auth.refresh_token});
      };
      const updated = navigator.locks ? await navigator.locks.request('matthewwei-auth', refresh) : await refresh();
      if (generation !== capturedGeneration || !auth) throw new Error('Sync was disconnected.');
      if (updated.user?.id && updated.user.id !== owner) throw new Error('The sign-in account changed. Sign in again to verify this device.');
      auth = {...updated, expires_at: updated.expires_at || Date.now()/1000 + updated.expires_in}; write(AUTH,auth);
      return auth.access_token;
    })().finally(() => {refreshPromise = null;});
    return refreshPromise;
  }
  async function flush() {
    if (!ready || !auth || !active || flushing) return;
    if (!navigator.onLine) { status('Offline · changes saved here; sync resumes online', 'pending'); return; }
    if (document.activeElement?.id === 'plan-text' && Date.now() - lastEdit < 1600) { schedule(1800); return; }
    flushing = true; const capturedGeneration = generation;
    try {
      // Capture any edit made immediately before the request, and include other tabs.
      journal.capture(hooks.getState()); saveJournal();
      const changes = journal.changes();
      status('Syncing your private save…', 'pending');
      let result;
      try { result = await request('/rest/v1/rpc/merge_dashboard', {changes,known_revision:lastRevision}, {token: await accessToken()}); }
      catch (error) {
        if (error.status !== 401) throw error;
        result = await request('/rest/v1/rpc/merge_dashboard', {changes,known_revision:lastRevision}, {token: await accessToken(true)});
      }
      if (!active || generation !== capturedGeneration) return;
      const current = hooks.getState();
      // Include any newer journal entries written by another tab during the request.
      saveJournal();
      // A response must not erase changes made while the request was in flight.
      journal.capture(current);
      // An unchanged response confirms only the versions we sent, not an edit
      // typed locally while the request was in flight.
      const next = journal.accept(result.unchanged ? changes : result.entries, current, hooks.validateState);
      lastRevision = result.revision || null;
      const changed = JSON.stringify(flattenPersonal(next)) !== JSON.stringify(flattenPersonal(current));
      if (changed) {
        if (!localStorage.getItem(RECOVERY)) write(RECOVERY, {...current, news:null, weather:null});
        applying = true;
        try { hooks.applyState(next); } finally { applying = false; }
      }
      // Write directly after acknowledging; re-reading stale local metadata would
      // otherwise re-queue changes the server has just confirmed.
      write(JOURNAL, {...journal.saved(), owner});
      lastError = '';
      status(journal.pending.size ? 'Saved here · syncing remaining changes…' : 'Synced across your devices', journal.pending.size ? 'pending' : 'synced');
      renderAccount();
      if (journal.pending.size) schedule(900);
    } catch (error) {
      lastError = error.message;
      const missingTable = /merge_dashboard|schema cache|dashboard_sync|does not exist/i.test(lastError);
      status(missingTable ? 'Saved here · run the Supabase setup file to enable sync' : `Saved here · sync paused: ${lastError}`, 'error');
    } finally { flushing = false; }
  }
  async function useSession(session) {
    const user = await request('/auth/v1/user', undefined, {token:session.access_token,method:'GET'});
    if (!user.id) throw new Error('Could not verify your account.');
    if (owner && owner !== user.id) throw new Error('This browser already belongs to a different sync account. Export its data before switching accounts.');
    owner = user.id; generation++; lastRevision = null;
    if (!localStorage.getItem(RECOVERY)) write(RECOVERY, {...hooks.getState(),news:null,weather:null});
    auth = {...session,user:{id:user.id,email:user.email},expires_at:session.expires_at || Date.now()/1000 + (session.expires_in || 3600)};
    write(AUTH,auth); saveJournal(); active = true; renderAccount(); await flush();
  }
  $('#sync-config-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const next = checkConfig({url:$('#sync-url').value.trim(),publishableKey:$('#sync-key').value.trim()});
      if (owner && config && config.url !== next.url) throw new Error('This browser is already linked to a project. Export your data before changing projects.');
      config = next; write(CONFIG,config); renderAccount(); status('Project connected · create an account or sign in');
    } catch (error) { status(error.message,'error'); }
  });
  $('#sync-login').addEventListener('submit', async event => {
    event.preventDefault();
    const action = event.submitter?.value || 'signin';
    const email = $('#sync-email').value.trim(), password = $('#sync-password').value;
    if (!email || !$('#sync-email').checkValidity()) {status('Enter your email address.','error');return;}
    if (action !== 'reset' && !password) {status('Enter your password.','error');return;}
    if (action === 'signup' && password.length < 8) {status('Choose a password with at least 8 characters.','error');return;}
    const buttons = [...$('#sync-login').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    try {
      status(action === 'reset' ? 'Sending a password reset email…' : 'Signing in…','pending');
      const redirect = `${location.origin}${location.pathname}`;
      if (action === 'reset') {
        await request(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`,{email});
        status('Check your email for a password reset link. Open it on this dashboard.');
      } else {
        const result = await request(action === 'signup' ? `/auth/v1/signup?redirect_to=${encodeURIComponent(redirect)}` : '/auth/v1/token?grant_type=password',{email,password});
        $('#sync-password').value = '';
        if (result.access_token) await useSession(result);
        else status('Check your email to confirm your account, then sign in on both devices.');
      }
    } catch (error) {status(error.message,'error');}
    finally {buttons.forEach(b=>b.disabled=false);}
  });
  $('#sync-new-password-form').addEventListener('submit', async event => {
    event.preventDefault();const password=$('#sync-new-password').value;
    if (password.length < 8) {status('Choose a password with at least 8 characters.','error');return;}
    try {await request('/auth/v1/user',{password},{token:await accessToken(),method:'PUT'});$('#sync-new-password').value='';recoveryMode=false;renderAccount();status('Password updated.');}
    catch(error){status(error.message,'error');}
  });
  $('#sync-now').addEventListener('click',()=>void flush());
  $('#sync-signout').addEventListener('click',async()=>{
    const token=auth?.access_token;active=false;generation++;lastRevision=null;clearTimeout(timer);auth=null;localStorage.removeItem(AUTH);recoveryMode=false;
    renderAccount();status('Signed out · your entries remain saved on this device');
    if(token) try{await request('/auth/v1/logout?scope=local',undefined,{token});}catch{/* The local session is already removed. */}
  });
  $('#sync-recovery-download').addEventListener('click',()=>{
    const backup=localStorage.getItem(RECOVERY);if(!backup)return;
    const url=URL.createObjectURL(new Blob([backup],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='matthewwei-before-sync.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('#sync-device-link').addEventListener('click',async()=>{
    if(!config)return;
    const link=new URL(location.href);link.hash=new URLSearchParams({sync:JSON.stringify(config)}).toString();
    try {await navigator.clipboard.writeText(link.href);status('Setup link copied. Open it on your other device, then sign in with the same account.');}
    catch{$('#sync-link-output').hidden=false;$('#sync-link-output').value=link.href;$('#sync-link-output').select();}
  });
  window.addEventListener('online',()=>{schedule(0);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(0);});
  setInterval(()=>{if(!document.hidden)schedule(0);},15000);
  try {
    if(!hooks.canSave())throw new Error('Browser storage is blocked. Open this site in a normal browser to use sync.');
    const saved=read(JOURNAL);owner=saved?.owner || null;
    journal=new SyncJournal({actor:device,initial:hooks.getState(),empty:hooks.emptyState(),saved});
    saveJournal();ready=true;
    let supplied;
    const fragment=new URLSearchParams(location.hash.slice(1));
    if(fragment.has('sync')){
      supplied=checkConfig(JSON.parse(fragment.get('sync')));
      // A setup link never replaces an existing project's configuration.
      if(!owner){write(CONFIG,supplied);}else supplied=null;
      fragment.delete('sync');history.replaceState(null,'',location.pathname+location.search+(fragment.size?'#'+fragment:''));
    }
    config=read(CONFIG);
    if(!config){
      try{const response=await fetch(new URL('./sync-config.json',location.href),{cache:'no-store'});if(response.ok){const value=await response.json();if(value.url)config=checkConfig(value);}}catch{/* Local data works when configuration is unavailable. */}
    }
    if(config){config=checkConfig(config);write(CONFIG,config);$('#sync-url').value=config.url;$('#sync-key').value=config.publishableKey;}
    renderAccount();
    const callback=new URLSearchParams(location.hash.slice(1));
    if(callback.has('access_token')){
      const session={access_token:callback.get('access_token'),refresh_token:callback.get('refresh_token'),expires_in:Number(callback.get('expires_in'))||3600};
      recoveryMode=callback.get('type')==='recovery';
      history.replaceState(null,'',location.pathname+location.search);
      if(!config)throw new Error('Connect your Supabase project before opening the confirmation link.');
      await useSession(session);
      if(recoveryMode){hooks.openSettings();$('#sync-new-password').focus();}
    }else{
      auth=read(AUTH);
      if(auth&&config){
        if(!auth.user?.id || owner!==auth.user.id)throw new Error('Sign in again to verify this device.');
        if(!localStorage.getItem(RECOVERY))write(RECOVERY,{...hooks.getState(),news:null,weather:null});
        await useSession({...auth,access_token:await accessToken()});
      }else status(config?'Saved on this device · Sign in to sync':'Saved on this device · Set up private sync');
    }
  } catch(error){status(`Sync unavailable: ${error.message}`,'error');}
  return {localChange,flush};
}
