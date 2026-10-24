import {fetchArticle,parseSourceArticle} from './research.mjs';
import {selectPersonalBriefing} from '../public/news.js';

export async function selectAccessibleBriefing(stories,options={}, {fetcher=fetch}={}) {
  const rejectedLinks=new Map(),checkedLinks=new Map();
  let selected=[];
  for(let attempt=0;attempt<4;attempt++){
    selected=selectPersonalBriefing(stories.filter(s=>!rejectedLinks.has(s.id)),{...options,fallback:(options.fallback || []).filter(s=>!rejectedLinks.has(s.id)),nytLead:rejectedLinks.has(options.nytLead?.id)?null:options.nytLead});
    const checks=await checkBriefingLinks(selected.filter(s=>!checkedLinks.has(s.id)),{fetcher,now:options.now || new Date()});
    for(const check of checks)if(check.story)checkedLinks.set(check.story.id,check.story);else rejectedLinks.set(check.id,check.error);
    if(checks.every(c=>c.story)){
      selected=selected.map(story=>{
        const checked=checkedLinks.get(story.id),next={...story};
        // A replacement can move a card to a different slot. Carry delivery
        // evidence forward, never the first attempt's slot or stale labels.
        for(const field of ['url','sourcePageChecked','articleAccess','linkStatus','linkCheckedAt','summaryKind','articleAccessError','nytFeedSummary'])if(checked[field]!==undefined)next[field]=checked[field];
        if(checked.articleAccess==='feed-only')next.explanation=checked.explanation;
        return next;
      });
      break;
    }
  }
  if(selected.some(s=>rejectedLinks.has(s.id)))throw new Error('No complete briefing with usable article links; retaining the previous edition.');
  return {selected,linksChecked:checkedLinks.size,rejectedLinks:[...rejectedLinks].map(([id,reason])=>({id,reason}))};
}

// Run just before publication, including for archive/fallback cards. A readable
// page checked yesterday is not proof that today's displayed link still works.
export async function checkBriefingLinks(stories,{fetcher=fetch,now=new Date()}={}) {
  return Promise.all(stories.map(async story=>{
    const delivery={};
    try {
      const html=await fetchArticle(story,fetcher,delivery);
      const article=parseSourceArticle(html,story);
      if(article.paywalled || article.text.trim().split(/\s+/).length<60)throw new Error(article.paywalled?'The article requires a subscription':'The article page did not expose readable reporting');
      return {story:{...story,url:delivery.url || story.url,sourcePageChecked:true,articleAccess:'readable',linkStatus:delivery.status,linkCheckedAt:now.toISOString()}};
    } catch(error) {
      // The user explicitly requested the NYT lead. Its official feed summary
      // remains usable when the publisher blocks automated full-text access;
      // this exception is visible and never applies to the other four cards.
      const feedLead=story.briefingSlot===1 && story.source==='The New York Times' && story.feedChecked;
      if(feedLead && !/HTTP (?:404|410)/.test(error.message))return {story:{...story,explanation:story.originalSummary||story.summary,sourcePageChecked:false,nytFeedSummary:true,articleAccess:'feed-only',summaryKind:'NYT public-feed summary · publisher access may require a subscription',linkCheckedAt:now.toISOString(),articleAccessError:error.message}};
      return {id:story.id,error:error.message};
    }
  }));
}
