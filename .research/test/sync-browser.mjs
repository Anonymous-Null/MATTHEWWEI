import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {PGlite} from '@electric-sql/pglite';

const root=new URL('../../',import.meta.url);
const sql=await readFile(new URL('supabase-setup.sql',root),'utf8');
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);grant usage on schema auth to authenticated;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
await db.exec(sql);
const userA='00000000-0000-4000-8000-000000000001',userB='00000000-0000-4000-8000-000000000002';
await db.query('insert into auth.users values($1),($2)',[userA,userB]);
let sequence=Promise.resolve(),refreshes=0;
const authenticatedQuery=(id,changes,revision=null)=>{
  const result=sequence.then(async()=>{
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}';`);
    return (await db.query('select public.merge_dashboard($1::jsonb,$2) as data',[JSON.stringify(changes),revision])).rows[0].data;
  });sequence=result.catch(()=>{});return result;
};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const config={url:'https://dashboard-test.supabase.co',publishableKey:'sb_publishable_fixture-browser-key'};
const origin='https://anonymous-null.github.io',path='/MATTHEWWEI/';
const errors=[];
const tokens=new Map();
function session(email){const id=email==='matthew@example.test'?userA:userB;const token=crypto.randomUUID();tokens.set(token,{id,email});return {access_token:token,refresh_token:token,expires_in:3600,user:{id,email}};}
const files=new Map();for(const file of ['index.html','sync-core.js','sync-client.js'])files.set(file,await readFile(new URL(file,root),'utf8'));
async function device({mobile=false}={}){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});
  let broken=false,saveRequests=0;const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    const reply=(body,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':origin,'access-control-allow-headers':'apikey,authorization,content-type','access-control-allow-methods':'GET,POST,PUT,OPTIONS'},body:JSON.stringify(body)});
    if(url.origin===config.url){
      if(req.method()==='OPTIONS')return reply({});
      const data=req.postDataJSON();
      if(url.pathname==='/auth/v1/signup')return reply({user:{id:userA,email:data.email}});
      if(url.pathname==='/auth/v1/token'){
        if(url.searchParams.get('grant_type')==='refresh_token'){refreshes++;const user=tokens.get(data.refresh_token);return user?reply(session(user.email)):reply({message:'Expired'},401);}
        return data.password==='good-test-password'?reply(session(data.email)):reply({message:'Invalid login credentials'},400);
      }
      const token=req.headers().authorization?.replace('Bearer ','');const user=tokens.get(token);
      if(url.pathname==='/auth/v1/user')return user?reply(user):reply({message:'Expired'},401);
      if(url.pathname==='/auth/v1/logout')return reply({});
      if(url.pathname==='/rest/v1/rpc/merge_dashboard'){
        saveRequests++;if(broken)return reply({message:'Service temporarily unavailable'},503);
        if(!user)return reply({message:'Sign in'},401);
        try{return reply(await authenticatedQuery(user.id,data.changes,data.known_revision));}catch(error){return reply({message:error.message},400);}
      }
      return reply({message:'Not found'},404);
    }
    if(url.origin===origin){
      const file=url.pathname.slice(path.length)||'index.html';
      if(file==='sync-config.json')return reply({url:'',publishableKey:''});
      if(files.has(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/html',body:files.get(file)});
    }
    return route.abort();
  });
  await page.goto(origin+path);await page.waitForFunction(()=>document.querySelector('#sync-open').textContent.includes('Set up private sync'));
  return {context,page,setBroken:value=>{broken=value;},requests:()=>saveRequests};
}
const settings=async page=>{if(!await page.locator('#settings-dialog').evaluate(e=>e.open))await page.locator('#sync-open').click();};
const close=async page=>{if(await page.locator('#settings-dialog').evaluate(e=>e.open))await page.locator('#settings-dialog .close-dialog').click();};
async function configure(page){await settings(page);await page.locator('#sync-url').fill(config.url);await page.locator('#sync-key').fill(config.publishableKey);await page.locator('#sync-config-form button').click();}
async function login(page,email='matthew@example.test'){
  await settings(page);await page.locator('#sync-email').fill(email);await page.locator('#sync-password').fill('good-test-password');await page.locator('#sync-login button[value=signin]').click();await synced(page);await close(page);
}
const synced=page=>page.waitForFunction(()=>document.querySelector('#sync-status').textContent==='Synced across your devices');
async function sync(page){await settings(page);await page.locator('#sync-now').click();await synced(page);await close(page);}
async function task(page,subject,title){await close(page);await page.locator(`[data-toggle-task="${subject}"]`).click();await page.locator(`#task-${subject}-title`).fill(title);await page.locator(`#task-${subject}-form button[type=submit]`).click();}
try{
  const desktop=await device(),phone=await device({mobile:true}),pc=desktop.page,mobile=phone.page;
  await task(pc,'history','Computer history task');await pc.locator('#pushups').check();
  await pc.locator('#plan-toggle').click();await pc.locator('#plan-text').fill('Keep my existing plan');await pc.locator('#plan-text').blur();
  await pc.locator('#journal-input').fill('Existing good moment');await pc.locator('#journal-form button').click();
  await task(mobile,'math','Phone math task');await mobile.locator('#situps').check();
  await configure(pc);
  await pc.locator('#sync-email').fill('matthew@example.test');await pc.locator('#sync-password').fill('good-test-password');await pc.locator('#sync-login button[value=signup]').click();
  await pc.waitForFunction(()=>document.querySelector('#sync-status').textContent.includes('confirm your account'));
  assert.equal(desktop.requests(),0,'Unconfirmed signups must not upload data');
  await login(pc);await configure(mobile);await login(mobile);await sync(pc);
  for(const p of [pc,mobile]){
    assert.match(await p.locator('#tasks-history-list').innerText(),/Computer history task/);assert.match(await p.locator('#tasks-math-list').innerText(),/Phone math task/);
    assert.equal(await p.locator('#pushups').isChecked(),true);assert.equal(await p.locator('#situps').isChecked(),true);
    assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).notepad.text),'Keep my existing plan');
    assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).moments[0].text),'Existing good moment');
  }
  // Lifting records use the same private per-record merge as the existing logs.
  async function lift(page,exercise,weight,reps,unit='lb') {
    await page.locator(`[data-lift="${exercise}"]`).click();
    await page.locator('#lift-weight').fill(String(weight));await page.locator('#lift-unit').selectOption(unit);
    await page.locator('#lift-reps').fill(String(reps));await page.locator('#lift-form button[type=submit]').click();
    await page.locator('#lift-cancel').click();
  }
  await lift(pc,'bench',95,8);await sync(pc);await sync(mobile);
  assert.match(await mobile.locator('#recent-lifts').innerText(),/95 lb × 8 reps/);
  await lift(mobile,'curls',12.5,10,'kg');await sync(mobile);await sync(pc);
  assert.match(await pc.locator('#recent-lifts').innerText(),/12.5 kg each × 10 reps/);
  // Both sides continue editing while one device cannot reach the service.
  await desktop.context.setOffline(true);await task(pc,'physics','Offline physics task');
  await pc.locator('#pushups').uncheck();await lift(pc,'squat',135,5);
  await task(mobile,'english','Online English task');
  await mobile.locator('#tasks-math-list [data-delete-task]').click();await sync(mobile);
  desktop.setBroken(true);await desktop.context.setOffline(false);await pc.reload();
  await pc.waitForFunction(()=>document.querySelector('#sync-status').textContent.includes('sync paused'));
  assert.match(await pc.locator('#tasks-physics-list').innerText(),/Offline physics task/);
  desktop.setBroken(false);await sync(pc);await sync(mobile);
  for(const p of [pc,mobile]){
    assert.match(await p.locator('#tasks-physics-list').innerText(),/Offline physics task/);assert.match(await p.locator('#tasks-english-list').innerText(),/Online English task/);
    assert.equal(await p.locator('#tasks-math-list li').count(),0,'Deleted task stays deleted on a stale device');assert.equal(await p.locator('#pushups').isChecked(),false);assert.equal(await p.locator('#situps').isChecked(),true);
  }
  for(const p of [pc,mobile])assert.match(await p.locator('#recent-lifts').innerText(),/135 lb × 5 reps/);
  await mobile.locator('#lifts-history-button').click();
  mobile.once('dialog',d=>d.accept());await mobile.locator('#lifts-list [data-delete-lift]').filter({hasText:'✕'}).first().click();
  await mobile.locator('#lifts-dialog .close-dialog').click();await sync(mobile);await sync(pc);
  assert.equal(await pc.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).lifts.length),2);
  await pc.reload();await synced(pc);
  assert.equal(await pc.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).lifts.length),2,'Deleted lifting set stays deleted after reload');
  // Complete on the phone and receive the completion on the computer.
  await mobile.locator('#tasks-english-list input[type=checkbox]').click();await mobile.locator('#study-skip').click();await sync(mobile);await sync(pc);
  assert.equal(await pc.locator('#tasks-english-list li').count(),0);
  assert.match(await pc.locator('#completed-task-list').textContent(),/Online English task/);
  await pc.evaluate(()=>{const key='matthewwei:sync-auth:v1',auth=JSON.parse(localStorage.getItem(key));auth.expires_at=0;localStorage.setItem(key,JSON.stringify(auth));});
  await pc.reload();await synced(pc);assert.ok(refreshes>0,'Expired sign-in refreshes automatically');
  await settings(pc);const downloaded=pc.waitForEvent('download');await pc.locator('#export-button').click();const download=await downloaded;const backup=await readFile(await download.path(),'utf8');
  assert.equal(JSON.parse(backup).lifts.length,2,'Lifting history included in export');
  assert.doesNotMatch(backup,/access_token|refresh_token|sb_publishable_/);await close(pc);
  const outsider=await device();await configure(outsider.page);await login(outsider.page,'someoneelse@example.test');assert.equal(await outsider.page.locator('.task-entry').count(),0,'Another account cannot see Matthew’s tasks');
  await settings(mobile);await mobile.locator('#sync-signout').click();assert.match(await mobile.locator('#sync-status').innerText(),/Signed out/);await close(mobile);
  assert.match(await mobile.locator('#tasks-history-list').innerText(),/Computer history task/,'Sign-out preserves the local history');
  assert.deepEqual(errors,[]);
  console.log('Desktop/mobile browser checks passed using the real PostgreSQL merge function: existing history, two-way lifting sets, offline lifting, deletion and backups, tasks and exercise, offline/reload recovery, deletions, completed tasks, session refresh, account isolation, credential-free backups, and sign-out.');
}finally{await browser.close();await db.close();}
