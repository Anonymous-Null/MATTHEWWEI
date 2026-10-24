import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
const root=new URL('../../',import.meta.url),html=await readFile(new URL('index.html',root),'utf8');
const initial=JSON.parse(await readFile(new URL('briefing.json',root),'utf8'));let payload=structuredClone(initial);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date(initial.news.fetchedAt)});
  await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:html}):r.request().url().includes('/briefing.json?')?r.fulfill({contentType:'application/json',body:JSON.stringify(payload)}):r.abort());
  await page.goto('https://dashboard.test/MATTHEWWEI/');const ready=()=>page.waitForFunction(()=>!document.querySelector('#refresh-button').disabled);await ready();
  assert.equal(await page.locator('.news-item').count(),5);
  await page.locator('#plan-toggle').click();await page.locator('#plan-text').fill('Keep my plan while news refreshes.');await page.locator('#pushups').check();
  await page.locator('#refresh-button').click();await ready();assert.match(await page.locator('#news-status').innerText(),/No newer briefing has been published yet/);assert.match(await page.locator('#news-status').innerText(),/0 new since your last check/);
  const originalTitle=payload.news.stories[1].displayTitle || payload.news.stories[1].title;
  payload.news.repairedAt=new Date(Date.parse(initial.news.repairedAt||initial.news.fetchedAt)+60000).toISOString();
  payload.news.stories[1]={...payload.news.stories[1],id:'new-browser-report',title:'New checked report from the next published briefing',displayTitle:'New checked report from the next published briefing',url:'https://apnews.com/article/new-browser-report'};
  await page.locator('#refresh-button').click();await ready();assert.match(await page.locator('.news-item').nth(1).innerText(),/New checked report/);assert.ok(!(await page.locator('.news-item').nth(1).innerText()).includes(originalTitle));assert.doesNotMatch(await page.locator('#news-status').innerText(),/No newer briefing/);
  assert.equal(await page.locator('#plan-text').inputValue(),'Keep my plan while news refreshes.');assert.equal(await page.locator('#pushups').isChecked(),true);
  assert.deepEqual(await page.locator('.news-item .category').allTextContents(),payload.news.stories.map(s=>s.slotLabel));assert.equal(await page.locator('.source-line a').count(),5);assert.deepEqual(errors,[]);
  console.log('Mobile refresh checks passed: unchanged response is explicit, a new published briefing replaces old cards in fixed slot order, and notepad/exercise saves are preserved.');
}finally{await browser.close();}
