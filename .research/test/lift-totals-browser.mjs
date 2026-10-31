import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const html=await readFile(process.env.LIVE_HTML || new URL('../../index.html',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
  for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-10-31T16:00:00Z')});
    await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.abort());
    await page.goto('https://dashboard.test/');
    await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    await page.locator('#lifts-history-button').click();
    const total=async exercise=>await page.locator(`[data-lift-total="${exercise}"] strong`).innerText();
    for(const lift of ['bench','squat','curls'])assert.equal(await total(lift),'0');
    await page.locator('#lifts-dialog .close-dialog').click();
    await page.evaluate(()=>{
      const state=JSON.parse(localStorage.getItem('daymark:v1'));
      state.lifts=[
        {id:'bench-lb',exercise:'bench',weight:100,unit:'lb',reps:10},
        {id:'bench-kg',exercise:'bench',weight:100,unit:'kg',reps:10},
        {id:'curl-lb',exercise:'curls',weight:25,unit:'lb',reps:8},
        {id:'curl-kg',exercise:'curls',weight:10,unit:'kg',reps:12}
      ].map((l,i)=>({...l,date:'2026-10-24',createdAt:`2026-10-24T16:0${i}:00Z`}));
      localStorage.setItem('daymark:v1',JSON.stringify(state));
    });
    await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    await page.locator('#lifts-history-button').click();
    assert.equal(await total('bench'),'3,204.6');assert.equal(await total('curls'),'929.1');assert.equal(await total('squat'),'0');
    assert.match(await page.locator('#lifts-totals').innerText(),/0 this week/,'All-time totals must include older weeks');
    await page.locator('#lift-total-unit').selectOption('kg');
    assert.equal(await total('bench'),'1,453.6');assert.equal(await total('curls'),'421.4');
    // A deleted set immediately leaves the derived total, retaining the chosen unit.
    page.once('dialog',d=>d.accept());await page.locator('[data-delete-lift="bench-lb"]').click();
    assert.equal(await total('bench'),'1,000');assert.equal(await page.locator('#lift-total-unit').inputValue(),'kg');
    assert.match(await page.locator('#lifts-dialog').innerText(),/Curls count both arms/);
    assert.equal(await page.evaluate(()=>document.querySelector('#lifts-dialog').scrollWidth>document.querySelector('#lifts-dialog').clientWidth),false);
    if(width===390)await page.locator('#lifts-dialog').screenshot({path:'/tmp/lift-totals-mobile.png'});
    await page.locator('#lifts-dialog .close-dialog').click();
    // Logging a new set also updates the total.
    await page.locator('[data-lift="squat"]').click();await page.locator('#lift-weight').fill('135');await page.locator('#lift-reps').fill('5');await page.locator('#lift-form button[type=submit]').click();
    await page.locator('#lifts-history-button').click();assert.equal(await total('squat'),'306.2');
    await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    await page.locator('#lifts-history-button').click();assert.equal(await total('bench'),'2,204.6');assert.equal(await total('squat'),'675');
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Lifting totals: mixed units, both-arm curls, empty exercises, all-time history, deletion, added sets, reload, and mobile layout passed.');
} finally {await browser.close();}
