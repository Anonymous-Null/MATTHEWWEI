import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const html=await readFile(process.env.LIVE_HTML||new URL('../../index.html',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-11-20T17:00:00Z')});
 await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.abort());
 await page.goto('https://dashboard.test/');await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('daymark:v1'));
 const dates=['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-19'];
 s.lifts=dates.map((date,i)=>({id:'lift-'+i,date,exercise:['bench','curls','squat'][i%3],weight:25,unit:'lb',reps:8,createdAt:date+'T15:00:00Z'}));
 s.runs=['2026-11-03','2026-11-04','2026-11-10','2026-11-12','2026-11-16','2026-11-18'].map((date,i)=>({id:'run-'+i,date,distance:3,unit:'mi',durationSeconds:null,createdAt:date+'T15:00:00Z'}));
 for(const day of ['2026-11-17','2026-11-18','2026-11-19'])for(const p of ['am','pm'])s.sessions[`${day}-${p}`]={pushups:true,situps:true};
 localStorage.setItem('daymark:v1',JSON.stringify(s));});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
 assert.equal(await page.locator('#exercise-day-streak').innerText(),'3-day streak');
 assert.ok((await page.locator('#exercise-day-streak').boundingBox()).y<(await page.locator('.week-heading').boundingBox()).y);
 assert.match(await page.locator('#run-week-stat').innerText(),/2 \/ 2 runs/);assert.equal(await page.locator('#run-week-streak').innerText(),'3 weeks');
 assert.match(await page.locator('#lift-week-stat').innerText(),/4 \/ 4 lifting days/);assert.equal(await page.locator('#lift-week-streak').innerText(),'3 weeks');
 await page.locator('#lifts-history-button').click();page.once('dialog',d=>d.accept());await page.locator('[data-delete-lift="lift-12"]').click();
 await page.locator('#lifts-dialog .close-dialog').click();assert.equal(await page.locator('#lift-week-streak').innerText(),'3 weeks');
 await page.locator('#lifts-history-button').click();page.once('dialog',d=>d.accept());await page.locator('[data-delete-lift="lift-11"]').click();
 await page.locator('#lifts-dialog .close-dialog').click();assert.match(await page.locator('#lift-week-stat').innerText(),/3 \/ 4/);assert.equal(await page.locator('#lift-week-streak').innerText(),'2 weeks');
 await page.locator('#runs-history-button').click();page.once('dialog',d=>d.accept());await page.locator('[data-delete-run="run-5"]').click();await page.locator('#runs-dialog .close-dialog').click();
 assert.equal(await page.locator('#run-week-streak').innerText(),'2 weeks');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);assert.equal(await page.locator('#run-week-streak').innerText(),'2 weeks');
 assert.equal(await page.locator('.exercise-rules,.habit-streak-row').count(),0);
 assert.equal(await page.locator('#run-form').isVisible(),false);
 await page.locator('#run-toggle').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('#run-form').isVisible(),true);assert.equal(await page.locator('#run-toggle').getAttribute('aria-expanded'),'true');
 await page.locator('#run-distance').fill('2.5');await page.locator('#run-toggle').click();await page.locator('#run-toggle').click();
 assert.equal(await page.locator('#run-distance').inputValue(),'2.5');
 await page.locator('#run-time').fill('22:30');await page.locator('#run-form button[type=submit]').click();
 assert.equal(await page.locator('#run-form').isVisible(),false);assert.match(await page.locator('#run-status').innerText(),/Run saved/);
 assert.match(await page.locator('#recent-runs').innerText(),/2.5 mi/);
 const colors=await page.evaluate(()=>{
   const result=[];const host=document.createElement('div');host.innerHTML='<span class="session-dot empty"></span><span class="session-dot partial"></span><span class="session-dot complete"></span>';document.body.append(host);
   for(const theme of ['light','dark'])for(const palette of ['lavender','sage','blue','rose','sand','teal']){document.documentElement.dataset.theme=theme;document.documentElement.dataset.palette=palette;result.push([...host.children].map(e=>getComputedStyle(e).backgroundColor));}
   host.remove();return result;
 });
 for(const row of colors)assert.deepEqual(row,['rgb(239, 68, 68)','rgb(250, 204, 21)','rgb(34, 197, 94)']);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 if(width===390)await page.locator('#movement-panel').screenshot({path:'/tmp/compact-mobile.png'});await page.close();
}console.log('Desktop/mobile day streak placement, weekly progress/streaks, distinct lift days, deletions, reload, and layout passed.');}finally{await browser.close();}
