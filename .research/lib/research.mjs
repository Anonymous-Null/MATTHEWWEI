import { NEWS_SECTIONS, sectionStories, readingQueue } from './discovery.mjs';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { NEWS_FEEDS, parseFeed, fetchText } from './providers.mjs';
import { plainText, rankStories, plainLanguageSummary, sourceImage, similarStories } from '../public/news.js';
import { shiftDate, checkInWindow } from '../public/shared.js';

const sourceHosts = {
  'The New York Times':['nytimes.com'], 'IEEE Spectrum':['spectrum.ieee.org'],
  'AP News':['apnews.com'], 'Business Insider':['businessinsider.com'], 'Investing.com':['investing.com'],
  'BBC News': ['bbc.com', 'bbc.co.uk'], NPR: ['npr.org'], 'Ars Technica': ['arstechnica.com'],
  'The Verge': ['theverge.com'], 'Science News': ['sciencenews.org'], ScienceDaily: ['sciencedaily.com'],
  'MIT News': ['news.mit.edu'], 'Higher Ed Dive': ['highereddive.com'], NASA: ['nasa.gov'],
  Nature: ['nature.com'], Science: ['science.org', 'sciencemag.org'],
  'The Guardian': ['theguardian.com'], 'Live Science': ['livescience.com'],
  ScienceAlert: ['sciencealert.com'], 'Phys.org': ['phys.org'],
};
const months = 'january february march april may june july august september october november december'.split(' ');
const weekdays = 'sunday monday tuesday wednesday thursday friday saturday'.split(' ');
const eventVerb = /\b(held|acknowledged|disclosed|announced|signed|killed|struck|issued|ruled|ordered|filed|decided|testified|conducted|discovered|published|demonstrated|achieved|broke|banned|detected|revealed|rescued|erupted|began|invaded|overturned|resigned|collapsed|passed|approved|confirmed|released|attacked|fired|voted|landed|launched|agreed|reached|drove|traveled|covered|captured|died|found|surpassed|crossed|ticked|set|restarted|resumed|reported|outlined|unveiled|developed|built|created)\b/i;
const future = /\b(will|plans to|scheduled to|expected to|is set to)\b/i;
const majorEvent = /\b(signed|overturned|resigned|invaded|ceasefire|banned|approved|erupted|landed|discovered)\b/i;

function validDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
function dayOf(value) { return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || new Date(value).toISOString().slice(0, 10); }
function iso(value) { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; }

export function eventDateInText(text, publishedAt, { title = '', category = '' } = {}) {
  const anchor = dayOf(publishedAt), year = Number(anchor.slice(0, 4));
  const sentences = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text)].map(s => s.segment.trim());
  const generic = new Set('their these those this that with from have about after before today yesterday first ever only more latest research study findings announced published reported reveals breaks down unexpected unprecedented discovery scientists researchers'.split(' '));
  const anchors = [...new Set(title.toLowerCase().match(/[a-z]{4,}/g) || [])].filter(w => !generic.has(w));
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (!eventVerb.test(sentence) || future.test(sentence) || sentence.length > 1000) continue;
    if (/\b(denied|denies|deny|did not|didn't|had not|hadn't|no evidence|unconfirmed)\b/i.test(sentence)
      || /^(Earlier|Previously|Meanwhile|Separately|In a separate|In another)\b/i.test(sentence)) continue;
    // A date for an incidental event elsewhere in the article cannot establish
    // when the headline development happened. Allow the preceding sentence to
    // supply context for phrases such as "the findings were published today".
    const refersBack = /\b(figures|numbers|results|findings|study|paper|the agreement|the decision|the announcement)\b|^(It|They|The team)\b/i.test(sentence);
    const context = `${refersBack ? sentences[i - 1] || '' : ''} ${sentence}`.toLowerCase();
    if (anchors.length && !anchors.some(w => context.includes(w)) && !(['Science','Technology'].includes(category) && /\b(study|paper|findings|discovery)\b/i.test(sentence))) continue;
    let date = sentence.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
    const named = sentence.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sept?\.?|Oct\.?|Nov\.?|Dec\.?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/i);
    if (!date && named) date = `${named[3] || year}-${String(months.findIndex(m=>m.startsWith(named[1].toLowerCase().slice(0,3))) + 1).padStart(2, '0')}-${named[2].padStart(2, '0')}`;
    if(date>anchor && /\b(by|until|deadline)\b/i.test(sentence))date=null;
    if (!date) {
      const weekday = sentence.match(/\b(?:(?:on|this|last)\s+)?(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
      if (weekday) {
        const day = new Date(`${anchor}T12:00:00Z`).getUTCDay();
        let distance = (day - weekdays.indexOf(weekday[1].toLowerCase()) + 7) % 7;
        if (/\blast\b/i.test(weekday[0]) && !distance) distance = 7;
        date = shiftDate(anchor, -distance);
      } else if (/\byesterday\b/i.test(sentence)) date = shiftDate(anchor, -1);
      else if (/\btoday\b/i.test(sentence)) date = anchor;
    }
    if (date && validDay(date)) return { date, kind: /\bpublished\b/i.test(sentence) ? 'Published' : /\bannounced\b/i.test(sentence) ? 'Announced' : 'Event', evidence: sentence };
  }
  return null;
}

export function oldResearchEvidence(text, now = new Date()) {
  const lead = text.split(/\s+/).slice(0, 500).join(' ');
  const match = lead.match(/\b(?:the|this)\b[^.!?]{0,45}\b(?:discovery|study|research|finding)\b[^.!?]{0,90}\b(?:described|published|reported|announced)\b[^.!?]{0,35}\b(?:in|back in)\s+(20\d{2})\b/i);
  return match && Number(match[1]) < now.getUTCFullYear() ? match[0] : null;
}

export function explanationFromText(text, title = '', category = 'Science') {
  const sentences = [...new Intl.Segmenter('en', {granularity:'sentence'}).segment(plainText(text))]
    .map(s=>s.segment.trim()).filter(s=>! /^(subscribe|sign up|advertisement|read more|listen to|share this|copyright|credit:)/i.test(s));
  if (category !== 'Science') {
    const lead=[];let words=0;
    for(const sentence of sentences){const n=sentence.split(/\s+/).length;if(words+n>120)break;lead.push(sentence);words+=n;}
    return lead.join(' ');
  }
  const anchors=[...new Set(title.toLowerCase().match(/[a-z]{4,}/g)||[])].filter(w=>!['this','that','with','from','says','scientists','researchers','research','study','reveals','reveal','mysterious','really','year','years','old'].includes(w));
  let best='',bestScore=-Infinity;
  // Choose a contiguous, complete-sentence passage containing the result.
  // An atmospheric introduction must not consume the whole explanation.
  for(let start=0;start<Math.min(sentences.length,35);start++) {
    let words=0,parts=[];
    for(let i=start;i<sentences.length;i++) {
      const count=sentences[i].split(/\s+/).length;
      if(words+count>120) break;
      parts.push(sentences[i]);words+=count;
      if(words<65) continue;
      const passage=parts.join(' '), lower=passage.toLowerCase();
      const overlap=anchors.filter(w=>lower.includes(w)).length;
      const findings=(passage.match(/\b(found|revealed|reveals|suggests?|challenge|discovered|shows?|demonstrated|concluded|identified|announced|disclosed|issued|signed|waived|arrested|detained|released)\b/gi)||[]).length;
      const evidence=(passage.match(/\b\d+(?:\.\d+)?(?:%| million| billion| times)\b/gi)||[]).length;
      const score=overlap*3+Math.min(findings,3)*4+Math.min(evidence,2)*2-start*0.15;
      if(score>bestScore){bestScore=score;best=passage;}
      if(words>=100) break;
    }
  }
  // Source excerpts remain attributed; no unsupported paraphrased claims.
  return best || sentences.slice(0,2).join(' ');
}

function jsonObjects(document) {
  const out = [];
  const walk = value => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== 'object') return;
    out.push(value); if (value['@graph']) walk(value['@graph']);
  };
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { walk(JSON.parse(script.textContent)); } catch { /* Ignore malformed publisher metadata. */ }
  }
  return out;
}

export function parseSourceArticle(html, story) {
  const { document } = parseHTML(html);
  const metadata = jsonObjects(document).find(o => /(?:NewsArticle|ScholarlyArticle|Article)/.test(String(o['@type']))) || {};
  const meta = key => document.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.getAttribute('content');
  const publication = metadata.datePublished || meta('article:published_time') || meta('datePublished') || document.querySelector('time[datetime]')?.getAttribute('datetime');
  const dateLabel = [...document.querySelectorAll('dt')].find(e => /^date:/i.test(e.textContent.trim()))?.nextElementSibling?.textContent.trim();
  const publishedAt = iso(publication || dateLabel);
  const modifiedAt = iso(metadata.dateModified || meta('article:modified_time'));
  const primary = document.querySelector('#story_text') || document.querySelector('#storytext') || document.querySelector('[data-testid="article-body"]') || document.querySelector('.article__body');
  const bbcBlocks = story.source === 'BBC News' ? [...document.querySelectorAll('[data-component="text-block"]')] : [];
  const readable = new Readability(document.cloneNode(true)).parse();
  const body = bbcBlocks.length ? document.createElement('div') : primary?.cloneNode(true) || parseHTML(`<div>${readable?.content || ''}</div>`).document;
  if (bbcBlocks.length) for (const block of bbcBlocks) body.appendChild(block.cloneNode(true));
  for (const nuisance of body.querySelectorAll('figure,figcaption,button,nav,aside,header,h1,h2,h3,.credit,.caption,.toggle-caption,.image-credit,.captionwrap,.imagewrap,.byline,.headline,.article-header,.bucketwrap,.storyenhancement,.related-story')) nuisance.remove();
  for (const block of body.querySelectorAll('p,div,li,h1,h2,h3,h4,section,blockquote')) block.appendChild(document.createTextNode(' '));
  let text = plainText(body.textContent || body.documentElement?.textContent || '');
  text = text.replace(/^By THE ASSOCIATED PRESS\s*/, '').replace(/^Updated \[hour\]:\[minute\] \[AMPM\] \[timezone\], \[monthFull\] \[day\], \[year\]\s*/, '')
    .replace(/^Skip to content\s*/i, '').replace(/\b\d+ MIN READ\b/g, '');

  if (story.source === 'BBC News') {
    if (text.startsWith(story.title)) text = text.slice(story.title.length).trim();
    text = text.replace(/^By\s*[\p{Lu}][\p{L}'’-]+\s+[\p{Lu}][\p{L}'’-]+\s*/u, '')
      .replace(/^Updated\s+\d+\s+(?:minutes?|hours?|days?)\s+ago\s*/i, '').trim();
  }
  const articleTitle = plainText(metadata.headline || readable?.title || story.title);
  const image = sourceImage(meta('og:image') || meta('twitter:image') || (typeof metadata.image === 'string' ? metadata.image : metadata.image?.url));
  let caption = '';
  if (image) {
    const basename = new URL(image).pathname.split('/').at(-1);
    const img = [...document.querySelectorAll('img')].find(i => (i.getAttribute('src') || i.getAttribute('data-src') || '').includes(basename));
    caption = plainText(img?.closest('figure')?.querySelector('figcaption')?.textContent || '');
  }
  // A publisher's AI illustration is not a real photograph of the event.
  const realImage = /\b(AI|ChatGPT|artificial intelligence|AI-generated|generated image|image generated|artist.s concept)\b/i.test(caption) || (story.source === 'ScienceDaily' && !caption) || /(?:STK\d|stock[-_ ]?(?:photo|image))/i.test(image || '') ? null : image;
  const references = document.querySelector('#journal_references') || [...document.querySelectorAll('strong')].find(e => /journal references?/i.test(e.textContent))?.parentElement?.nextElementSibling;
  const doiArea = references || primary || document;
  const dois = [...doiArea.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /^https?:\/\/(?:dx\.)?doi\.org\//i.test(h)).map(h => h.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, ''));
  const paywalled=metadata.isAccessibleForFree===false || metadata.isAccessibleForFree==='False' || metadata.isAccessibleForFree==='false';
  return { text, articleTitle, publishedAt, modifiedAt, paywalled, imageUrl: realImage, imageCaption: caption, dois: [...new Set(dois)].slice(0, 3) };
}

export async function fetchArticle(story, fetcher = fetch, delivery = {}) {
  let url = story.url;
  const hosts = sourceHosts[story.source] || [];
  for (let hop = 0; hop < 4; hop++) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || !hosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) throw new Error('Unrecognized source-page host');
    const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'MatthewWeiDashboard/1.0 (source-checking personal news reader)', Accept: 'text/html' } });
    if ([301,302,303,307,308].includes(response.status)) { url = new URL(response.headers.get('location'), url).href; await response.body?.cancel(); continue; }
    delivery.url=url;delivery.status=response.status;
    return fetchText(url, { fetcher: async () => response, maxBytes: 3_000_000 });
  }
  throw new Error('Too many source redirects');
}

async function paperDate(doi, fetcher) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const data = JSON.parse(await fetchText(url, { fetcher, maxBytes: 1_000_000 }));
  const paper = data.message;
  const dates = ['published-online','published-print','published'].flatMap(k => paper?.[k]?.['date-parts'] || []).filter(p => p.length === 3).map(p => p.map((n, i) => i ? String(n).padStart(2, '0') : n).join('-')).filter(validDay).sort();
  return dates.length ? { date: dates[0], url, title: paper.title?.[0] || doi } : null;
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; try { results[i] = { value: await worker(items[i]) }; } catch (e) { results[i] = { error: e.message }; } }
  }));
  return results;
}

export async function researchNews({ fetcher = fetch, now = new Date(), previous = [], seen = {}, limit = 240 } = {}) {
  const discovery = await Promise.allSettled([
    ...NEWS_FEEDS.map(async feed => parseFeed(await fetchText(feed.url, { fetcher }), feed).map((s,i)=>({...s,feedChecked:true,sourceFeedUrl:feed.url,feedRank:i+1,nytHomeLead:Boolean(feed.homepageLead && i===0)}))),
    ...NEWS_SECTIONS.map(async section => sectionStories(await fetchArticle(section, fetcher),section)),
  ]);
  const available = discovery.filter(f => f.status === 'fulfilled' && f.value.length).length;
  if (!available) throw new Error('No live publisher discovery sources were reachable');
  const pools=discovery.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
  const raw=pools.flat(), key=checkInWindow(now).key;
  const prior=Object.values(seen).filter(s=>s.editionKey);
  const candidates=readingQueue(pools.map(pool=>pool.filter(story=>
    story.nytHomeLead || !story.publishedAt || !prior.some(old=>old.id===story.id && Date.parse(story.publishedAt)<=Date.parse(old.seenAt)))),{now,limit});
  let pagesRead = 0, primaryDatesRead = 0;
  const checks = await mapLimit(candidates, 4, async story => {
    let article;const delivery={};
    try { article=parseSourceArticle(await fetchArticle(story,fetcher,delivery),story); }
    catch(error) {
      if(story.source==='The New York Times' && story.feedChecked && !/HTTP (?:404|410)/.test(error.message)) return {...story,nytFeedSummary:true,sourcePageChecked:false,articleAccess:'feed-only',explanation:story.summary,eventDate:null,eventDateVerified:false,summaryKind:'NYT public-feed summary · full article unavailable',articleAccessError:error.message,checkedAt:now.toISOString()};
      throw error;
    }
    pagesRead++;
    if(article.paywalled && story.source!=='The New York Times')throw new Error('Source requires a subscription');
    if(article.paywalled) return {...story,nytFeedSummary:true,sourcePageChecked:false,articleAccess:'feed-only',explanation:story.summary,eventDate:null,eventDateVerified:false,summaryKind:'NYT public-feed summary · full article requires a subscription',checkedAt:now.toISOString()};
    if(article.text.split(/\s+/).length<60){
      if(story.source==='The New York Times' && story.feedChecked)return {...story,nytFeedSummary:true,sourcePageChecked:false,explanation:story.summary,eventDate:null,eventDateVerified:false,summaryKind:'NYT public-feed summary · full article unavailable',checkedAt:now.toISOString()};
      throw new Error('Source article was unavailable or too short');
    }
    if (oldResearchEvidence(article.text, now)) throw new Error('The lead describes older research, not a fresh development');
    const publishedAt = article.publishedAt || story.publishedAt;
    if (!publishedAt || !Number.isFinite(Date.parse(publishedAt))) throw new Error('No reliable publication date');
    story = {...story, title: article.articleTitle || story.title};
    let date = eventDateInText(article.text.split(/\s+/).slice(0, 550).join(' '), publishedAt, story);
    if (['Science','Technology'].includes(story.category) && article.dois.length) {
      // An unavailable metadata service must not discard readable reporting.
      let primary = null;
      try { primary = await paperDate(article.dois[0], fetcher); } catch { date = null; }
      if (primary) { primaryDatesRead++; date = { date: primary.date, kind: 'Study published', evidence: `The study cited by the source, “${primary.title}”, was first published on ${primary.date}.`, url: primary.url }; }
    }
    if (!date && (story.source === 'MIT News' || story.source === 'NASA' && (story.url.includes('/news-release/') || /\b(updates?|accelerate|mission ends|mission to test)\b/i.test(story.title))) && article.publishedAt) {
      date = { date: dayOf(article.publishedAt), kind: 'Announcement published', evidence: `The institution's original announcement is dated ${dayOf(article.publishedAt)}. This is the announcement date, not the date of a future mission.`, url: story.url };
    }
    // Journal issue dates can be in the future even when reporting is already
    // available. Keep the report, but don't claim that future date as an event.
    if (date && date.date > now.toISOString().slice(0,10)) date = null;
    const eventTime = date ? Date.parse(date.date + 'T12:00:00Z') : Date.parse(publishedAt);
    const age = (+now - eventTime) / 3600000;
    if (!Number.isFinite(age) || age < -24 || age > 168) throw new Error('The actual event/announcement is more than a week old');
    const old = [...previous,...prior].find(p => p.id === story.id || similarStories(p, story));
    const majorUpdateVerified = Boolean(date && old && old.eventDate && date.date > old.eventDate && majorEvent.test(date.evidence) && article.modifiedAt && +now - Date.parse(article.modifiedAt) <= 48 * 3600000);
    const verified = { ...story, editorialText: article.text.split(/\s+/).slice(0,180).join(' '), publishedAt, originalPublishedAt: publishedAt,
      url:delivery.url || story.url,sourcePageChecked:true,articleAccess:'readable',linkStatus:delivery.status,linkCheckedAt:now.toISOString(),primaryDoi:article.dois[0] || null,eventDate: date?.date || null, eventKind: date?.kind || null, eventDateVerified: Boolean(date), dateEvidence: date?.evidence || null,
      dateEvidenceUrl: date?.url || story.url, eventRevision: date ? `${date.date}:${date.kind}` : null, majorUpdateVerified,
      explanation: explanationFromText(article.text, story.title, story.category), summaryKind: 'Source excerpt',
      imageUrl: article.imageUrl, imageCaption: article.imageCaption, imageSourceUrl: story.url,
      checkedAt: now.toISOString() };
    if (majorUpdateVerified) verified.publishedAt = article.modifiedAt;
    return verified;
  });
  const stories = rankStories(checks.flatMap(r => r.value ? [r.value] : []), now, { broad:true, minScore:20, maxAgeHours:168, limit:200 });
  const nytLead=checks.find(r=>r.value?.nytHomeLead)?.value || raw.find(s=>s.nytHomeLead);
  const nytStatus={available:Boolean(nytLead),checkedAt:now.toISOString(),error:discovery[NEWS_FEEDS.findIndex(f=>f.homepageLead)]?.reason?.message || null};
  return {
    nytLead:nytLead ? {...nytLead,explanation:nytLead.explanation||nytLead.summary,feedChecked:true}:null,nytStatus,
    schemaVersion: 2, mode: 'researched', editionKey: checkInWindow(now).key, stories,
    fetchedAt: now.toISOString(), checkedAt: now.toISOString(), sources: [...new Set(stories.map(s => s.source))],
    providersAvailable: available, providersTotal: NEWS_FEEDS.length + NEWS_SECTIONS.length,
    research: { rawCandidates: raw.length, candidatesReviewed: candidates.length, sourcePagesRead: pagesRead, primaryDatesChecked: primaryDatesRead,
      rejected: checks.filter(r => r.error).length,
      rejectedCandidates: checks.flatMap((r,i)=>r.error?[{title:candidates[i].title,url:candidates[i].url,reason:r.error}]:[]), qualifying: stories.length, eventDatesVerified:stories.filter(s => s.eventDateVerified).length,
      eventDatesUnconfirmed:stories.filter(s => !s.eventDateVerified).length,
      rejectionReasons:checks.filter(r => r.error).reduce((out,r) => ({...out,[r.error]:(out[r.error] || 0)+1}),{}), targetCandidates: 20,
      discoverySources: [...NEWS_FEEDS,...NEWS_SECTIONS].map((s,i)=>({source:s.source,url:s.url,available:discovery[i].status==='fulfilled',candidates:discovery[i].value?.length || 0,error:discovery[i].reason?.message || null})),
      method: 'Publisher sections and live feeds; balanced reading budget with no headline-score cutoff; full lead-text ranking; original source pages, explicit event-date evidence and Crossref publication dates; automated weighted ranking; attributed source excerpts.' },
  };
}
