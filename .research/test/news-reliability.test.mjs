import test from 'node:test';
import assert from 'node:assert/strict';
import {editoriallyEligible,personalStoryEligible,personalRelevance,selectPersonalBriefing,samePersonalDevelopment,rankStories} from '../public/news.js';
import {eventDateInText,parseSourceArticle} from '../lib/research.mjs';
import {checkBriefingLinks,selectAccessibleBriefing} from '../lib/briefing-links.mjs';
import {parseFeed} from '../lib/providers.mjs';
import {briefingDue} from '../lib/briefing-schedule.mjs';
import {PERSONAL_NEWS_LAYOUT} from '../public/news.js';
const now=new Date('2026-10-23T23:15:00Z'),key='2026-10-23-pm';
const story=(id,title,category,summary,extra={})=>({id,title,category,summary,explanation:summary,editorialText:summary,source:'AP News',url:`https://apnews.com/article/${id}`,publishedAt:now.toISOString(),sourcePageChecked:true,...extra});

test('the exact Alaska headlines are one development, not two briefing slots',()=>{
  const a=story('a','Trump Officials Seek Block on Alaska Senate Race Results if the Republican Dan Sullivan Loses','U.S.','Justice Department officials seek to block certification of the Alaska election results.');
  const b=story('b','Trump says he ordered DoJ to file lawsuit to block Alaska Senate results certification','U.S.','The president ordered a federal lawsuit on Alaska Senate results.');
  assert.equal(samePersonalDevelopment(a,b),true);
});
test('the exact weak personal stories, opinion, stock chatter and image features cannot fill slots 2–3',()=>{
  const rejected=[
    story('intel','Intel gets waiver after worries fuzzy US ban on foreign-made robots may hit fabs','Technology','Intel received a compliance waiver for robotic vehicles in chip manufacturing.'),
    story('opinion','Can AI really predict cancer survival better than a doctor? I have my doubts','Science','Researchers developed a model to predict outcomes.',{url:'https://www.theguardian.com/commentisfree/2026/oct/23/ai-cancer-survival'}),
    story('uber',"Uber uses OpenAI's ChatGPT Work after major layoffs",'Technology','The company gave employees access to an enterprise AI tool.'),
    story('stock','Sharp drops for AI stocks overwhelm markets worldwide as oil prices jump','Technology','Computer stocks fell on the stock market today.'),
    story('photo','El Niño Then and Now - NASA Science','Science','4 min read Image of the Day for October 23, 2026 NASA published a new satellite image.'),
    story('profile','Preethi Ashwath Went From Chip Lab to Center Stage','Technology','An engineer talks about the new chips she has helped design.'),
  ];
  for(const s of rejected)assert.equal(personalStoryEligible(s),false,s.title);
  const college=story('college','MIT expands full-tuition scholarships for undergraduate applicants','Education','MIT expanded a substantial financial aid program for undergraduate students.');assert.equal(personalStoryEligible(college),true);
  assert.equal(personalRelevance(story('lab','Rice scientists discover a new battery material','Science','Researchers at Rice University developed an alloy for safer battery storage.')).topics.includes('college-access'),false);
});
test('today’s publication date cannot freshen a driving record set on October 11',()=>{
  const s=story('mars',"NASA's Perseverance breaks the off-world driving record",'Science','As its odometer ticked off 45.22 kilometers on October 11, it surpassed the driving record set by Opportunity.');
  const date=eventDateInText(s.summary,s.publishedAt,s);assert.equal(date.date,'2026-10-11');assert.deepEqual(rankStories([{...s,eventDate:date.date}],now,{broad:true,minScore:0}),[]);
});
test('fresh generation avoids earlier stories even in the same morning/evening window',()=>{
  const lead=story('nyt','Congress approves nationwide student aid funding','Top story','Congress approved national education spending.',{source:'The New York Times',url:'https://www.nytimes.com/2026/10/23/us/test.html',nytHomeLead:true,feedChecked:true});
  const personal=[story('battery','Engineers build a safer battery for electric cars','Technology','Engineers built and tested a new battery mechanism that prevents fires.'),story('robot','Researchers demonstrate a robot sensor','Technology','Researchers demonstrated a new sensor for robotics and Bluetooth controllers.')];
  const us=story('us','Massachusetts changes school funding rules','U.S.','The state changed school funding rules affecting thousands of students.'),world=story('world','Ukraine launches major drone attack on military facilities','World','Ukraine launched a new attack in the war.');
  const first=selectPersonalBriefing([...personal,us,world],{now,key,nytLead:lead});assert.equal(first.length,5);
  const history=Object.fromEntries(first.map(s=>[s.id,{...s,editionKey:key,seenAt:now.toISOString()}]));
  const fresh=[story('new-battery','Scientists demonstrate a new battery fire safety system','Science','Scientists demonstrated a battery safety mechanism for electric vehicles.'),story('new-robot','Engineers create a Bluetooth controller for small robots','Technology','Engineers created a microcontroller design with new sensors for robots.'),story('new-us','Federal court blocks nationwide student loan cuts','U.S.','A federal court blocked nationwide student loan cuts affecting millions of borrowers.'),story('new-world','Chile orders evacuations after major earthquake','World','Chile ordered evacuations after an earthquake affected thousands of residents.')];
  const next=selectPersonalBriefing([...first,...fresh],{now,key,history,fallback:first,nytLead:lead});assert.equal(next.length,5);assert.equal(next[0].leadUnchanged,true);assert.ok(next.slice(1).every(s=>s.id.startsWith('new-')));
});
test('opinion is labeled from its URL and generated photographs are not presented as real',()=>{
  const [s]=parseFeed('<rss><channel><item><title>Can AI predict survival?</title><link>https://www.theguardian.com/commentisfree/2026/oct/23/ai</link><description>A column about research.</description><pubDate>Fri, 23 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>',{source:'The Guardian',category:'Science'});
  assert.equal(s.coverage,'Opinion');assert.equal(editoriallyEligible(s),false);
  const html='<meta property="og:image" content="https://www.sciencedaily.com/image.webp"><div id="story_text"><p>A new sensor was developed.</p></div><figure><img src="https://www.sciencedaily.com/image.webp"><figcaption>University image generated by ChatGPT</figcaption></figure>';
  assert.equal(parseSourceArticle(html,{source:'ScienceDaily',title:'A new sensor'}).imageUrl,null);
});
test('prepublication link checks reject dead or subscription-only articles; the NYT lead exception is explicit',async()=>{
  const text='Researchers announced a new battery safety system on Friday. The team tested the system in electric vehicles and described the results in an original source report. Their experiment measured temperatures during repeated charging cycles. It gives readers a clear account of what was tested, what happened, and which questions remain unresolved. The researchers said additional testing would be needed before the technology could be used in consumer cars.';
  const html=paid=>`<html><head><title>Researchers test a battery safety system</title><script type="application/ld+json">${JSON.stringify({'@type':'NewsArticle',isAccessibleForFree:!paid})}</script></head><body><main><article><p>${text}</p><p>The team provided a detailed explanation of its experimental methods, along with measurements from each trial. The source report also identifies the researchers and describes the limits of their findings.</p></article></main></body></html>`;
  const input=[story('free','A new battery safety system','Science',text,{briefingSlot:2}),story('paid','A new robot','Technology',text,{briefingSlot:3}),story('dead','A new federal rule','U.S.',text,{briefingSlot:4}),story('nyt','NYT lead','Top story',text,{source:'The New York Times',url:'https://www.nytimes.com/lead',briefingSlot:1,feedChecked:true})];
  const fetcher=async url=>url.includes('nytimes')?new Response('Forbidden',{status:403}):url.endsWith('/dead')?new Response('Not found',{status:404}):new Response(html(url.endsWith('/paid')));
  const results=await checkBriefingLinks(input,{fetcher,now});assert.equal(results[0].story.linkStatus,200);assert.match(results[1].error,/subscription/);assert.match(results[2].error,/404/);assert.equal(results[3].story.articleAccess,'feed-only');assert.match(results[3].story.summaryKind,/subscription/);
});
test('an unchanged NYT lead alone does not churn complete editions or misrepresent a fresh story',()=>{
  const previous={fetchedAt:'2026-10-23T19:00:00Z',news:{editorialVersion:"evidence-first-2026-10-25",schemaVersion:2,layout:PERSONAL_NEWS_LAYOUT,editionKey:key,freshCount:4,nytStatus:{available:true},stories:[story('nyt','Top NYT story','Top story','A source report.',{briefingSlot:1,leadUnchanged:true}),story('a','Engineers build a safer battery','Science','Engineers built a new battery mechanism for electric cars.',{briefingSlot:2}),story('b','NASA builds a new Moon telescope','Science','NASA built a new telescope and demonstrated sharper images of the Moon.',{briefingSlot:3}),story('us','Congress approves national student aid legislation','U.S.','Congress approved a federal student aid law affecting millions of students.',{briefingSlot:4}),story('world','Ukraine launches a major drone attack','World','Ukraine launched a major attack on military facilities in Russia.',{briefingSlot:5})]}};
  assert.equal(briefingDue(previous,now),false);assert.equal(briefingDue({...previous,news:{...previous.news,stories:previous.news.stories.map((s,i)=>i===1?{...s,carriedForward:true}:s)}},now),false);
});
test('replacing an inaccessible personal article preserves five distinct slot assignments',async()=>{
  const text='Researchers announced a successful battery test on Friday. Their new system was tested in a series of controlled experiments. They documented measurements, described their methods, and identified the limitations of the result. The report explains that the finding is an early demonstration and that more trials are needed. The researchers published the full results with a detailed account of the evidence. They also explained how other teams could repeat the experiment to check the outcome.';
  const lead=story('nyt','Congress approves national funding rules','Top story',text,{source:'The New York Times',url:'https://www.nytimes.com/lead',feedChecked:true,nytHomeLead:true});
  const candidates=[story('bad','Engineers demonstrate a safer battery for electric cars','Science','Engineers demonstrated a new battery system to prevent thermal runaway and fires.'),story('good','Researchers build a new Bluetooth sensor for robots','Technology','Researchers built a new sensor for small robots and electronic controllers.'),story('alternate','NASA builds a new telescope for sharper Moon images','Science','Engineers built a new space telescope and demonstrated clearer images of the Moon.'),story('us','Massachusetts changes school funding rules','U.S.','The state changed funding for thousands of students.'),story('world','Ukraine launches a major drone attack','World','Ukraine launched drones at military facilities in the war.')];
  const html=`<html><head><title>Checked original report</title></head><body><article><p>${text}</p><p>${text}</p></article></body></html>`;
  const blockedId=selectPersonalBriefing(candidates,{now,key,nytLead:lead}).find(s=>s.briefingSlot===2).id;
  const fetcher=async url=>url.includes('nytimes')?new Response('Blocked',{status:403}):url.endsWith('/'+blockedId)?new Response('Gone',{status:410}):new Response(html);
  const result=await selectAccessibleBriefing(candidates,{now,key,nytLead:lead},{fetcher});
  assert.equal(result.selected.length,5);assert.deepEqual(result.selected.map(s=>s.briefingSlot),[1,2,3,4,5]);assert.equal(result.selected.some(s=>s.id===blockedId),false);assert.ok(result.rejectedLinks.some(s=>s.id===blockedId));
});

test('a hypothetical local park plan is not a reported national action',async()=>{
  const {publicNewsScope}=await import('../public/news.js');
  const park=story('park',"A D.C. park was made 'for the pleasure of the people.' Trump's plan would change that",'U.S.','The president has proposed changing a local park in Washington, D.C.');
  assert.equal(publicNewsScope(park),null);
});
