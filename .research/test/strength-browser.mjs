import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const html=process.env.LIVE_HTML ? await readFile(process.env.LIVE_HTML,'utf8') : await readFile(new URL('../../index.html',import.meta.url),'utf8');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
  for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-10-30T22:58:00Z')});
    await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.abort());
    await page.goto('https://dashboard.test/');
    await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    // Legacy backup has neither lifts nor motivation history.
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('daymark:v1'));delete s.lifts;delete s.delights.quotes;s.runs=[{id:'old-run',date:'2026-10-29',distance:3,unit:'mi',durationSeconds:1500,createdAt:'2026-10-29T15:00:00Z'}];localStorage.setItem('daymark:v1',JSON.stringify(s));});
    await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    assert.equal(await page.locator('#lift-form').isVisible(),false);
    await page.locator('[data-lift="bench"]').click();
    assert.equal(await page.locator('[data-lift="bench"]').getAttribute('aria-expanded'),'true');
    await page.locator('#lift-weight').fill('95');await page.locator('#lift-reps').fill('8');
    await page.locator('#lift-form button[type=submit]').click();
    assert.match(await page.locator('#lift-status').innerText(),/Bench saved/);
    assert.equal(await page.locator('#lift-weight').inputValue(),'95');
    assert.equal(await page.locator('#lift-reps').inputValue(),'');
    // An immediate repeated submit cannot silently duplicate a set.
    await page.locator('#lift-form button[type=submit]').click();
    assert.match(await page.locator('#lift-status').innerText(),/whole-number reps/);
    await page.locator('[data-lift="squat"]').click();
    await page.locator('#lift-weight').fill('60');await page.locator('#lift-unit').selectOption('kg');
    await page.locator('#lift-reps').fill('4.5');await page.locator('#lift-form button[type=submit]').click();
    assert.match(await page.locator('#lift-status').innerText(),/whole-number reps/);
    await page.locator('#lift-reps').fill('5');await page.locator('#lift-date').fill('2026-10-31');
    await page.locator('#lift-form button[type=submit]').click();assert.match(await page.locator('#lift-status').innerText(),/on or before today/);
    await page.locator('#lift-date').fill('2026-10-29');await page.locator('#lift-form button[type=submit]').click();
    await page.locator('[data-lift="curls"]').click();
    assert.match(await page.locator('#lift-weight-label').innerText(),/each dumbbell/);
    await page.locator('#lift-weight').fill('22.5');await page.locator('#lift-reps').fill('12');
    await page.locator('#lift-form button[type=submit]').click();await page.locator('#lift-cancel').click();
    assert.equal(await page.locator('#lift-form').isVisible(),false);
    assert.match(await page.locator('#lift-week-stat').innerText(),/3 sets/);
    await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    assert.match(await page.locator('#recent-runs').innerText(),/3 mi/);
    assert.equal(await page.locator('#recent-lifts .run-entry').count(),3);
    assert.match(await page.locator('#recent-lifts').innerText(),/60 kg × 5 reps/);
    assert.match(await page.locator('#recent-lifts').innerText(),/22.5 lb each × 12 reps/);
    await page.locator('#lifts-history-button').click();assert.equal(await page.locator('#lifts-dialog').evaluate(e=>e.open),true);
    page.once('dialog',d=>d.accept());await page.locator('[data-delete-lift]').first().click();
    assert.equal(await page.locator('#lifts-list .run-entry').count(),2);
    await page.locator('#lifts-dialog .close-dialog').click();
    // Exhausting each new pool should be the first time any item can repeat.
    for(const [text,button,count] of [['#joke-question','#joke-next',32],['#motivation-quote','#motivation-next',24]]) {
      const seen=new Set();
      for(let i=0;i<count;i++) {const value=await page.locator(text).innerText();assert.ok(!seen.has(value),'Content repeated before pool exhausted');seen.add(value);if(i<count-1)await page.locator(button).click();}
    }
    const joke=await page.locator('#joke-question').innerText(),note=await page.locator('#motivation-quote').innerText();
    await page.locator('#joke-reveal').click();assert.equal(await page.locator('#joke-answer').isVisible(),true);
    await page.reload();await page.waitForFunction(()=>document.querySelector('#startup-notice').hidden);
    assert.equal(await page.locator('#joke-question').innerText(),joke);assert.equal(await page.locator('#motivation-quote').innerText(),note);
    await page.clock.setSystemTime(new Date('2026-10-30T23:01:00Z'));await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    assert.notEqual(await page.locator('#joke-question').innerText(),joke);assert.notEqual(await page.locator('#motivation-quote').innerText(),note);
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.equal(await page.locator('#recent-lifts .run-entry').count(),2,'Check-in must preserve lifts');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===390){await page.locator('[data-lift="bench"]').click();await page.locator('#movement-panel').screenshot({path:'/tmp/strength-mobile.png'});}
    assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Desktop/mobile lifting, legacy storage, validation, deletion, history, check-in persistence, joke/note rotation and non-repetition passed.');
}finally{await browser.close();}
