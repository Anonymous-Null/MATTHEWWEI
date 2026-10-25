import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialAssessment,personalStoryEligible,publicNewsScope,selectPersonalBriefing,cleanNewsText,EDITORIAL_VERSION,PERSONAL_NEWS_LAYOUT,studentPresentation} from '../public/news.js';
import {readingQueue} from '../lib/discovery.mjs';
import {searchStories,NEWS_SEARCHES} from '../lib/news-search.mjs';
import {parseSourceArticle} from '../lib/research.mjs';
import {briefingDue} from '../lib/briefing-schedule.mjs';
// Editorial fixtures illustrate preferences; they are not published news claims.
const now=new Date('2026-10-25T15:00:00Z');
const make=(id,title,text,extra={})=>({id,url:`https://apnews.com/article/${id}`,source:'AP News',category:'Technology',title,editorialText:text,explanation:text,summary:text,sourcePageChecked:true,publishedAt:now.toISOString(),...extra});
const lead=make('lead','Congress passes a spending agreement','Congress passed a federal spending agreement affecting national services.',{source:'The New York Times',url:'https://www.nytimes.com/lead',nytHomeLead:true,feedChecked:true});
const sensor=make('sensor','Engineers build a sensor that runs without a battery','Researchers built a temperature sensor that collects energy from nearby electrical wiring. The sensor can operate for 24 hours without new energy.');
const security=make('security','AI company deliberately reduces its model’s hacking ability','The company deliberately removed training data to reduce the AI model’s hacking ability. Its internal test results have not been independently verified.');
const us=make('us','Federal court blocks nationwide student aid cuts','A federal court blocked nationwide cuts affecting millions of students.',{category:'U.S.'});
const world=make('world','France closes museums during nationwide protests','The government closed museums after hundreds of thousands of protesters demanded education funding.',{category:'World'});

test('interesting engineering and a consequential AI tradeoff outrank a routine topic match',()=>{
  const routine=make('routine','Company introduces its newest AI model','The company announced a new AI model and says the system will help users write emails.');
  assert.equal(personalStoryEligible(sensor),true);assert.equal(personalStoryEligible(security),true);
  assert.equal(personalStoryEligible(routine),false);
  assert.ok(editorialAssessment(sensor).score>editorialAssessment(routine).score);
  assert.ok(editorialAssessment(security).score>editorialAssessment(routine).score);
});
test('wrong subjects and campaign appearances cannot return via the archive',()=>{
  const storm=make('storm','Storms batter Europe, hitting power supplies, flights and phones','Airports canceled flights as power supplies failed. Who’s behind this story? A physics researcher writes about new sensors.');
  const offer=make('offer','Australia offers astronaut for space mission','The government offered an astronaut a place on a planned mission. The first flight would be in two years.');
  const rally=make('rally','Obama rallies rapturous Michigan crowd for Senate candidate','The president appeared before thousands of voters and promised changes to federal healthcare.',{category:'U.S.'});
  const board=make('board','Brazil election: Live second round results','President candidate one: 0%. President candidate two: 0%.',{category:'World'});
  assert.equal(personalStoryEligible(storm),false);assert.equal(personalStoryEligible(offer),false);
  assert.equal(publicNewsScope(rally),null);assert.equal(publicNewsScope(board),null);
  const selected=selectPersonalBriefing([sensor,security,us,world],{now,key:'2026-10-25-am',nytLead:lead,fallback:[storm,offer,rally,board]});
  assert.equal(selected.length,5);assert.ok(!selected.some(s=>['storm','offer','rally','board'].includes(s.id)));
});
test('noun matches, negated findings, and background explainers are not demonstrated results',()=>{
  for(const s of [make('powers','Why nations choose sides in the AI race','The United States and China are the leading AI powers.'),make('never','Scientists may discover a new space phenomenon','Scientists assumed the phenomenon could occur, but it has never been observed.'),make('author','College researcher discusses a new theory','The researcher was first author of a paper about batteries.')])assert.equal(editorialAssessment(s).evidence['demonstrated result'],undefined,s.title);
});
test('reader preferences work across consecutive editions, without handpicked story URLs',()=>{
  const first=selectPersonalBriefing([sensor,security,us,world],{now,key:'2026-10-25-am',nytLead:lead});
  const history=Object.fromEntries(first.map(s=>[s.id,{...s,editionKey:'2026-10-25-am',seenAt:now.toISOString()}]));
  const evening=new Date('2026-10-25T23:30:00Z');
  const next=[make('fresh-device','Scientists create a battery that prevents fires','Researchers demonstrated a new battery design that prevents fires in electric cars.'),make('fresh-privacy','Software bug exposes private phone recordings','The company confirmed a software bug that exposed private recordings to other users.'),make('fresh-us','Supreme Court overturns a national surveillance rule','The Supreme Court overturned a national government surveillance rule.',{category:'U.S.'}),make('fresh-world','Japan orders evacuations after major earthquake','The government ordered hundreds of thousands of residents to evacuate after an earthquake.',{category:'World'})].map(s=>({...s,publishedAt:evening.toISOString()}));
  const result=selectPersonalBriefing([...first,...next],{now:evening,key:'2026-10-25-pm',history,fallback:first,nytLead:lead});
  assert.equal(result.length,5);assert.ok(result.slice(1).every(s=>s.id.startsWith('fresh-')),JSON.stringify(result.map(s=>[s.id,s.title,s.carriedForward])));
  assert.deepEqual(result.map(s=>s.briefingSlot),[1,2,3,4,5]);
});
test('hourly catch-up cannot consume good stories by rotating a complete edition',()=>{
  const stories=selectPersonalBriefing([sensor,security,us,world],{now,key:'2026-10-25-am',nytLead:lead}).map((s,i)=>({...s,carriedForward:i===2,olderReport:i===1}));
  const payload={fetchedAt:now.toISOString(),news:{schemaVersion:2,editorialVersion:EDITORIAL_VERSION,layout:PERSONAL_NEWS_LAYOUT,editionKey:'2026-10-25-am',stories,nytStatus:{available:true}}};
  assert.equal(briefingDue(payload,new Date('2026-10-25T21:00:00Z')),false);
  assert.equal(briefingDue(payload,new Date('2026-10-25T23:00:00Z')),true);
  assert.equal(briefingDue({...payload,news:{...payload.news,editorialVersion:'old'}},now),true);
});
test('search results resolve to allowed publishers, never an untrusted redirect or spoofed label',()=>{
  const urls=['https://www.techspot.com/news/123-test.html','https://evil.test/story','https://apnews.com.evil.test/article/test','https://apnews.com@evil.test/article/test','https://apnews.com:444/article/test'];
  const xml='<rss><channel>'+urls.map(url=>`<item><title>A discovered report about new technology</title><description>A search snippet is only a discovery hint.</description><pubDate>Sun, 25 Oct 2026 12:00:00 GMT</pubDate><link>${('https://www.bing.com/news/apiclick.aspx?url='+encodeURIComponent(url)).replaceAll('&','&amp;')}</link></item>`).join('')+'</channel></rss>';
  const result=searchStories(xml,{category:'Technology'});assert.equal(result.length,1);assert.equal(result[0].source,'TechSpot');assert.equal(result[0].url,urls[0]);assert.equal(result[0].sourcePageChecked,undefined);
  assert.ok(NEWS_SEARCHES.every(s=>!s.query.includes('2026')&&!s.query.includes('Moonshot')));
});
test('multiple feeds from one publisher do not crowd out other sources',()=>{
  const pool=id=>Array.from({length:8},(_,i)=>make(id+i,'An interesting report','A new development.',{source:'Large publisher'}));
  const output=readingQueue([pool('a'),pool('b'),pool('c'),[make('independent','A new discovery','Researchers found a result.',{source:'Independent source'})]],{now,limit:2});
  assert.ok(output.some(s=>s.id==='independent'));
});
test('split source bodies keep the lead and direct journal links expose the actual paper DOI',()=>{
  const html='<article><div class="post-content"><p>Researchers observed a cloud over a volcano on Mars. The paper was published earlier this month.</p><a href="https://www.nature.com/articles/s41561-026-02089-9">The paper</a></div><div class="post-content"><p>Measurements showed a different physical process from clouds on Earth.</p></div></article>';
  const article=parseSourceArticle(html,{source:'Ars Technica',title:'A cloud on Mars'});
  assert.match(article.text,/Researchers observed/);assert.match(article.text,/Measurements showed/);assert.ok(article.dois.includes('10.1038/s41561-026-02089-9'));
});
test('summaries exclude biographies and use generic wording without inventing outcomes',()=>{
  assert.equal(cleanNewsText('The experiment powered a sensor. Who’s behind this story? An engineer. © 2026 Publisher'),'The experiment powered a sensor.');
  const input=make('example','A sensor result','The device inadvertently used more power during the test.');
  const output=studentPresentation(input);assert.match(output.explanation,/by accident/);assert.doesNotMatch(output.explanation,/fixed|solved/);
});
