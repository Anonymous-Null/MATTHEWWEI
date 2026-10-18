import { parseHTML } from 'linkedom';
import { plainText } from '../public/news.js';

// Publisher section editors surface stories that short, topic-specific feeds miss.
export const NEWS_SECTIONS = [
  {url:'https://apnews.com/hub/russia-ukraine',source:'AP News',category:'World'},
  {url:'https://apnews.com/us-news',source:'AP News',category:'U.S.'},
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
    if(section.source==='AP News' ? !/^\/article\/[^/]+$/.test(url.pathname) : !/-20\d{2}-\d{1,2}$/.test(url.pathname)) continue;
    url.search='';url.hash='';
    if(!found.has(url.href)) found.set(url.href,{id:url.href,url:url.href,title,summary:'',publishedAt:null,source:section.source,category:section.category,discovery:'Publisher section'});
  }
  return [...found.values()].slice(0,45);
}

// No interest-score cutoff before reading. Share the reading budget across
// discovery channels so a prolific science feed cannot crowd out world news.
export function readingQueue(pools,{now=new Date(),limit=180}={}) {
  const seen=new Set(),out=[];
  const priority = s => /\b(no kings|nationwide|mass protests?|airstrikes?|missile strikes?|drone attacks?|ukrain\w*.{0,60}(?:strikes?|drones?)|ceasefire|coup|breakthrough|discovery|discovered|spacecraft|telescope|quantum|robotics|scientists|researchers)\b/i.test(s.title || '') ? 1 : 0;
  const queues=pools.map(pool=>pool.filter(s=> {
    const time=Date.parse(s.publishedAt);
    return !s.publishedAt || Number.isFinite(time) && +now-time<=48*3600000 && time<=+now+3600000;
  }).sort((a,b)=>priority(b)-priority(a)));
  for(let i=0;out.length<limit && queues.some(q=>i<q.length);i++) {
    for(const q of queues) {
      const s=q[i];if(!s || seen.has(s.id)) continue;
      seen.add(s.id);out.push(s);if(out.length===limit) break;
    }
  }
  return out;
}
