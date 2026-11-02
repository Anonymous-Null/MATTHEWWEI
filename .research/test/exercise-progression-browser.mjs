import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const html=await readFile(process.env.LIVE_HTML||new URL('../../index.html',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-11-03T00:05:00Z')});
 await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.abort());
 await page.goto('https://dashboard.test/');await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
 assert.equal(await page.locator('#youtube-panel,#youtube-dialog,#no-youtube').count(),0);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('daymark:v1'));s.youtubeSessions={'2026-10-30-am':{completed:true}};
 for(const day of ['2026-10-31','2026-11-01','2026-11-02'])for(const p of ['am','pm'])s.sessions[`${day}-${p}`]={pushups:true,situps:true};
 s.sessions['2026-11-02-pm']={pushups:false,situps:false};localStorage.setItem('daymark:v1',JSON.stringify(s));});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
 assert.equal(await page.locator('#pushups-target').innerText(),'25');
 await page.locator('#pushups').check();await page.locator('#situps').check();
 assert.match(await page.locator('#exercise-day-streak').innerText(),/3-day streak/);assert.match(await page.locator('#exercise-goal-progress').innerText(),/next morning: 27/);
 assert.equal(await page.locator('#pushups-target').innerText(),'25');
 await page.clock.setSystemTime(new Date('2026-11-03T12:00:01Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 assert.equal(await page.locator('#pushups-target').innerText(),'27');assert.equal(await page.locator('#situps-target').innerText(),'27');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);assert.equal(await page.locator('#pushups-target').innerText(),'27');
 await page.locator('#exercise-history-button').click();assert.match(await page.locator('#history-day').innerText(),/27 push-ups/);await page.locator('#history-dialog .close-dialog').click();
 await page.clock.setSystemTime(new Date('2026-11-04T12:00:01Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 assert.equal(await page.locator('#pushups-target').innerText(),'25');assert.match(await page.locator('#exercise-day-streak').innerText(),/0-day streak/);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).youtubeSessions['2026-10-30-am'].completed),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 if(width===390)await page.locator('#movement-panel').screenshot({path:'/tmp/progression-mobile.png'});await page.close();
}console.log('Desktop/mobile: no YouTube UI; three-day gain, next-morning target, reload/history, missed-day rollback, archived data, and layout passed.');}finally{await browser.close();}
