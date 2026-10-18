import test from 'node:test';import assert from 'node:assert/strict';
import {selectPersonalBriefing,publishedPersonalBriefing,personalRelevance,newsGeography,PERSONAL_NEWS_LAYOUT} from '../public/news.js';
import {researchNews} from '../lib/research.mjs';
const now=new Date('2026-10-18T15:00:00Z'),key='2026-10-18-am';
const s=(id,title,category,summary,extra={})=>({id,title,category,source:'AP News',url:`https://apnews.com/article/${id}`,publishedAt:'2026-10-18T12:00:00Z',sourcePageChecked:true,summary,explanation:summary,editorialText:summary,...extra});
const lead=s('nyt','Congress approves a national spending agreement','Top story','Congress passed a national spending agreement with consequences for federal services and public funding.',{source:'The New York Times',url:'https://www.nytimes.com/2026/10/18/us/test.html',nytHomeLead:true,feedChecked:true});
const battery=s('battery','Scientists demonstrate a battery safety breakthrough','Science','Researchers demonstrated a new battery mechanism that limits thermal runaway in electric vehicles and improves energy storage safety.');
const robot=s('robot','Engineers demonstrate a new sensor for robot controllers','Technology','Engineers demonstrated a new embedded electronics sensor and microcontroller design for robotics and Bluetooth controllers.');
const us=s('school','Massachusetts changes school funding rules','U.S.','The state changed school funding rules affecting high-school students, school budgets and research opportunities.');
const world=s('world','Ukraine launches a major drone attack','World','Ukraine announced a major attack on military targets with significant consequences for the war and regional security.');
const base=[world,robot,us,battery];
test('five slots follow NYT, two personal interests, US, world in that exact order',()=>{
 const result=selectPersonalBriefing(base,{now,key,nytLead:lead});assert.equal(result.length,5);assert.equal(result[0].id,'nyt');assert.deepEqual(result.map(s=>s.briefingSlot),[1,2,3,4,5]);assert.ok(result.slice(1,3).every(s=>['battery','robot'].includes(s.id)));assert.equal(result[3].id,'school');assert.equal(result[4].id,'world');
});
test('school name alone and an unrelated dog feature do not create personal relevance',()=>{
 assert.equal(personalRelevance(s('dog','A hairless dog in Peru has an unusual appearance','Science','The dog is a locally admired pet with an unusual coat.')).score,0);
 assert.equal(personalRelevance(s('rice','Rice University appoints a new dining director','Education','The university announced a new dining manager for campus cafeterias.')).score,0);
 assert.ok(personalRelevance(battery).score>=90);
 assert.ok(personalRelevance(s('aid','UT Austin expands major merit scholarships','Education','UT Austin expanded full tuition scholarships and financial aid for engineering applicants.')).score>=95);
});
test('Publisher scoring cannot displace the actual first NYT feed item',()=>{
 const second={...lead,id:'second',url:'https://www.nytimes.com/2026/10/18/world/second.html',nytHomeLead:false,title:'Unprecedented breakthrough affects millions'};
 const result=selectPersonalBriefing([second,...base],{now,key,nytLead:lead});assert.equal(result[0].id,'nyt');
});
test('unchanged NYT lead is allowed with a label while personal stories are not recycled',()=>{
 const history={nyt:{...lead,editionKey:'2026-10-17-pm'},battery:{...battery,editionKey:'2026-10-17-pm'}};
 const replacement=s('code','AI researchers demonstrate a new computing method','Technology','Researchers demonstrated a new AI computing method that improves software security and helps programmers find vulnerabilities.');
 const result=selectPersonalBriefing([...base,replacement],{now,key,history,nytLead:lead});assert.ok(result[0].leadUnchanged);assert.ok(!result.slice(1,3).some(s=>s.id==='battery'));
});
test('public NYT feed summary is permitted without pretending to have read the full article',()=>{
 const feed={...lead,sourcePageChecked:false,eventDateVerified:false,summaryKind:'NYT public-feed summary · full article unavailable'};
 const result=selectPersonalBriefing(base,{now,key,nytLead:feed});assert.equal(result[0].sourcePageChecked,false);assert.equal(result[0].summaryKind,feed.summaryKind);
});
test('outage keeps five with an honest NYT unavailable label instead of relabeling AP as NYT',()=>{
 const result=selectPersonalBriefing(base,{now,key,fallback:[...base,s('extra','A major new national policy changes student loan rules','U.S.','Congress changed national student loan rules affecting millions of borrowers and college costs.')]});
 assert.equal(result.length,5);assert.ok(result[0].nytUnavailable);assert.notEqual(result[0].source,'The New York Times');assert.match(result[0].slotLabel,/unavailable/);
});
test('published order remains fixed through refresh and the next check-in',()=>{
 const result=selectPersonalBriefing(base,{now,key,nytLead:lead});const next=publishedPersonalBriefing([...result].reverse(),{key:'2026-10-18-pm',editionKey:key});assert.deepEqual(next.map(s=>s.id),result.map(s=>s.id));assert.ok(next.every(s=>s.carriedForward));assert.equal(next.length,5);
});
test('a third urgent eligibility change can replace a default slot with an explicit explanation',()=>{
 const urgent=[s('rotc','ROTC scholarship eligibility suspended','Education','ROTC scholarship eligibility has been suspended under new requirements that affect applications and officer training.'),s('aid','Major financial aid program canceled','Education','A substantial financial aid program was canceled, removing full tuition scholarships for engineering applicants.'),s('visa','New student visa eligibility rules announced','U.S.','New student visa eligibility requirements affect college applicants and their ability to enroll this year.')];
 const result=selectPersonalBriefing([...base,...urgent],{now,key,nytLead:lead});assert.equal(result.length,5);assert.equal(result[0].id,'nyt');assert.ok(result.some(s=>s.slotOverride&&s.slotLabel==='Affects you'&&s.overrideReason));
});
test('geography distinguishes domestic policy from overseas conflict even with feed mislabels',()=>{
 assert.equal(newsGeography({...world,category:'Business'}),'world');assert.equal(newsGeography(us),'us');assert.equal(newsGeography(s('fr','France changes its national tax laws','World','The French government announced a new law.')),'world');
});
test('research records the official first feed item when NYT pages deny access',async()=>{
 const feed=`<?xml version="1.0"?><rss><channel><item><title>NYT first story</title><link>https://www.nytimes.com/2026/10/18/us/first.html</link><pubDate>Sun, 18 Oct 2026 12:00:00 GMT</pubDate><description>The official feed describes the lead development with a factual summary supplied by the publisher.</description></item><item><title>NYT second story</title><link>https://www.nytimes.com/2026/10/18/us/second.html</link><pubDate>Sun, 18 Oct 2026 12:00:00 GMT</pubDate><description>A more sensational second story should never displace the first feed item.</description></item></channel></rss>`;
 const fetcher=async url=>new Response(url==='https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'?feed:'Blocked',{status:url==='https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'?200:403});
 const n=await researchNews({fetcher,now});assert.equal(n.nytLead.title,'NYT first story');assert.equal(n.nytLead.sourcePageChecked,false);assert.equal(n.nytStatus.available,true);assert.match(n.nytLead.summaryKind,/public-feed/);
});
test('incidental AI crime coverage and speculative jobs articles are not engineering connections',()=>{
 assert.equal(personalRelevance(s('crime','AI CSAM case leads to arrest of prosecutor','Technology','A prosecutor is charged in a criminal case involving images generated with AI.')).score,0);
 assert.equal(personalRelevance(s('jobs','AI, Robots, and Jobs: Why Gardeners May Still Be Safe','Technology','AI and robots could someday replace gardening jobs, according to an analyst.')).score,0);
 const generic=s('hawaii','University of Hawai’i expands direct admissions to 10 campuses','Education','The system expanded direct admissions at its campuses.');assert.equal(personalRelevance(generic).critical,false);assert.equal(personalRelevance(generic).score,0);
});
test('the world slot does not repeat the NYT lead under a different headline',()=>{
 const france={...lead,title:'France in Shock After Protests Turn Into Riots, Damaging Buildings and Shops'};
 const duplicate=s('paris','Arrests over France protests rise to 1,800, with streets in Paris devastated','World','Thousands were arrested after major demonstrations and riots across France.');
 const result=selectPersonalBriefing([...base,duplicate],{now,key,nytLead:france});assert.equal(result[0].id,'nyt');assert.ok(!result.some(s=>s.id==='paris'));assert.equal(result[4].id,'world');
});
test('sponsored engineering content is excluded even when it matches battery interests',async()=>{
 const {editoriallyEligible}=await import('../public/news.js');const ad=s('ad','Simulation App Speeds Up Electric Truck Battery Design','Technology','This article is brought to you by COMSOL. The new product is promoted for electric truck battery research.');assert.equal(editoriallyEligible(ad),false);
});
test('scheduled research upgrades legacy editions and retries NYT outages after an hour',async()=>{
 const {briefingDue}=await import('../lib/briefing-schedule.mjs');const previous={fetchedAt:'2026-10-18T13:00:00Z',news:{schemaVersion:2,layout:PERSONAL_NEWS_LAYOUT,editionKey:key,freshCount:5,nytStatus:{available:true},stories:[1,2,3,4,5]}};assert.equal(briefingDue(previous,now),false);assert.equal(briefingDue({...previous,news:{...previous.news,nytStatus:{available:false}}},now),true);assert.equal(briefingDue({...previous,news:{...previous.news,layout:undefined}},now),true);
});
