// Shared news selection for the server and downloadable dashboard.
export const NEWS_FEEDS = [
  {url:'https://www.theguardian.com/world/ukraine/rss',source:'The Guardian',category:'World'},
  {url:'https://www.theguardian.com/us-news/us-politics/rss',source:'The Guardian',category:'U.S.'},
  {url:'https://www.businessinsider.com/rss',source:'Business Insider',category:'Technology'},
  {url:'https://www.investing.com/rss/news_14.rss',source:'Investing.com',category:'World'},
  {url:'https://www.investing.com/rss/news.rss',source:'Investing.com',category:'Business'},
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC News', category: 'World' },
  { url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', source: 'BBC News', category: 'U.S.' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', source: 'BBC News', category: 'Technology' },
  { url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', source: 'BBC News', category: 'Science' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', source: 'BBC News', category: 'Business' },
  { url: 'https://feeds.bbci.co.uk/news/education/rss.xml', source: 'BBC News', category: 'Education' },
  { url: 'https://feeds.npr.org/1003/rss.xml', source: 'NPR', category: 'U.S.' },
  { url: 'https://feeds.npr.org/1007/rss.xml', source: 'NPR', category: 'Science' },
  { url: 'https://feeds.npr.org/1013/rss.xml', source: 'NPR', category: 'Education' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index/', source: 'Ars Technica', category: 'Technology' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', category: 'Technology' },
  { url: 'https://www.sciencenews.org/feed/', source: 'Science News', category: 'Science' },
  { url: 'https://www.sciencedaily.com/rss/top/science.xml', source: 'ScienceDaily', category: 'Science', coverage: 'Research summary' },
  { url: 'https://news.mit.edu/rss/research', source: 'MIT News', category: 'Science', coverage: 'University research release' },
  { url: 'https://www.highereddive.com/feeds/news/', source: 'Higher Ed Dive', category: 'Education' },
  { url: 'https://www.nasa.gov/news-release/feed/', source: 'NASA', category: 'Science', coverage: 'Institution announcement' },
  { url: 'https://www.nature.com/nature.rss', source: 'Nature', category: 'Science', coverage: 'Primary research' },
  { url: 'https://www.science.org/rss/news_current.xml', source: 'Science', category: 'Science' },
  { url: 'https://www.theguardian.com/world/rss', source: 'The Guardian', category: 'World' },
  { url: 'https://www.theguardian.com/science/rss', source: 'The Guardian', category: 'Science' },
  { url: 'https://www.theguardian.com/technology/rss', source: 'The Guardian', category: 'Technology' },
  { url: 'https://www.livescience.com/feeds/all', source: 'Live Science', category: 'Science' },
  { url: 'https://www.sciencealert.com/feed', source: 'ScienceAlert', category: 'Science' },
  { url: 'https://phys.org/rss-feed/', source: 'Phys.org', category: 'Science', coverage: 'Research reporting' },
];

export function plainText(value) {
  return String(value ?? '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (original, code) => {
      const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : original;
    }).replace(/\s+/g, ' ').trim();
}

const trivial = /\b(celebrity|celebrities|horoscope|red carpet|box office|gossip|reality tv|football results|premier league|transfer gossip|quiz|what to watch|shopping deals|prime day|black friday)\b|discovery\+.*prices|streaming.*prices|homeview ad/i;
const stopWords = new Set('the a an and or to of in on for with from as at by is are has have after over amid says say new us uk'.split(' '));
const routine = /\b(funding round|series [a-f] funding|raises? \$|acquisitions?|acquires?|partnership|partners with|unveils? new|launches? new|new smartphone|product launch|quarterly earnings|admissions experts|application tips|admissions advice|supplemental essays|extra application essays|campus update|college financial aid deadlines|scholarship deadlines?|student recruitment|admissions work|new degree program|college programs)\b/i;
const hype = /\b(what to expect|everything you need|the future of ai|ai will change everything|vague predictions|best .* to buy)\b/i;
const routinePolitics = /\b(polls?|campaign|senate race|election strategy)\b/i;
const personnel = /\b(hires?|appoints?|named|joins?|steps down)\b.{0,90}\b(ceo|chief|executive|director|doug field)\b/i;
const extraordinary = /\b(world record|first ever|first-ever|first time|never before|reviv\w*.{0,30}extinct|breakthrough|unexpected|unprecedented|record-breaking|bizarre|unusual|rare|escaped|reversed|surviv\w*.{0,30}without|impossible|astonishingly)\b/i;
const consequences = /\b(ceasefire|invasion|war|missile|earthquake|hurricane|evacuation|nuclear|pandemic|federal|supreme court|ban|bans|banned|ruling|sanctions|tariffs|inflation|recession|millions|thousands|blackout|massive|overthrown|coup|resigns|collapsed)\b/i;
const novelty = /\b(discover\w*|breakthrough|robot\w*|quantum|fusion|space|planet|galax\w*|telescope|brain|biology|physics|engineering|new method|new material|first-ever|first time|gene|DNA|clon\w*|artificial intelligence)\b/i;
const interests = /\b(ai|artificial intelligence|electrical engineering|computer science|research|selective colleges|scholarships?|education|admissions|financial aid|semiconductor|chips|robot\w*)\b/i;

function tokens(title) { return new Set(title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).map(t => /^(waiv|suspend)/.test(t) ? 'waive' : /^russia/.test(t) ? 'russia' : /^sanction/.test(t) ? 'sanction' : t).filter(t => t.length > 2 && !stopWords.has(t))); }

export function storyContext(story) {
  const text = `${story.title} ${story.summary}`;
  const rules = [
    [/\b(admissions?|applications?|sat|act|essays?)\b/i, 'This could affect how you prepare for college applications. Check the source for which schools, students and deadlines are involved.'],
    [/\b(tuition|financial aid|scholarships?|student loans?)\b/i, 'College costs and financial aid affect where you can apply and what attending could cost. Eligibility and dates matter.'],
    [/\b(sleep|exercise|health|vaccines?)\b/i, 'This may help you understand health and everyday habits. A research result is evidence to consider, rather than a personal medical recommendation.'],
    [/\b(phone|laptop|privacy|scams?|passwords?)\b/i, 'This concerns technology you may use for school or everyday life. Look for confirmed changes and practical steps in the report.'],
    [/\b(nasa|planets?|astronomers?|cosmic|galax\w*|telescope|space exploration|space flight)\b/i, 'A look at how scientists explore space and figure out what is out there. Follow the source for the evidence and what is still uncertain.'],
    [/\b(light|optics)\b/i, 'Light is central to cameras, communications and experiments. This is a research finding; the source explains how it was tested and what is still uncertain.'],
    [/\b(ceasefire|ukrain)\w*\b.*\b(energy|electric|power)\b|\b(energy|electric|power)\b.*\b(ceasefire|ukrain)\w*\b/i, 'Reliable power is critical to civilian heating and electricity. Attacks on energy sites also test whether ceasefire commitments protect people on the ground.'],
    [/\b(federal agents|law enforcement)\b.*\b(search|home)\b/i, 'Investigations involving elected officials raise questions about legal process and accountability. A search alone does not establish wrongdoing.'],
    [/\b(congo|m23)\b/i, 'Changes in rebel leadership can affect peace negotiations and civilian security in eastern DR Congo.'],
    [/\b(ai|artificial intelligence)\b.*\b(regulat|rules|safety)\w*\b/i, 'AI oversight concerns safety standards, responsibility for harm, and how quickly new systems reach the public.'],
    [/\b(beef|food|grocery|cost of living|inflation)\b/i, 'Household prices shape purchasing power and voters’ economic concerns. The report gives context to pressures people feel day to day.'],
    [/\b(admission|college|universit|student loan)\w*\b/i, 'Changes to education policy and college access can affect application decisions, costs, and opportunities for students.'],
    [/\b(cyber|hack|data breach)\w*\b/i, 'Cyber incidents can disrupt services and expose personal information. Follow the source for confirmed impacts and any recommended action.'],
    [/\b(missile|military|pentagon|invasion|war|ceasefire)\b/i, 'Military and diplomatic developments can change regional security and the risks faced by civilians.'],
    [/\b(nasa|space|discovery|breakthrough|research)\b/i, 'The significance depends on the evidence and what becomes possible next. The source explains the results and their limits.'],
    [/\b(tariff|economy|growth|imf|interest rate)\b/i, 'Economic policy and growth forecasts inform decisions about jobs, investment and household budgets.'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}
export function similarStories(a, b) {
  if (a.id === b.id) return true;
  const x = tokens(a.title), y = tokens(b.title);
  const shared = [...x].filter(t => y.has(t)).length;
  const sameAction = ['waive','resigns','arrested','invades','erupts'].some(t => x.has(t) && y.has(t));
  return shared >= 3 && (shared / Math.min(x.size, y.size) >= 0.6 || sameAction && shared / Math.min(x.size,y.size) >= 0.3);
}

export function readableHeadline(title, summary = '') {
  if (/Microsoft.*weather forecasts/i.test(title) && /two to six weeks/i.test(summary)) return 'A new method aims to make weather forecasts useful two to six weeks ahead';
  if (/Chandra.*Treble Clef.*Galaxy Cluster Collision/i.test(title) && /likely caused/i.test(summary)) return 'Colliding galaxy clusters may explain a cosmic “treble clef”';
  if (/CNN, MS NOW and Politico prevail against White House/i.test(title) && /federal judge.*cannot ban/i.test(summary)) return 'Judge temporarily blocks White House bans on news outlets over their coverage';
  if (/3 admissions experts.*supplemental essays/i.test(title)) return 'Three admissions experts explain why colleges keep or drop extra application essays';
  if (/James Webb reveals a massive cosmic structure/i.test(title) && /galaxy cluster.*dense/i.test(summary)) return 'Webb telescope finds an unexpectedly dense ancient group of galaxies';
  if (/Physicists discover.*property of light/i.test(title) && /spinning, twisting/i.test(summary)) return 'Scientists find an unexpected way light can twist as it travels';
  if (/war-gamed dimming the sun/i.test(title)) return 'A simulation explores the risks of trying to cool Earth by dimming sunlight';
  return title.replace(/\bsupplemental essays\b/gi, 'extra application essays').replace(/\bnixed\b/gi, 'removed');
}

// Local upkeep and shopping stories must not qualify on incidental references
// to cancer, discovery, AI or education in someone's personal background.
export function editoriallyEligible(story) {
  const title = story.title || '';
  const backgroundFeature = /\bweekly newsletter\b/i.test(story.editorialText || '');
  const routineAward = /\b(win|wins|awarded)\b.{0,60}\b(prize|award|fellowship)\b/i.test(title) && !/\bNobel\b/i.test(title);
  const localSighting = /\b(woodland|nature reserve|local park)\b/i.test(title) && /\b(restored|recorded|sightings?|spotted)\b/i.test(title) && !/\b(new species|thought extinct|rediscovered)\b/i.test(title);
  const localUpkeep = /\b(overgrown|pathways?|potholes?|litter|fly-tipping|dog fouling|grass cutting|wheelie bins?|parking spaces?|town council)\b/i.test(title);
  const widerImpact = /\b(deaths?|killed|disaster|nationwide|national emergency|evacuat\w*|mass poisoning|major breakthrough)\b/i.test(title);
  const routineAppearance = /\b(town hall|faces? (?:tough )?questions|campaign speech|pledges? support)\b/i.test(title) && !/\b(resigns?|assassination|arrested|killed|shot)\b/i.test(title);
  const shopping = /\b(discount|preorder|on sale|deals?)\b/i.test(title) && /\b(tv|iphone|laptop|headphones|phone|tablet|amazon|apple|gadget)\b/i.test(title);
  const careerProfile = /\b(data cent(?:er|re))\b/i.test(title) && /\b(jobs?|career|training|hour)\b/i.test(title) && !/\b(layoffs?|strikes?|collapse|nationwide)\b/i.test(title);
  return !(localUpkeep && !widerImpact) && !shopping && !careerProfile && !routineAppearance && !backgroundFeature && !routineAward && !localSighting;
}

export const NEWS_WEIGHTS = { surprise: 0.35, consequence: 0.30, novelty: 0.20, relevance: 0.15 };

export function interestScore(story) {
  const text = `${story.title} ${story.editorialText || story.originalSummary || story.summary}`;
  // Reward a concrete twist or consequence, not a science/AI topic alone.
  const contradiction = /\b(couldn['’]t|cannot|can['’]t|unable to) fly\b|\b(challenges?|overturns?|contradicts?)\b.{0,65}\b(assumptions?|theor\w*|understanding|beliefs?)\b|\b(thought extinct|survived without|evolved away from)\b/i.test(text);
  const securityResponse = /\b(cybersecurity|cyberattacks?|hacking|software vulnerabilities)\b/i.test(text)
    && /\b(hired|hires?|added|deploys?)\b.{0,45}\b([1-9][\d,]{2,}|thousands?)\b/i.test(text);
  const crisis = /\b(protests?|demonstrations?)\b/i.test(text)
    && /\b(injured|killed|resignation|political crisis|government falls)\b/i.test(text);
  const everydayChange = /\b(approved|approval|can finally buy|newly available)\b/i.test(text)
    && /\b(sunscreen|medicine|treatment|vaccine|hearing aids?)\b/i.test(text);
  const abstractMechanism = /\b(spin defects?|internal conversion|quantum material|electrical regions|learning machinery)\b/i.test(text);
  const practicalResult = /\b(patients?|clinical trial|power homes|drinking water|food supply|cuts? costs?|lives? saved)\b/i.test(text);
  const dimensions = {
    surprise: extraordinary.test(text) ? 90 : /\b(discover\w*|myster\w*|record|defies|unexpected|ceasefire|coup|overthrown|resigns|overturned|collapse)\b/i.test(text) ? 65 : 15,
    consequence: consequences.test(text) ? 90 : /\b(climate|energy|health|disease|cancer|privacy|hack|security|financial aid|student loan|cost)\b/i.test(text) ? 60 : 20,
    novelty: /\b(discover\w*|demonstrated|achieved|detected|revealed|found|breakthrough)\b/i.test(text) && novelty.test(text) ? 85 : novelty.test(text) ? 40 : /\b(new law|new policy|unexpected decision|peace deal|ceasefire|coup|overthrown)\b/i.test(text) ? 65 : 15,
    relevance: interests.test(text) ? 90 : 10,
  };
  if (/\b(discovered|found out|diagnosed)\b.{0,35}\b(?:he|she|I) (?:had|has)\b/i.test(text)) { dimensions.surprise = Math.min(dimensions.surprise,25); dimensions.novelty = Math.min(dimensions.novelty,20); }
  if (contradiction) dimensions.surprise = 95;
  if (securityResponse || crisis) { dimensions.consequence = 95; dimensions.surprise = Math.max(dimensions.surprise, 75); }
  if (everydayChange) { dimensions.consequence = Math.max(dimensions.consequence, 75); dimensions.surprise = Math.max(dimensions.surprise, 65); }
  if (abstractMechanism && !practicalResult && !contradiction) {
    dimensions.surprise = Math.min(dimensions.surprise, 25);
    dimensions.consequence = Math.min(dimensions.consequence, 20);
  }
  const reversal = /\b(waiv\w*|revers\w*|suspend\w*|scrap\w*|overturn\w*)\b.{0,100}\b(sanctions?|law|tariffs?|ban|restrictions?)\b/i.test(text);
  const exceptionalScale = /\b(largest|biggest|steepest|shortest|first|lowest|highest)\b.{0,70}\b(in \d+ years|in decades|in history|on record|ever|years)\b/i.test(text);
  const measuredGain = /\b\d+(?:\.\d+)?\s*(?:times|fold|%)\s+(?:fewer|less|faster|more efficient|reduction)\b/i.test(text);
  const unexpectedBehavior = /\b(unintended|unauthorized|unexpected)\b.{0,55}\b(behavio\w*|access|actions?|browsing)\b/i.test(text);
  if (reversal) { dimensions.novelty = 85; dimensions.surprise = Math.max(dimensions.surprise,85); dimensions.consequence = 95; }
  if (exceptionalScale) dimensions.surprise = Math.max(dimensions.surprise,90);
  if (measuredGain) { dimensions.surprise = Math.max(dimensions.surprise,75); dimensions.novelty = 90; }
  const autonomousBreach = /\b(AI|models?|agents?|robots?)\b/i.test(text) && /\b(hacked|stole|breached|bypassed|unauthorized)\b/i.test(text);
  if (autonomousBreach) { dimensions.surprise = 90; dimensions.consequence = Math.max(dimensions.consequence,80); dimensions.novelty = 85; }
  if (unexpectedBehavior) { dimensions.surprise = Math.max(dimensions.surprise,85); dimensions.novelty = 85; }
  // A claimed capability is not an independently demonstrated breakthrough.
  if (/\bsays? it (?:tested|developed|built)\b/i.test(story.title) && /\b(didn['’]t explain|exaggerat\w*|doubtful|not independently verified)\b/i.test(text)) {
    dimensions.surprise = Math.min(dimensions.surprise,50);
    dimensions.novelty = Math.min(dimensions.novelty,40);
  }
  const massProtest = /\b(protests?|demonstrations?|marches?|rallies)\b/i.test(story.title)
    && /\b(nationwide|across (?:the )?(?:US|U\.S\.|country)|millions|hundreds of thousands|largest|thousands|no kings)\b/i.test(text);
  if (massProtest) { dimensions.consequence = 95; dimensions.surprise = Math.max(dimensions.surprise,65); dimensions.novelty = Math.max(dimensions.novelty,65); }
  const score = Object.entries(NEWS_WEIGHTS).reduce((sum, [key, weight]) => sum + dimensions[key] * weight, 0);
  return { score, dimensions };
}

export function rankStories(items, now = new Date(), options = {}) {
  const unique = new Map();
  for (const story of items) {
    const age = (+now - Date.parse(story.publishedAt)) / 3600000;
    const eventAge = story.eventDate ? (+now - Date.parse(story.eventDate.length === 10 ? `${story.eventDate}T12:00:00Z` : story.eventDate)) / 3600000 : age;
    const text = `${story.title} ${story.editorialText || story.originalSummary || story.summary}`;
    const maxAge = options.maxAgeHours ?? 48;
    if (!editoriallyEligible(story)) continue;
    if (!Number.isFinite(age) || age < -1 || age > maxAge || eventAge > maxAge || eventAge < -24 || trivial.test(story.title) || hype.test(story.title)
      || /\b(APOD|picture of the day|photo of the day|week in pictures|crossword)\b/i.test(story.title)) continue;
    if (/\b(avoids? hints?|no (?:fresh |new )?(?:signals?|details?|announcements?|answers?)|won['’]t prejudge|declines? to (?:say|comment))\b/i.test(`${story.title} ${story.editorialText || ''}`)) continue;
    if (/\b(could (?:vastly )?(?:boost|transform|revolutionize)|pledges?|profits?|earnings|rate holds|stocks? (?:rise|fall|higher|lower)|buys? \$|stock price|price target)\b/i.test(story.title) && !/\b(crash|collapse|record|largest|steepest|bankrupt)\b/i.test(story.title)) continue;
    if (routine.test(story.title) && !(extraordinary.test(text) && consequences.test(text))) continue;
    if (routinePolitics.test(story.title) && !/\b(coup|overthrown|overturned|assassination|unprecedented|first-ever|record-breaking)\b/i.test(story.title)) continue;
    if (['Technology', 'Business', 'Education'].includes(story.category) && personnel.test(story.title)) continue;
    if (/^(I |My |We tested )|\b(opinion|editorial|review:|best deals)\b/i.test(story.title)) continue;
    if (/\/videos\//.test(story.url || '')) continue;
    if (options.requireVerified && (!story.eventDateVerified || !story.eventDate || !story.dateEvidence)) continue;
    const { score, dimensions } = interestScore(story);
    if (!options.broad && ['Science', 'Technology'].includes(story.category) && dimensions.surprise < 65 && dimensions.consequence < 60) continue;
    if (score < (options.minScore ?? 32)) continue;
    const freshness = age <= 24 && eventAge <= 24 ? '24h' : '48h';
    const old = unique.get(story.id);
    if (!old || score > old.score) unique.set(story.id, { ...story, score, dimensions, freshness });
  }
  const selected = [], pool = [...unique.values()];
  while (selected.length < (options.limit || 40) && pool.length) {
    pool.sort((a, b) => {
      const adjusted = story => story.score - selected.filter(p => p.source === story.source).length * 5 - selected.filter(p => p.category === story.category).length * 3 + (story.freshness === '24h' ? 6 : 0);
      return adjusted(b) - adjusted(a) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    });
    const next = pool.shift();
    if (selected.some(s => similarStories(s, next))) continue;
    selected.push(next);
  }
  return selected.map(story => ({ ...story, displayTitle: readableHeadline(story.title, story.summary), originalSummary: story.originalSummary || story.summary,
    summary: story.explanation || plainLanguageSummary(story.summary), whyMatters: story.whyInteresting || null }));
}

export function selectBriefing(stories, { key, history = {}, previousSources = [], avoidPublishers = false, requireVerified = false, now = new Date() } = {}) {
  const ranked = rankStories(stories, now, { requireVerified });
  const prior = Object.values(history).filter(h => h.editionKey && h.editionKey !== key);
  const eligible = ranked.filter(story => {
    const seen = history[story.id];
    if (seen && seen.editionKey !== key && !(story.majorUpdateVerified && story.eventRevision && story.eventRevision !== seen.eventRevision)) return false;
    if (prior.some(old => old.title && similarStories(old, story)) && !story.majorUpdateVerified) return false;
    if (avoidPublishers && previousSources.includes(story.source)) return false;
    return true;
  });
  // A small source-variety preference never creates a topic quota or filler.
  eligible.sort((a, b) => (b.score + (previousSources.includes(b.source) ? 0 : 4)) - (a.score + (previousSources.includes(a.source) ? 0 : 4)));
  const fresh = eligible.filter(s => s.freshness === '24h');
  const backup = eligible.filter(s => s.freshness === '48h');
  const selected = [];
  for (const story of [...fresh, ...backup]) {
    if (selected.some(s => similarStories(s, story))) continue;
    selected.push(story);
    if (selected.length === 5) break;
  }
  return selected;
}

// Classify the development, not the feed label: a war report can arrive
// through a Business or Technology feed and still overlap other war coverage.
export function conflictTopic(story) {
  const t=story.title || '';
  if (!/\b(war|military|missiles?|airstrikes?|strikes?|attacks?|troops?|ceasefire|fighter jets?|shoot down|shot down|hits?|ablaze|bombing|sanctions?)\b/i.test(t)) return null;
  const context = `${t} ${String(story.editorialText || story.explanation || story.summary || '').slice(0,600)}`;
  if (/\b(ukrain\w*|russia\w*|romania\w*|nato|black sea|st[ .]+petersburg)\b/i.test(context)) return 'russia-ukraine';
  if (/\b(iran|israel|gaza|houthi\w*|yemen|hormuz|saudi)\b/i.test(context)) return 'middle-east';
  return /\b(war|military|missiles?|airstrikes?|troops?|fighter jets?)\b/i.test(t) ? 'other-conflict' : null;
}

// Quantity is now a product requirement. Prefer new verified developments,
// including checked reporting with an explicitly unknown event date, then catch-up
// reporting and finally the real previously published edition. Never invent
// a date or disguise a carried story as a new development.
export function completeBriefing(stories, { key, history = {}, previousSources = [], now = new Date(), fallback = [], editionKey = key } = {}) {
  const checked = s => s && editoriallyEligible(s) && typeof s.id === 'string' && typeof s.title === 'string'
    && typeof s.source === 'string' && /^https:\/\//.test(s.url || '') && Number.isFinite(Date.parse(s.publishedAt))
    && (s.sourcePageChecked || s.eventDateVerified) && typeof (s.explanation || s.summary) === 'string' && (s.explanation || s.summary).trim().length > 40
    && !/\b(APOD|picture of the day|photo of the day)\b/i.test(s.title);
  const prior = Object.values(history).filter(h => h.editionKey && h.editionKey !== key);
  const unseen = s => !s.carriedForward && (!s.selectedEdition || s.selectedEdition === key)
    && (!prior.some(h => h.id === s.id || h.title && similarStories(h,s)) || s.majorUpdateVerified);
  const current = editionKey === key ? stories.filter(checked) : [];
  const selected = [];
  const add = (items, flags) => {
    for (const s of items) {
      if (selected.length === 5) break;
      if (selected.some(old => similarStories(old,s))) continue;
      const conflict=conflictTopic(s);
      if (conflict && (selected.filter(p=>conflictTopic(p)).length>=2 || selected.some(p=>conflictTopic(p)===conflict))) continue;
      selected.push({ ...s, ...flags });
    }
  };
  const broader = rankStories(current.filter(unseen), now, { broad:true, minScore:20, limit:100 });
  // Give strong technology and science reporting room in a five-story edition.
  // This is conditional on checked, unseen, recent candidates meeting the
  // interest threshold; no weak article is added to satisfy a topic quota.
  for (const category of ['Technology','Science']) {
    const choices=broader.filter(s=>s.category===category && !conflictTopic(s) && s.score>=45 && (category!=='Science' || /\b(scientists?|researchers?|study|experiment|telescope|spacecraft|NASA|new species)\b/i.test(`${s.title} ${s.editorialText || ''}`)));
    choices.sort((a,b)=>b.score-a.score);
    if(choices.length) add([choices[0]], {carriedForward:false,olderReport:false,selectedEdition:key});
  }
  // Recalculate variety after each pick. A final global sort used to erase
  // the publisher/category penalties and fill the edition with one theme.
  while (broader.length && selected.length < 5) {
    const value = s => s.score + (s.freshness === '24h' ? 3 : 0) + (s.eventDateVerified ? 2 : 0)
      + (previousSources.includes(s.source) ? 0 : 2)
      - selected.filter(p => p.source === s.source).length * 5
      - selected.filter(p => p.category === s.category).length * 4;
    broader.sort((a,b) => value(b)-value(a));
    add([broader.shift()], { carriedForward:false, olderReport:false, selectedEdition:key });
  }
  const catchup = rankStories(current.filter(unseen), now, { broad:true, minScore:20, maxAgeHours:168, limit:100 });
  add(catchup, { carriedForward:false, olderReport:true, selectedEdition:key });
  add([...stories, ...fallback].filter(checked).sort((a,b) => Date.parse(b.publishedAt)-Date.parse(a.publishedAt)), { carriedForward:true });
  return selected;
}

export function sourceImage(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || /(^|\.)(localhost|local)$/.test(url.hostname) || /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || /(?:logo|favicon|placeholder|default[-_/]image)/i.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

export function plainLanguageSummary(text) {
  const replacements = [
    [/\bartificial neural networks?\b/gi, 'AI models (computer systems trained to recognize patterns)'],
    [/\bmachine-learning algorithms?\b/gi, 'methods that help computers learn patterns from examples'],
    [/\bsemiconductors\b/gi, 'materials used to make computer chips'],
    [/\bdecarbonization\b/gi, 'reducing carbon emissions'],
    [/\bsolar geoengineering\b/gi, 'trying to cool Earth by reflecting some sunlight away'],
    [/\bgeopolitics\b/gi, 'competition and disagreements between countries'],
    [/\bgeopolitical\b/gi, 'international political'],
    [/\bsupplemental essays\b/gi, 'extra application essays required by individual colleges'],
    [/\bdark matter\b/i, 'dark matter (matter detected by its gravity, rather than by light)'],
    [/\bGOP\b/g, 'Republican Party'],
    [/\bsuper PACs?\b/gi, 'political fundraising group'],
    [/\bbipartisan\b/gi, 'supported by both major U.S. political parties'],
    [/\blawmakers\b/gi, 'elected officials'],
    [/\bmonetary policy\b/gi, 'central-bank decisions about interest rates and money'],
    [/\bfiscal policy\b/gi, 'government decisions about taxes and spending'],
    [/\btariffs\b/gi, 'taxes on imported goods'],
    [/\bLLMs\b/g, 'large language models (AI systems that work with text)'],
    [/\bLLM\b/g, 'large language model (an AI system that works with text)'],
    [/\bIPO\b/g, 'first public sale of a company’s shares'],
    [/\bexoplanets\b/gi, 'planets outside our solar system'],
    [/\bgenerative AI\b/gi, 'AI that creates text, images or other content'],
    [/\bgradient descent\b/gi, 'a method for adjusting an AI model to reduce mistakes'],
    [/\bphotovoltaic cells\b/gi, 'solar cells'],
    [/\bmachine learning\b/gi, 'computer methods trained to find patterns'],
    [/\bgalaxy clusters\b/gi, 'galaxy clusters (large groups of galaxies)'],
  ];
  // Keep direct quotations unchanged. Expand known jargon, preserving the
  // source's claims, uncertainty and attribution rather than inventing a summary.
  const plain = String(text).split(/("[^"]*"|“[^”]*”)/g).map((part, i) => i % 2 ? part : replacements.reduce((s, [pattern, replacement]) => s.replace(pattern, replacement), part)).join('');
  const protectedText = plain.replace(/\b(?:[A-Z]\.){2,}|\b(?:Dr|Mr|Mrs|Ms|Prof|Rep|Sen)\./g, match => match.replace(/\./g, '\uE000'));
  const sentences = [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(protectedText)].map(s => s.segment);
  return sentences.slice(0, 2).join('').replace(/\uE000/g, '.').trim();
}

