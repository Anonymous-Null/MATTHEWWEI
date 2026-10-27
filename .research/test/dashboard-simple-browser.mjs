import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const html=await readFile(new URL('../../index.html',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
  for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:950}}),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-10-26T22:58:00Z')});
    await page.route('**/*',r=>{requests.push(r.request().url());return r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.abort();});
    await page.goto('https://dashboard.test/');
    await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    const legacy=await page.evaluate(()=>JSON.parse(localStorage.getItem('daymark:v1')));
    legacy.tasks=[{id:'old-task',subject:'history',title:'Finish the chapter',minutes:30,completed:false,createdAt:'2026-10-25T18:00:00Z'}];
    legacy.notepad={text:'Keep my plan',open:true};
    await page.evaluate(s=>localStorage.setItem('daymark:v1',JSON.stringify(s)),legacy);await page.reload();
    await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    assert.equal(await page.locator('#news-panel,#bookmarks-open,#bookmarks-dialog,[data-scroll="news-panel"]').count(),0);
    assert.equal(await page.locator('#plan-text').inputValue(),'Keep my plan');
    const star=page.locator('[data-star-task="old-task"]'),row=page.locator('.task-entry').first();
    const normal=await row.evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.equal(await star.getAttribute('aria-pressed'),'false');await star.click();
    assert.equal(await star.getAttribute('aria-pressed'),'true');assert.notEqual(await row.evaluate(el=>getComputedStyle(el).backgroundColor),normal);
    assert.equal(await page.locator('[data-task-id="old-task"]').isChecked(),false);
    await page.locator('#pushups').check();
    await page.locator('#journal-input').fill('A good practice session');await page.locator('#journal-form button[type="submit"]').click();
    await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    assert.equal(await star.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#pushups').isChecked(),true);
    assert.match(await page.locator('#latest-moment').innerText(),/good practice/);
    const fact=await page.locator('#fact-text').innerText();assert.ok(fact.length>30&&fact.length<450);
    await page.locator('#fact-next').click();assert.notEqual(await page.locator('#fact-text').innerText(),fact);
    await page.locator('#refresh-button').click();await page.waitForFunction(()=>!document.querySelector('#refresh-button').disabled);
    await page.clock.setSystemTime(new Date('2026-10-26T23:01:00Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await star.getAttribute('aria-pressed'),'true');
    await star.focus();await page.keyboard.press('Space');assert.equal(await star.getAttribute('aria-pressed'),'false');
    assert.equal(await page.locator('#plan-text').inputValue(),'Keep my plan');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.ok(!requests.some(u=>/briefing\.json|\/api\/news|rss2json|bing.com\/news/.test(u)));
    assert.deepEqual(errors,[]);
    if(width===390)await page.screenshot({path:'/tmp/dashboard-simple-mobile.png',fullPage:true});
    await page.close();
  }
  console.log('Desktop/mobile: no news or news requests; legacy tasks retained; star tint, keyboard toggle, reload, journal, exercise, facts, and check-in reset passed.');
}finally{await browser.close();}
