import {parseFeed} from './providers.mjs';
import {publisherForUrl} from './news-sources.mjs';

// Broad, reusable searches. No story names, dates or handpicked article URLs.
export const NEWS_SEARCHES = [
  {query:'AI hacking (site:reuters.com OR site:thenextweb.com OR site:digitaltrends.com OR site:arstechnica.com)',category:'Technology'},
  {query:'privacy (site:arstechnica.com OR site:techspot.com OR site:theverge.com OR site:androidauthority.com)',category:'Technology'},
  {query:'discovery (site:nature.com OR site:sciencenews.org OR site:sciencealert.com OR site:phys.org)',category:'Science'},
  {query:'battery sensor (site:phys.org OR site:sciencedaily.com OR site:news.mit.edu)',category:'Science'},
  {query:'spacecraft aviation (site:nasa.gov OR site:bbc.com OR site:apnews.com)',category:'Science'},
  {query:'admissions scholarships (site:apnews.com OR site:highereddive.com OR site:nytimes.com)',category:'Education'},
  {query:'US federal court (site:apnews.com OR site:reuters.com OR site:bbc.com)',category:'U.S.'},
  {query:'election protests (site:reuters.com OR site:bbc.com OR site:theguardian.com)',category:'World'},
];
export const searchUrl=query=>'https://www.bing.com/news/search?'+new URLSearchParams({q:query,format:'rss',sortbydate:'1',qft:'interval="8"',count:'30'});
export function searchStories(xml,search) {
  return parseFeed(xml,{source:'Search discovery',category:search.category}).flatMap(s=>{
    let wrapper,url;try{wrapper=new URL(s.url);url=new URL(wrapper.hostname==='www.bing.com'&&wrapper.pathname==='/news/apiclick.aspx'?wrapper.searchParams.get('url'):s.url);}catch{return [];}
    const source=publisherForUrl(url.href);if(!source)return [];
    for(const k of [...url.searchParams.keys()])if(k.startsWith('utm_'))url.searchParams.delete(k);
    url.hash='';
    return [{...s,id:url.href,url:url.href,source,discovery:'Live news search',coverage:'Source report'}];
  });
}
