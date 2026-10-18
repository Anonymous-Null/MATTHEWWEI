import test from 'node:test';
import assert from 'node:assert/strict';
import {sectionStories,readingQueue} from '../lib/discovery.mjs';
import {interestScore,rankStories,completeBriefing} from '../public/news.js';
import {parseSourceArticle,eventDateInText,fetchArticle} from '../lib/research.mjs';
const now=new Date('2026-10-17T18:00:00Z');
const report=(id,title,editorialText)=>({id,title,editorialText,summary:editorialText,explanation:editorialText,source:'AP News',url:`https://apnews.com/article/${id}`,category:'World',publishedAt:now.toISOString(),sourcePageChecked:true,eventDate:null,eventDateVerified:false});
test('section discovery finds articles without inventing publication dates or accepting foreign hosts',()=>{
 const stories=sectionStories('<main><a href="/article/abc">A curious discovery with an important consequence</a><a href="/article/abc">A duplicated article description which is much longer</a><a href="https://evil.test/article/123">A malicious external story link</a><a href="https://apnews.com.evil.test/article/123">Another malicious external story link</a></main>',{url:'https://apnews.com/science',source:'AP News',category:'Science'});
 assert.equal(stories.length,1);assert.equal(stories[0].publishedAt,null);assert.equal(stories[0].title,'A curious discovery with an important consequence');
});
test('reading budget includes low-key headlines and balances channels before scoring',()=>{
 const pools=[Array.from({length:100},(_,i)=>({id:`science${i}`,publishedAt:now.toISOString()})),[{id:'world',title:'Unexpected policy reversal',publishedAt:null}]];
 assert.deepEqual(readingQueue(pools,{now,limit:3}).map(s=>s.id),['science0','world','science1']);
});
test('queue deduplicates URLs and rejects stale and future dated feed reports',()=>{
 const a={id:'a',publishedAt:now.toISOString()};assert.deepEqual(readingQueue([[a,a,{id:'old',publishedAt:'2020-01-01'},{id:'future',publishedAt:'2030-01-01'}]],{now}).map(s=>s.id),['a']);
});
test('routine statement is rejected despite background AI and record buzzwords',()=>{
 const s=report('speech','Central bank chief avoids hints about rates','The speech offered no fresh signals. Last month was the first increase in three years. Artificial intelligence and nuclear energy could transform millions of jobs.');
 assert.equal(rankStories([s],now,{broad:true,minScore:0}).length,0);
});
test('concrete reversal and quantified advance outrank abstract topic match',()=>{
 const reversal=report('policy','President suspends sanctions before they take effect','The president suspended sanctions signed just a month earlier. The law would impose tariffs on major trading partners.');
 const advance=report('advance','Researchers reduce quantum computing overhead','The team demonstrated 40 times fewer errors in an experiment, potentially reducing hardware needed for useful computing.');
 const routine=report('paper','Calculations explain spin defects','Quantum material research explains energy in tiny electrical regions.');
 assert.ok(interestScore(reversal).score>interestScore(routine).score);assert.ok(interestScore(advance).score>interestScore(routine).score);
});
test('a newly disclosed incident is dated by disclosure, not silently made a new occurrence',()=>{
 const d=eventDateInText('Tencent announced on October 16 that its AI agents had behaved unexpectedly. The incidents occurred in September.',now.toISOString(),{title:'Tencent AI agents behaved unexpectedly',category:'Technology'});
 assert.equal(d.date,'2026-10-16');assert.equal(d.kind,'Announced');
});
test('AP placeholder timestamp is removed from the article excerpt',()=>{
 const text='The researchers announced a discovery with significant consequences. '.repeat(30);
 const a=parseSourceArticle(`<html><head><title>Discovery</title></head><body><article><p>Updated [hour]:[minute] [AMPM] [timezone], [monthFull] [day], [year] ${text}</p></article></body></html>`,{title:'Discovery',source:'AP News'});
 assert.ok(!a.text.includes('[hour]'));assert.ok(a.text.includes('researchers'));
});
test('five checked reports remain five, with unknown dates honestly retained',()=>{
 const stories=['alpha','beta','gamma','delta','epsilon'].map(id=>report(id,`Unexpected ${id} discovery`,'Scientists discovered an unexpected result that challenges current understanding of how life evolved.'));
 const selected=completeBriefing(stories,{key:'edition',now});assert.equal(selected.length,5);assert.ok(selected.every(s=>s.eventDate===null));
});
test('new publishers still cannot redirect article reads to arbitrary hosts',async()=>{
 await assert.rejects(()=>fetchArticle({source:'AP News',url:'https://apnews.com/article/test'},async()=>new Response('',{status:302,headers:{location:'https://evil.test/secret'}})),/Unrecognized/);
});
test('a claim about future AI growth does not beat a reported autonomous security breach',()=>{
 const prediction=report('hype','AI could vastly boost US GDP','An executive predicts artificial intelligence will transform the world economy.');
 const breach=report('breach','AI agents breached a website','AI agents bypassed restrictions and stole credentials while trying to complete their assigned tasks. The company disclosed the incidents this week.');
 assert.equal(rankStories([prediction],now,{broad:true,minScore:0}).length,0);
 assert.ok(interestScore(breach).score>75);
});
test('different publishers covering the same sanctions reversal take only one slot',()=>{
 const titles=["Trump's decision to waive Russian sanctions outrages Congress",'Trump waives several Russia sanctions as row with Zelensky intensifies','Zelenskiy criticizes Trump’s waiver of sanctions on Russia as wrong'];
 const stories=titles.map((t,i)=>report(String(i),t,'The new law imposed sanctions that the president has now waived before they take effect.'));
 assert.equal(rankStories(stories,now,{broad:true}).length,1);
});
test('excerpt reaches the finding instead of spending the word budget on the introduction',async()=>{
 const {explanationFromText}=await import('../lib/research.mjs');
 const intro='For many centuries, the beautiful artifacts have inspired visitors with their artistic detail and craftsmanship. '.repeat(7);
 const finding='Researchers found fingerprints belonging to children among the Terracotta Army sculptures. The analysis identified distinct patterns in the clay and revealed that children helped make the figures alongside adults. The fingerprints provide evidence about the workers who built the army and challenge earlier assumptions about their ages. The team cautioned that the sample does not establish exactly how many children worked on the project, and further analysis is needed to confirm how widespread their involvement was.';
 const excerpt=explanationFromText(intro+finding,'Fingerprints reveal who built the Terracotta Army');assert.match(excerpt,/children/);assert.ok(excerpt.split(/\s+/).length<=120);assert.ok(!excerpt.endsWith('…'));
});
test('local upkeep cannot become a discovery story through incidental medical background, even as fallback',()=>{
 const local=report('path','Jeremy Vernon battles with overgrown pathways in Launceston','He discovered he had kidney cancer. He moved home and now clears pathways with his shovel and wheelbarrow.');
 assert.equal(rankStories([local],now,{broad:true,minScore:0}).length,0);
 assert.equal(completeBriefing([],{key:'new',now,fallback:[local]}).length,0);
 const important=report('danger','Overgrown pathways block evacuation during major wildfire disaster','Officials ordered an evacuation because a major wildfire is threatening thousands of homes.');
 assert.equal(rankStories([important],now,{broad:true,minScore:0}).length,1);
});
test('major strikes and mass protests outrank a routine career profile and shopping deal',()=>{
 const items=[report('jobs',"Meta's giant data center is creating a new path to $30-an-hour jobs",'Thousands of workers are studying AI at college to prepare for data center careers.'),report('sale','The new Apple TV 4K just got its first discount','Apple announced a new model this week. Buy it now at a discount.'),report('war','Ukraine strikes military facilities with drones','Officials reported strikes on military facilities and power infrastructure.'),report('march','No Kings protests draw crowds across the US','Hundreds of thousands joined demonstrations across the country.')];
 const ranked=rankStories(items,now,{broad:true,minScore:0});assert.equal(ranked.length,2);assert.ok(ranked.every(s=>['war','march'].includes(s.id)));
});
test('a large demonstration is read before incidental section features when the budget is tight',()=>{
 const pool=[{id:'local',title:'A local festival opens this week'},{id:'march',title:'No Kings rallies across US urge voters to cast ballots early'}];
 assert.equal(readingQueue([pool],{now,limit:1})[0].id,'march');
});
test('political appearances and meetings with no new answers do not fill a major-news briefing',()=>{
 const appearance=report('town','Vance faces tough questions on Iran war in town hall','He faced questions about artificial intelligence, nuclear war and inflation.');
 const meeting=report('meeting','IMF meetings leave more questions than answers','The meetings yielded no new answers on war, artificial intelligence or inflation.');
 assert.equal(rankStories([appearance,meeting],now,{broad:true,minScore:0}).length,0);
});
test('a rally is dated by when it was held, not an unrelated lawsuit later in the article',()=>{
 const d=eventDateInText('Rallies organized by the No Kings network were held Saturday across the U.S. His administration sued California election officials Thursday over the midterms.', '2026-10-17T17:45:49Z', {title:'No Kings rallies urge early voting ahead of midterms',category:'U.S.'});
 assert.equal(d.date,'2026-10-17');assert.match(d.evidence,/held Saturday/);
});
test('briefing keeps variety rather than undoing it with a final global score sort',()=>{
 const war=['alpha','beta','gamma','delta','epsilon'].map((id,i)=>report(id,`Ukraine drone strikes ${id} military site`,'Officials reported major strikes on military facilities. Authorities are assessing the damage and casualties from the attack.'));
 const protest={...report('march','No Kings rallies urge early voting ahead of midterms','Rallies organized by the No Kings network were held Saturday across the US, with hundreds of events encouraging voters to cast their ballots early.'),category:'U.S.',publishedAt:'2026-10-16T18:00:00Z',eventDate:'2026-10-16'};
 assert.ok(completeBriefing([...war,protest],{key:'edition',now}).some(s=>s.id==='march'));
});
