import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const html=await readFile(process.env.LIVE_HTML||new URL('../../index.html',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:950}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-11-03T04:58:00Z')});
 await p.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.abort());
 await p.goto('https://dashboard.test/');await p.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
 const time=async stamp=>{await p.clock.setSystemTime(new Date(stamp));await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));};
 await p.locator('#pushups').check();await p.locator('#situps').check();
 await time('2026-11-03T05:01:00Z');assert.equal(await p.locator('#pushups').isChecked(),true);assert.equal(await p.locator('#situps').isChecked(),true);
 assert.equal(await p.locator('#exercise-week .today').getAttribute('data-history-date'),'2026-11-02');
 await p.reload();await p.waitForFunction(()=>document.querySelector('#startup-notice').hidden);assert.equal(await p.locator('#pushups').isChecked(),true);
 await time('2026-11-03T07:59:59Z');await p.locator('#situps').uncheck();await p.locator('#situps').check();
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).sessions['2026-11-02-pm'].situps),true);
 await p.locator('#exercise-history-button').click();assert.match(await p.locator('#history-day').innerText(),/November 2, 2026/);await p.locator('#history-dialog .close-dialog').click();
 await time('2026-11-03T08:00:01Z');assert.equal(await p.locator('#pushups').isChecked(),false);assert.equal(await p.locator('#situps').isChecked(),false);
 assert.equal(await p.locator('#exercise-week .today').getAttribute('data-history-date'),'2026-11-03');
 await p.locator('#pushups').check();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).sessions['2026-11-03-am'].pushups),true);
 await time('2026-11-03T12:01:00Z');assert.equal(await p.locator('#pushups').isChecked(),true,'7AM must not clear the 3AM session');
 await time('2026-11-04T00:00:01Z');assert.equal(await p.locator('#pushups').isChecked(),false,'Evening still opens at 7PM');
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')).sessions['2026-11-02-pm'].pushups),true);assert.deepEqual(errors,[]);await p.close();
}console.log('Desktop/mobile exercise check-ins persist through midnight, switch at 3AM, retain at 7AM, and reset evening at 7PM.');}finally{await browser.close();}
