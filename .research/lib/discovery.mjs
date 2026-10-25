import { parseHTML } from 'linkedom';
import { plainText, editorialAssessment } from '../public/news.js';

// Publisher section editors surface stories that short, topic-specific feeds miss.
export const NEWS_SECTIONS = [
  {url:'https://news.uark.edu/',source:'Arkansas News',category:'Science',articlePath:'^/articles/[0-9]+/[^/]+$'},
  {url:'https://www.theverge.com/tech',source:'The Verge',category:'Technology',articlePath:'^/(?:tech|news|science|ai-artificial-intelligence)/[0-9]+/[^/]+$'},
  {url:'https://www.bbc.com/news/technology',source:'BBC News',category:'Technology',articlePath:'^/news/articles/[^/]+$'},
  {url:'https://www.bbc.com/innovation',source:'BBC News',category:'Science',articlePath:'^/(?:news/articles|future/article|innovation/article)/[^/]+$'},

  {url:'https://apnews.com/hub/russia-ukraine',source:'AP News',category:'World'},
  {url:'https://apnews.com/us-news',source:'AP News',category:'U.S.'},
  {url:'https://apnews.com/hub/education',source:'AP News',category:'Education'},
  {url:'https://apnews.com/',source:'AP News',category:'World'},
  ...[['world-news','World'],['science','Science'],['technology','Technology'],['politics','U.S.'],['business','Business']].map(([path,category]) => ({url:`https://apnews.com/${path}`,source:'AP News',category})),
  {url:'https://www.businessinsider.com/sai',source:'Business Insider',category:'Technology'},
];
export function sectionStories(html, section) {
  const {document}=parseHTML(html), root=document.querySelector('main') || document;
  const found=new Map(), host=new URL(section.url).hostname;
  for(const a of root.querySelectorAll('a[href]')) {
    const title=plainText(a.textContent);
    if(title.length<25 || title.length>220) continue;
    let url; try {url=new URL(a.getAttribute('href'),section.url);} catch {continue;}
    if(url.protocol!=='https:' || url.hostname!==host || url.username || url.password || url.port) continue;
    if(section.articlePath ? !new RegExp(section.articlePath).test(url.pathname) : section.source==='AP News' ? !/^\/article\/[^/]+$/.test(url.pathname) : !/-20\d{2}-\d{1,2}$/.test(url.pathname)) continue;
    url.search='';url.hash='';
    if(!found.has(url.href)) found.set(url.href,{id:url.href,url:url.href,title,summary:'',publishedAt:null,source:section.source,category:section.category,discovery:'Publisher section'});
  }
  return [...found.values()].slice(0,45);
}

// No interest-score cutoff before reading. Share the reading budget across
// discovery channels so a prolific science feed cannot crowd out world news.
export function readingQueue(pools,{now=new Date(),limit=180}={}) {
  const seen=new Set(),out=[];
  const priority = s => s.nytHomeLead ? 1000 : editorialAssessment(s).score + (/\b(no kings|nationwide|mass protests?|airstrikes?|missile strikes?|drone attacks?|ceasefire|coup|discovery|discovered|spacecraft|telescope|scientists|researchers)\b/i.test(s.title || '') ? 20 : 0);
  const channels=pools.map(pool=>pool.filter(s=> {
    const time=Date.parse(s.publishedAt);
    return !s.publishedAt || Number.isFinite(time) && +now-time<=48*3600000 && time<=+now+3600000;
  }).sort((a,b)=>priority(b)-priority(a)));
  // Balance publishers, not feed counts: seven feeds from one newspaper must
  // not buy seven times the reading budget of an independent science source.
  const publishers=new Map();
  channels.forEach((channel,i)=>{
    const source=channel[0]?.source || `channel-${i}`;
    if(!publishers.has(source))publishers.set(source,[]);
    publishers.get(source).push(channel);
  });
  const queues=[...publishers.values()].map(group=>{
    const queue=[],ids=new Set();
    for(let i=0;group.some(c=>i<c.length);i++)for(const channel of group){
      const s=channel[i];if(s&&!ids.has(s.id)){ids.add(s.id);queue.push(s);}
    }
    return queue.sort((a,b)=>priority(b)-priority(a));
  });
  for(let i=0;out.length<limit && queues.some(q=>i<q.length);i++) {
    for(const q of queues) {
      const s=q[i];if(!s || seen.has(s.id)) continue;
      seen.add(s.id);out.push(s);if(out.length===limit) break;
    }
  }
  return out;
}
