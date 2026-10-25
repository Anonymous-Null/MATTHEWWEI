// Shared news selection for the server and downloadable dashboard.
export const NEWS_FEEDS = [
  {url:'https://rss.nytimes.com/services/xml/rss/nyt/US.xml',source:'The New York Times',category:'U.S.'},
  {url:'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',source:'The New York Times',category:'World'},
  {url:'https://rss.nytimes.com/services/xml/rss/nyt/Education.xml',source:'The New York Times',category:'Education'},
  {url:'https://spectrum.ieee.org/feeds/feed.rss',source:'IEEE Spectrum',category:'Technology'},
  {url:'https://www.sciencedaily.com/rss/matter_energy/batteries.xml',source:'ScienceDaily',category:'Science'},
  {url:'https://www.sciencedaily.com/rss/matter_energy/materials_science.xml',source:'ScienceDaily',category:'Science'},
  {url:'https://www.sciencedaily.com/rss/computers_math/robotics.xml',source:'ScienceDaily',category:'Technology'},
  {url:'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',source:'The New York Times',category:'Top story',homepageLead:true},
  {url:'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',source:'The New York Times',category:'Technology'},
  {url:'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',source:'The New York Times',category:'Science'},
  {url:'https://www.theguardian.com/world/ukraine/rss',source:'The Guardian',category:'World'},
  {url:'https://www.theguardian.com/us-news/rss',source:'The Guardian',category:'U.S.'},
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
  if(/\/live\/|\/live-news\//i.test(story.url || ''))return false;
  const opinion = /\/(?:commentisfree|opinion|editorials?|columnists?)\//i.test(story.url || '') || /\b(opinion|commentary|editorial|cartoon)\b/i.test(story.coverage || '') || /\bI have my doubts\b/i.test(title);
  const promotion = /\b(refurbished|shopping guide|best deals|invites media|media advisory|webinar|conference preview)\b/i.test(title);
  const imageFeature=/\bImage (?:of the Day|Article)\b/i.test(String(story.editorialText || story.explanation || '').split(/\s+/).slice(0,45).join(' '));
  const sponsored = /\b(this article is brought to you by|sponsored content|paid content|advertisement feature)\b/i.test(story.editorialText || story.explanation || story.summary || '');
  const serviceAnnouncement = /\b(new services available|membership services|call for papers|register for (?:our|the) webinar)\b/i.test(title);
  const backgroundFeature = /\bweekly newsletter\b/i.test(story.editorialText || '');
  const routineAward = /\b(win|wins|awarded)\b.{0,60}\b(prize|award|fellowship)\b/i.test(title) && !/\bNobel\b/i.test(title);
  const localSighting = /\b(woodland|nature reserve|local park)\b/i.test(title) && /\b(restored|recorded|sightings?|spotted)\b/i.test(title) && !/\b(new species|thought extinct|rediscovered)\b/i.test(title);
  const localUpkeep = /\b(overgrown|pathways?|potholes?|litter|fly-tipping|dog fouling|grass cutting|wheelie bins?|parking spaces?|town council)\b/i.test(title);
  const widerImpact = /\b(deaths?|killed|disaster|nationwide|national emergency|evacuat\w*|mass poisoning|major breakthrough)\b/i.test(title);
  const routineAppearance = /\b(town hall|faces? (?:tough )?questions|campaign speech|pledges? support)\b/i.test(title) && !/\b(resigns?|assassination|arrested|killed|shot)\b/i.test(title);
  const shopping = /\b(discount|preorder|on sale|deals?)\b/i.test(title) && /\b(tv|iphone|laptop|headphones|phone|tablet|amazon|apple|gadget)\b/i.test(title);
  const careerProfile = /\b(data cent(?:er|re))\b/i.test(title) && /\b(jobs?|career|training|hour)\b/i.test(title) && !/\b(layoffs?|strikes?|collapse|nationwide)\b/i.test(title);
  return !opinion && !promotion && !imageFeature && !(localUpkeep && !widerImpact) && !shopping && !careerProfile && !routineAppearance && !backgroundFeature && !routineAward && !localSighting && !sponsored && !serviceAnnouncement;
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


export const PERSONAL_NEWS_LAYOUT = 'nyt-interests-us-world-v1';

// Topic preferences only. The reader's biography and identity are not published.
const personalTopics = [
  {id:'everyday-tech',weight:84,pattern:/\b(smart glasses|smartphones?|laptops?|phones?|recording|passwords?|privacy|data breach|ChatGPT|AI tools?)\b/i,connection:'Everyday technology, useful tools, and privacy issues you can encounter.'},
  {id:'batteries-materials',weight:96,pattern:/\b(batter(?:y|ies)|thermal runaway|shape.memory alloy|materials science|solid.state|lithium.ion|energy storage|battery management|alloys?|atomic structures|crystalline materials)\b/i,connection:'Battery safety, materials science, and energy engineering.'},
  {id:'electronics-building',weight:94,pattern:/\b(arduino|esp32|microcontrollers?|embedded systems?|electrical engineering|semiconductors?|computer chips?|circuits?|bluetooth|sensors?|robotics?|robots?|variable frequency drives?|electric motors?|motor controllers?)\b/i,connection:'Electrical engineering, embedded electronics, and building projects.'},
  {id:'ai-computing',weight:88,pattern:/\b(artificial intelligence|AI|computer science|computing|cybersecurity|software|programming|quantum comput\w*|machine learning)\b/i,connection:'Computer science, AI, and how computing systems work.'},
  {id:'college-access',weight:95,pattern:/\b(admissions?|scholarships?|financial aid|tuition|FAFSA|research opportunit\w*|high.school research|summer research|undergraduate engineering)\b/i,connection:'Engineering college plans, college costs, scholarships, or research opportunities.'},
  {id:'rotc-service',weight:98,pattern:/\b(ROTC|officer training|commissioning|military scholarship|air force scholarship|service academ\w*)\b/i,connection:'ROTC scholarships and the path into military service.'},
  {id:'aviation-space',weight:83,pattern:/\b(aviation|spacecraft|space telescope|NASA|astronauts?|rockets?|aircraft|aerospace|flight testing)\b/i,connection:'Aviation, space, and aerospace engineering.'},
  {id:'energy-engineering',weight:85,pattern:/\b(power grid|grid power|electricity|clean energy|solar cells?|fusion|renewable energy|power electronics|electric vehicles?|EVs)\b/i,connection:'Energy systems and engineering.'},
  {id:'learning-hobbies',weight:65,pattern:/\b(running|runners?|marathon|tennis|violin|music acoustics|Mandarin|Chinese language|Rubik.?s cube|speedcub\w*)\b/i,connection:'Running, tennis, violin, Chinese, or building problem-solving skills.'},
  {id:'student-impact',weight:90,pattern:/\b(high.school students?|college applicants?|student visas?|Asian.American|Chinese.American|racial discrimination|school funding)\b/i,connection:'Changes affecting students, college access, or equal treatment.'},
];

export function personalRelevance(story) {
  // Use the headline and lead, not incidental names or a long background tail.
  const lead=String(story.editorialText || story.originalSummary || story.explanation || story.summary || '').split(/\s+/).slice(0,160).join(' ');
  const text=`${story.title} ${lead}`;
  let matches=personalTopics.filter(t=>t.pattern.test(text));
  // Research conducted AT a college is not college admissions/access news.
  const collegeSubject=/\b(admissions?|college applicants?|undergraduate|tuition|financial aid|scholarships?|FAFSA|high.school research|summer research|research opportunit\w*)\b/i.test(story.title+' '+lead.split(/\s+/).slice(0,65).join(' '));
  const unrelatedTraining=/\b(cosmetology|massage therapy|beauty school|dental school|medical school|MBA|doctoral|PhD)\b/i.test(story.title);
  if(!collegeSubject || unrelatedTraining)matches=matches.filter(t=>t.id!=='college-access');
  const personalCrime=/\b(prosecutor|arrested|charged|CSAM|sex abuse|child abuse)\b/i.test(story.title);
  const jobForecast=/\b(AI|robots?)\b/i.test(story.title) && /\b(jobs?|gardeners?|unemployment|may still|might replace)\b/i.test(story.title)
    && !/\b(actual layoffs?|laid off|hired \d|apprenticeships?|scholarships?)\b/i.test(story.title);
  const computingDevelopment=/\b(models?|agents?|software|computing|programming|cybersecurity|chips?|algorithms?|training|inference|databases?|AI (?:rules|export|safety|regulation)|ChatGPT|chatbots?)\b/i.test(text);
  if(!computingDevelopment) matches=matches.filter(t=>t.id!=='ai-computing');
  if(personalCrime || jobForecast) matches=matches.filter(t=>!['ai-computing','electronics-building','everyday-tech'].includes(t.id));

  // A college's name alone is not evidence that a story matters to an applicant.
  const targetSchool=/\b(MIT|Stanford|UT Austin|University of Texas|Georgia Tech|Rice University)\b/i.test(text);
  if(!targetSchool && /\b(direct admissions|campus update|new degree program)\b/i.test(text)) matches=matches.filter(t=>t.id!=='college-access');
  const localImpact=/\b(Massachusetts|Andover|Boston|Texas)\b/i.test(text) && /\b(students?|schools?|education|scholarships?|research opportunities|public safety|emergency)\b/i.test(text);
  const critical=/\b(ROTC|scholarship|student visa|financial aid|tuition|FAFSA)\b/i.test(story.title)
    && /\b(cuts?|canceled|cancelled|suspended|eligibility|abolished|ends?|banned|new requirements|deadline)\b/i.test(story.title);
  const headlineMatches=matches.filter(t=>t.pattern.test(story.title));
  const primary=[...(headlineMatches.length?headlineMatches:matches)].sort((a,b)=>b.weight-a.weight)[0];
  return {score:Math.min(100,(primary?.weight || (localImpact?72:0))+(targetSchool && primary?4:0)),
    topics:matches.map(t=>t.id),primaryTopic:primary?.id || (localImpact?'local-student-impact':null),
    connection:/\b(variable frequency drives?|motor controllers?)\b/i.test(story.title) ? 'Motor-speed controllers connect to electronics, control systems, and energy efficiency.' : /\bAI\b/i.test(story.title) && /\bmaterials?\b/i.test(story.title) ? 'AI that searches for useful material properties connects computing with materials and battery research.' : primary?.connection || (localImpact?'School, education, or public-safety developments in Massachusetts or Texas.':null),critical};
}

// Version the editorial policy so a scheduled run repairs an older edition once.
export const EDITORIAL_VERSION = 'evidence-first-2026-10-25';

export function cleanNewsText(value) {
  // Source footers are not reporting. Stop before biographies, rights notices,
  // related links and subscription pitches so they cannot influence selection.
  return plainText(value)
    .split(/\b(?:Who['’]s behind this story\?|Citation:|This document is subject to copyright|About the author|Related (?:stories|articles):|More information:|Journal information:|Media Contacts?:)\s*|©\s*20\d{2}/i)[0]
    .replace(/Get our breaking news email, free app or daily news podcast/gi,' ')
    .replace(/Continue reading\.{0,3}/gi,' ')
    .replace(/\bRecommended Videos\b/gi,' ')
    .replace(/\b(?:Sign up for|Subscribe to) our [^.!?]{0,140}(?:[.!?]|$)/gi,' ')
    .replace(/\s+/g,' ').trim();
}

export function editorialAssessment(story) {
  const title=cleanNewsText(story.title || '');
  const lead=cleanNewsText(story.editorialText || story.explanation || story.originalSummary || story.summary || '').split(/\s+/).slice(0,180).join(' ');
  const text=title+'. '+lead;
  const sentences=[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)].map(s=>s.segment.trim());
  const evidence={};
  const support=(name,patterns)=>{
    const sentence=sentences.find(s=>!(/demonstrated result|unexpected finding/.test(name)&&/\b(never|not|no longer|first author|previously|formerly|may|might|could|would|plans to)\b/i.test(s))&&patterns.every(re=>re.test(s)));
    if(sentence)evidence[name]=sentence.slice(0,320);
    return Boolean(sentence);
  };
  // Each signal needs an action and an outcome in the same sentence. Publisher
  // category, institution names and topic words alone never establish a result.
  const research=support('demonstrated result',[
    /\b(researchers?|scientists?|engineers?|team|study|experiment|tests?|NASA|telescope|astronomers?|physicists?|biologists?|software|sensor|robot|prototype|AI|model)\b/i,
    /\b(built|builds?|created?|developed|designed?|tested?|demonstrat\w*|discover\w*|found|finds?|detect\w*|reveals?|revealed|achieved|measured|identified|observed|works?|powered|powering|harvest\w*|captures?|reduc\w*|prevent\w*|can (?:power|detect|measure|build|run))\b/i
  ]);
  const practical=support('concrete use',[
    /\b(power\w*|charg\w*|detect\w*|measure\w*|prevent\w*|protect\w*|reduc\w*|build\w*|create\w*|design\w*|treat\w*|repair\w*|recycl\w*|remove\w*|operat\w*|control\w*|record\w*)\b/i,
    /\b(batter(?:y|ies)|fires?|sensors?|electric(?:ity| cars?| vehicles?)|robots?|controllers?|drinking water|drugs?|patients?|disease|blind|paraly\w*|hearing|phones?|computers?|passwords?|personal data|private|emails?|photographs?|photos|images|gloves|lamps|objects)\b/i
  ]);
  const privacy=support('personal technology consequence',[
    /\b(Google|Gmail|Photos|AI|ChatGPT|Apple|Meta|apps?|software|devices?|technology|glasses|models?|company|it)\b/i,
    /\b(privacy|private|hacking|hackers?|vulnerabilit\w*|cybersecurity|record\w*|personal data|emails?|advertis\w*|tracking|passwords?)\b/i,
    /\b(chang\w*|allow\w*|expos\w*|us(?:e|es|ed|ing)|collect\w*|remov\w*|reduc\w*|disabl\w*|bug|breach\w*|leak\w*|train\w*|exclud\w*|unauthorized|deliberately)\b/i
  ]);
  const tradeoff=support('unexpected tradeoff',[
    /\b(without|battery.free|self.power\w*|deliberately|intentionally|despite|instead of|yet|but|unexpected\w*|contrary|challeng\w*|overturn\w*|unable|couldn['’]t)\b/i,
    /\b(batter(?:y|ies)|worse|hacking|power\w*|flies|fly|flight|paid|cost\w*|billion|million|theor\w*|belief\w*|understanding|surviv\w*|assumption\w*)\b/i
  ]);
  const measured=support('measured change',[
    /\b\d+(?:\.\d+)?\s*(?:%|times|fold|hours?|years?|nanowatts?|kilometers?|km|miles?|flights?|people|households?|injur\w*)\b/i,
    /\b(faster|slower|fewer|less|more|efficien\w*|reduc\w*|improv\w*|power\w*|operat\w*|record|without|injur\w*|killed|cancel\w*|displac\w*)\b/i
  ]);
  const breakthrough=support('unexpected finding',[
    /\b(found|discovered|observed|detected|demonstrated|revealed|achieved|built|broke|breaks?|first)\b/i,
    /\b(first|record|unexpected|impossible|never|thought extinct|survived|defies|challenges|revers\w*|unexpectedly)\b/i
  ]);
  const publicAction=support('public consequence',[
    /\b(government|Congress|court|judge|president|military|troops|officials|law|police|central bank|authorities|voters|protests?|protesters?|earthquake|typhoon|hurricane)\b/i,
    /\b(approved|passed|ordered|signed|blocked|banned|struck|attacked|killed|injured|evacu\w*|arrest\w*|closed|shut|cut|cuts|raises?|vot\w*|election|ceasefire|resign\w*|sanctions|tariffs|overturned)\b/i
  ]);
  const massImpact=support('scale',[
    /\b(millions|thousands|hundreds|nationwide|national|across the country|billion|\d[\d,]* (?:people|injuries|flights|households|arrests))\b/i,
    /\b(affect\w*|protest\w*|arrest\w*|injur\w*|killed|lost|power|electricity|cancel\w*|access|cost\w*|aid|funding|scholarships|privacy|closed|shut)\b/i
  ]);
  const access=support('student access change',[
    /\b(admissions?|undergraduate|scholarships?|tuition|financial aid|FAFSA|ROTC|student visas?|research opportunities)\b/i,
    /\b(changes?|changed|cuts?|cut|expands?|expanded|ends?|ended|eliminat\w*|raises?|raised|opens?|opened|eligibility|free|full.tuition|funding|approved)\b/i
  ]);
  const headlineScience=/\b(AI|artificial intelligence|ChatGPT|Google|Gmail|software|comput\w*|robots?|sensors?|batter(?:y|ies)|electric\w*|graphene|engineers?|scientists?|researchers?|telescope|astronom\w*|NASA|spacecraft|Moon|Mars|rocket|discov\w*|fossil|bird|dinosaur|physics|biology|material|fusion|quantum|chip|privacy|smart glasses)\b/i.test(title);
  const weather=/\b(storms?|typhoon|hurricane|floods?|tornado|rain|snow)\b/i.test(title) && !/\b(sensor|forecast|engineers?|scientists?|model|satellite)\b/i.test(title);
  const appointment=/\b(offers?|nominat\w*|selects?|selected|appoint\w*|named|joins?|honou?rs?)\b/i.test(title) && /\b(astronaut|mission|researcher|scientist|professor|engineer)\b/i.test(title);
  const routinePublic=/\b(rallies|endorses?|praises?|slams?|criticizes?|attacks? verbally|campaign trail|campaign speech|campaigns? for|campaigns? against|pledges?)\b/i.test(title) && !/\b(No Kings|nationwide|mass protests?|arrest\w*|injur\w*|killed|assassinat\w*|resign\w*)\b/i.test(title);
  const background=/^(?:why |how |does |should |a look (?:at|inside) )|\?\s*$/i.test(title) || /\b(analysis|explainer|opinion)\b/i.test(story.coverage || '');
  const scoreboard=/\b(live (?:\w+ ){0,3}results|live updates|as it happened|what we know)\b/i.test(title);
  const theoryOnly=/\b(could|might|may|potential|theoretical)\b/i.test(title) && !research && !privacy && !access;
  const productOnly=/\b(unveils?|launches?|introduces?|releases?|newest|new model)\b/i.test(title) && !privacy && !tradeoff && !measured && !breakthrough && !access;
  const relevance=personalRelevance(story).score;
  const dimensions={
    surprise:tradeoff?95:breakthrough?85:measured?70:privacy?65:publicAction&&massImpact?65:25,
    consequence:publicAction&&massImpact?95:access?90:privacy?85:publicAction?75:practical?60:research?35:20,
    novelty:tradeoff&&research?90:breakthrough?85:research&&practical?80:research?70:privacy?70:publicAction?55:20,
    relevance,
  };
  const score=Math.round(Object.entries(NEWS_WEIGHTS).reduce((n,[k,w])=>n+dimensions[k]*w,0)*10)/10;
  const reasons=[];
  if(background)reasons.push('Background explanation or opinion rather than a new reported development.');
  if(weather)reasons.push('Weather disruption is not a science or engineering result.');
  if(appointment)reasons.push('An appointment or proposed mission participant is not a completed achievement.');
  if(theoryOnly)reasons.push('A prediction without a demonstrated result.');
  if(productOnly)reasons.push('Routine launch without a substantial consequence or measured advance.');
  if(routinePublic)reasons.push('Campaign appearance or reaction without a consequential action.');
  if(scoreboard)reasons.push('A live scoreboard is not a self-contained news report.');
  const personalEligible=!reasons.length && (access || headlineScience&&(research||privacy)) && score>=45;
  if(!personalEligible && !reasons.length)reasons.push('No clear, understandable science/technology result or student-access change.');
  return {version:EDITORIAL_VERSION,score,dimensions,personalEligible,routinePublic:routinePublic||scoreboard,evidence,reasons};
}

export function personalStoryEligible(story) {
  if(!editoriallyEligible(story) || !studentAccessibility(story).accessible || conflictTopic(story))return false;
  if(!editorialAssessment(story).personalEligible)return false;
  const title=story.title || '';
  // Corporate compliance, investor coverage and professional tutorials do not
  // become a student's building/science story because they mention chips or AI.
  const businessProcess=/\b(waivers?|compliance|lobbying|earnings|investors?|funding round|accreditor|administrative staff|executive staff|CEO|stocks?|shares?|stock market|price target|designat(?:es?|ed|ion)|critical material)\b/i.test(title);
  const punditry=/\b(warns?|reacts?|experts? say|legal experts|could still|growing wave|Q&A|interview|preview|symposium|guidelines)\b/i.test(title);
  const professional=/\b(PHP|CVE-\d|kernel|database migration|patch management|renal|phonon|spintronic|botnet|homebrew)\b/i.test(title) || /\babandoned\b.*\bapps?\b/i.test(title);
  const routineAdoption=/\b(uses?|adopts?|rolls? out)\b.{0,75}\b(ChatGPT|AI tools?|copilot)\b/i.test(title);
  const conversationalLaunch=/\b(?:AI model|chatbot)\b.{0,70}\b(?:friend|talks to you|companion)\b/i.test(title);
  const careerProfile=/\bwent from\b.+\bto\b/i.test(title) || /\b(career profile|meet the engineer|day in the life)\b/i.test(title);
  if(businessProcess || punditry || professional || routineAdoption || conversationalLaunch || careerProfile)return false;
  return true;
}

export function newsGeography(story) {
  const title=story.title || '', lead=String(story.editorialText || story.explanation || story.summary || '').slice(0,400);
  if(conflictTopic(story)) return 'world';
  const foreign=/\b(Ukraine|Russia|China|Chinese government|Albania|Tunisia|India|Indonesia|France|French|Germany|Britain|British|Iran|Israel|Gaza|Yemen|Japan|Romania|Peru|Canada|Canadian|Mexico|Sudan|Congo)\b/i;
  const domestic=/\b(U\.S\.|US|United States|America|American|Massachusetts|Texas|Boston|Andover|California|New York|Congress|Supreme Court|White House|federal judge|No Kings|ROTC)\b/i;
  if(foreign.test(title) && !/\b(Chinese.American|Asian.American|Chinese language)\b/i.test(title)) return 'world';
  if(domestic.test(title) || story.category==='U.S.' || story.category==='Education') return 'us';
  if(domestic.test(lead) && !foreign.test(title)) return 'us';
  return story.category==='World' || foreign.test(lead) ? 'world' : null;
}

// National/world slots require reporting on public affairs and an actual
// development. Geography alone and a publisher's section tag are insufficient.
export function publicNewsScope(story) {
  const title=story.title || '';
  if(editorialAssessment(story).routinePublic)return null;
  const lead=String(story.editorialText || story.explanation || story.summary || '').split(/\s+/).slice(0,100).join(' ');
  if(/\?\s*$/.test(title) || /^\s*(how |why |inside |the science of |a guide to )/i.test(title)
    || /\b(explainer|analysis|commentary|opinion|column|approval ratings?|book review|literary|Shakespeare|playwright|museum exhibition|art exhibition)\b/i.test(title)) return null;
  if(/\b(would|could|might|may)\b/i.test(title) && !/\b(approved|approves?|passed|passes|ordered|orders?|signed|announced|banned|attacked|struck|killed|launched|overturned|ruled|blocks?|blocked|cuts?|suspended|filed|sues?|sued|resigns?)\b/i.test(title))return null;
  const publicSubject=/\b(presidents?|prime minister|government|Congress|Senate|Supreme Court|courts?|judges?|elections?|vot(?:e|es|ers|ing)|ballots?|midterms?|protests?|demonstrations?|rallies|No Kings|military|troops?|missiles?|airstrikes?|fighter jets?|drones?|war|ceasefire|sanctions?|tariffs?|Federal Reserve|central bank|inflation|unemployment|stock market|earthquake|hurricane|typhoon|wildfire|pandemic|public health|school funding|education funding|statewide|nationwide)\b/i;
  const development=/\b(approve(?:s|d)?|overturn(?:s|ed)?|revers(?:es|ed)|pass(?:es|ed)?|orders?|ordered|signs?|signed|strikes?|attacks?|hits?|killed|kills?|arrests?|arrested|rallies|protests?|demonstrations?|votes?|voted|elections?|ban(?:s|ned)?|rul(?:es|ed|ing)|suspend\w*|waiv\w*|sanctions?|ceasefire|shoot down|shot down|launch\w*|resigns?|resigned|collapsed|evacu\w*|cuts?|raises?|changes?|expands?|surges?|crash\w*|outbreak|deaths?|ablaze)\b/i;
  // A background passage about national issues cannot turn a technical or
  // cultural headline into a current public-news development.
  if(!publicSubject.test(title+' '+lead) || !development.test(title))return null;
  const scope=newsGeography(story);
  const context=title+' '+lead;
  const nationalScale=/\b(national|nationwide|across (?:the )?(?:U\.S\.|US|United States|country)|federal|president|White House|Congress|Senate|Supreme Court|Federal Reserve|No Kings|midterms?|statewide|governor|state government|Massachusetts|Texas|millions|thousands|hundreds)\b/i.test(context);
  const internationalScale=/\b(president|prime minister|government|military|troops?|missiles?|airstrikes?|fighter jets?|war|ceasefire|sanctions?|tariffs?|national|nationwide|central bank|stock market|inflation|unemployment|earthquake|hurricane|typhoon|wildfire|pandemic|outbreak|thousands|hundreds|millions)\b/i.test(context);
  if(scope==='us' && nationalScale)return 'us';
  if(scope==='world' && internationalScale)return 'world';
  if(/\b(Federal Reserve|Congress|Senate|IRS|FBI|Supreme Court)\b/.test(title))return 'us';
  return null;
}

export function personalBriefingProblems(stories) {
  const problems=[];
  if(stories.length!==5)problems.push('The briefing must contain five reports.');
  for(let slot=1;slot<=5;slot++)if(stories.filter(s=>s.briefingSlot===slot).length!==1)problems.push(`Slot ${slot} must occur exactly once.`);
  for(const s of stories){
    if([2,3].includes(s.briefingSlot) && !studentAccessibility(s).accessible)problems.push(`Slot ${s.briefingSlot} requires specialist knowledge.`);
    if([2,3].includes(s.briefingSlot) && !personalStoryEligible(s) && !s.slotOverride)problems.push(`Slot ${s.briefingSlot} has no concrete student-relevant development.`);
    if(![4,5].includes(s.briefingSlot))continue;
    const validOverride=s.slotOverride && personalRelevance(s).critical && personalRelevance(s).score>=85 && s.overrideReason;
    if(!validOverride && publicNewsScope(s)!==(s.briefingSlot===4?'us':'world'))problems.push(`Slot ${s.briefingSlot} is not qualified public-news reporting.`);
  }
  for(let i=0;i<stories.length;i++)for(let j=i+1;j<stories.length;j++)if(samePersonalDevelopment(stories[i],stories[j]))problems.push('Two slots repeat the same development.');
  return problems;
}

export function samePersonalDevelopment(a,b) {
  if(similarStories(a,b)) return true;
  const canonical=s=>{try{const u=new URL(s.url || s.id);return u.hostname.replace(/^www\./,'').replace(/^bbc\.co\.uk$/,'bbc.com')+u.pathname.replace(/\/$/,'');}catch{return s.id;}};
  if(canonical(a)===canonical(b) || a.primaryDoi && a.primaryDoi===b.primaryDoi)return true;
  // Cross-publisher headlines can frame the same action differently. Require
  // several specific shared terms as well as the action; "Trump" or "AI"
  // alone must never collapse unrelated national/technology developments.
  const generic=new Set('trump president officials official government federal judge court news report says scientists researchers research study technology artificial intelligence'.split(' '));
  const xTitle=tokens(a.title || ''),yTitle=tokens(b.title || '');
  const specific=[...xTitle].filter(t=>yTitle.has(t)&&!generic.has(t));
  const actions=[/\b(block\w*|halt\w*|stop\w*)\b/i,/\b(sues?|sued|lawsuits?)\b/i,/\b(bans?|banned|prohibits?)\b/i,/\b(approves?|approved|passes|passed)\b/i,/\b(ceasefire|truce)\b/i,/\b(arrest\w*|detain\w*)\b/i];
  if(specific.length>=4 && specific.length/Math.min(xTitle.size,yTitle.size)>=.35 && actions.some(re=>re.test(a.title)&&re.test(b.title)))return true;
  const locations=[['france',/\b(France|French|Paris)\b/i],['us',/\b(U\.S\.|US|United States|America|American|No Kings)\b/i],['albania',/\b(Albania|Albanian|Tirana)\b/i],['india',/\b(India|Indian|Delhi)\b/i],['tunisia',/\b(Tunisia|Tunis|Tunisian)\b/i],['china',/\b(China|Chinese|Beijing)\b/i],['indonesia',/\b(Indonesia|Jakarta)\b/i],['britain',/\b(Britain|British|London|UK)\b/i]];
  const kinds=[['protests',/\b(protests?|riots?|rallies|demonstrations?|unrest|marches?)\b/i],['quake',/\b(earthquake|quake)\b/i],['wildfire',/\b(wildfires?|forest fires?)\b/i]];
  const keys=s=>{const t=s.title || '';return kinds.flatMap(([kind,re])=>re.test(t)?locations.filter(([,place])=>place.test(t)).map(([place])=>`${place}:${kind}`):[]);};
  const x=keys(a),y=keys(b);return x.some(k=>y.includes(k));
}

function checkedPersonalReport(s) {
  if(!s || typeof s.id!=='string' || typeof s.title!=='string' || !/^https:\/\//.test(s.url || '') || !Number.isFinite(Date.parse(s.publishedAt))) return false;
  const officialNytFeed=/^https:\/\/rss\.nytimes\.com\/services\/xml\/rss\/nyt\/(?:HomePage|US|World|Technology|Science|Education)\.xml$/.test(s.sourceFeedUrl || '');
  const feedLead=s.source==='The New York Times' && (s.nytHomeLead || s.nytFeedSummary && officialNytFeed) && s.feedChecked && /^https:\/\/(?:www\.)?nytimes\.com\//.test(s.url);
  return Boolean((s.sourcePageChecked || s.eventDateVerified || feedLead) && (s.explanation || s.summary || '').trim().length>25);
}

export function publishedPersonalBriefing(stories,{key,editionKey}={}) {
  const slots=new Set();
  const ordered=stories.filter(s=>Number.isInteger(s.briefingSlot) && s.briefingSlot>=1 && s.briefingSlot<=5 && checkedPersonalReport(s))
    .sort((a,b)=>a.briefingSlot-b.briefingSlot).filter(s=>{if(slots.has(s.briefingSlot))return false;slots.add(s.briefingSlot);return true;});
  return ordered.map(s=>editionKey && editionKey!==key?{...s,carriedForward:true}:s);
}

export function studentAccessibility(story) {
  const title=story.title || '', lead=String(story.editorialText || story.explanation || story.summary || '').split(/\s+/).slice(0,180).join(' ');
  const text=`${title} ${lead}`;
  const technical=[/\bvariable.frequency drives?\b|\bVFDs?\b/i,/\bmultimodal\b/i,/\bgeometric structures?\b/i,/\bfirst.principles\b/i,/\bperiodic arrangements? of atoms\b/i,/\bspintronic|altermagnet|rhodopsin|quasiparticle|wavefunction|Hamiltonian|tensor network|phonon|topological|crystallograph\w*\b/i,/\blogical fidelity|magic state|quantum states?\b/i];
  const jargon=technical.filter(re=>re.test(text)).length;
  const everyday=/\b(smart glasses|phones?|laptops?|apps?|ChatGPT|privacy|passwords?|school|students?|college|scholarships?|running|tennis|violin|Rubik|battery fires?|electric cars?|robots?|astronauts?|telescope|images?|Mars|Moon)\b/i.test(title);
  const understandableResult=/\b(recording|sharper images|image quality|fire safety|save money|protect.*privacy|build.*controller|scholarship|college admission)\b/i.test(text);
  const score=Math.max(0,Math.min(100,65+(everyday?22:0)+(understandableResult?10:0)-jargon*24));
  return {score,jargon,accessible:score>=55};
}

export function studentPresentation(story) {
  const original=cleanNewsText(story.explanation || story.summary || story.originalSummary || '');
  // General wording changes apply to tomorrow's articles too. Never generate
  // extra facts, fixes, applications, numbers, or outcomes from a headline.
  const explanation=original.replace(/\binadvertently\b/gi,'by accident')
    .replace(/\boffensive cyber operations\b/gi,'cyberattacks')
    .replace(/\breinforcement-learning environments\b/gi,'training exercises')
    .replace(/\bultra-low-power temperature sensors\b/gi,'temperature sensors that use very little electricity')
    .replace(/\bnanowatt-scale power\b/gi,'extremely small amounts of electrical power')
    .replace(/\bthermal runaway\b/gi,'a chain reaction of battery overheating')
    .replace(/\bphotovoltaic cells\b/gi,'solar cells')
    .replace(/\butiliz(?:e|es|ing)\b/gi,m=>({utilize:'use',utilizes:'uses',utilizing:'using'}[m.toLowerCase()]));
  const summaryKind=explanation===original?story.summaryKind:'Source excerpt with simpler wording';
  return {...story,displayTitle:story.displayTitle || story.title,explanation,summary:explanation,summaryKind};
}

export function selectPersonalBriefing(stories,{key,history={},fallback=[],now=new Date(),nytLead=null}={}) {
  const prior=Object.values(history).filter(h=>h.editionKey);
  const alreadySeen=s=>prior.some(h=>(h.id===s.id || h.title && samePersonalDevelopment(h,s))) && !s.majorUpdateVerified;
  const current=stories.filter(checkedPersonalReport);
  const recent=rankStories(current.filter(s=>!alreadySeen(s)),now,{broad:true,minScore:0,limit:200});
  const older=rankStories(current.filter(s=>!alreadySeen(s)),now,{broad:true,minScore:0,limit:200,maxAgeHours:168}).filter(s=>!recent.some(r=>r.id===s.id));
  const archives=fallback.filter(checkedPersonalReport).filter(editoriallyEligible).filter(s=>+now-Date.parse(s.publishedAt)<=7*86400000 && s.articleAccess!=='paywalled');
  const chosen=[];
  const unused=s=>!chosen.some(p=>samePersonalDevelopment(p,s)) && (!conflictTopic(s) || !chosen.some(p=>conflictTopic(p)===conflictTopic(s)));
  const relevance=s=>personalRelevance(s);
  const quality=s=>editorialAssessment(s).score+(s.freshness==='24h'?3:0)-chosen.filter(p=>p.source===s.source).length*3;
  const personalPriority=s=>editorialAssessment(s).score-Math.max(0,(+now-Date.parse(s.publishedAt))/3600000-24)*.4+(s.freshness==='24h'?3:0)-chosen.filter(p=>p.source===s.source).length*3-chosen.filter(p=>p.personalTopic && p.personalTopic===relevance(s).primaryTopic).length*4;
  const preservesDefaultSlots=s=>{
    const geo=publicNewsScope(s);
    if(!['us','world'].includes(geo) || chosen.some(p=>p.briefingSlot===(geo==='us'?4:5)))return true;
    const available=[...recent,...older,...archives].filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i).filter(v=>unused(v)&&publicNewsScope(v)===geo);
    return available.length>1;
  };
  const pick=(pool,predicate,personal=false)=>pool.filter(s=>unused(s) && predicate(s) && (!personal || preservesDefaultSlots(s))).sort((a,b)=>
    (personal?personalPriority(b):quality(b))
    -(personal?personalPriority(a):quality(a)))[0];
  const put=(s,slot,label,flags={})=>{
    if(!s)return;const r=relevance(s);
    const presented=[2,3].includes(slot)?studentPresentation(s):{...s,explanation:cleanNewsText(s.explanation || s.summary),summary:cleanNewsText(s.explanation || s.summary)};
    chosen.push({...presented,editorial:editorialAssessment(s),briefingSlot:slot,slotLabel:label,personalTopic:r.primaryTopic,whyForYou:r.connection,selectedEdition:key,...flags});
  };
  // First means first in NYT's official HomePage RSS order, not most-clicked.
  const lead=checkedPersonalReport(nytLead)?nytLead:current.find(s=>s.nytHomeLead && s.source==='The New York Times');
  if(lead) put(lead,1,'NYT lead',{leadUnchanged:alreadySeen(lead),carriedForward:false,olderReport:false});
  else {
    const previous=archives.find(s=>s.briefingSlot===1 && s.source==='The New York Times');
    if(previous)put(previous,1,'NYT lead · saved',{carriedForward:true,nytUnavailable:true});
    else put(pick(recent,s=>!personalStoryEligible(s)&&preservesDefaultSlots(s))||pick(archives,s=>!personalStoryEligible(s)&&preservesDefaultSlots(s))||pick(recent,()=>true)||pick(archives,()=>true),1,'Top story · NYT unavailable',{nytUnavailable:true});
  }
  const goodPersonal=s=>personalStoryEligible(s);
  for(const slot of [2,3]) {
    let s=pick([...recent,...older.filter(s=>+now-Date.parse(s.publishedAt)<=72*3600000)],goodPersonal,true),flags={carriedForward:false,olderReport:false};
    if(s)flags.olderReport=!recent.some(r=>r.id===s.id);
    if(!s){s=pick(older,goodPersonal,true);flags.olderReport=true;}
    if(!s){s=pick(archives,s=>goodPersonal(s)&&!alreadySeen(s),true);flags={olderReport:true};}
    if(!s){s=pick(archives,goodPersonal,true);flags={carriedForward:true};}
    put(s,slot,'For you',flags);
  }
  for(const [slot,geo,label] of [[4,'us','U.S. news'],[5,'world','World news']]) {
    let s=pick(recent,s=>publicNewsScope(s)===geo),flags={carriedForward:false,olderReport:false};
    if(!s){s=pick(older,s=>publicNewsScope(s)===geo);flags.olderReport=true;}
    if(!s){s=pick(archives,s=>publicNewsScope(s)===geo&&!alreadySeen(s));flags={olderReport:true};}
    put(s,slot,label,flags);
  }
  // An actual eligibility/deadline/cost change can displace one default slot.
  const urgent=pick(recent,s=>relevance(s).critical && relevance(s).score>=85,true);
  if(urgent && chosen.length===5){const old=chosen.find(s=>s.briefingSlot===5);chosen.splice(chosen.indexOf(old),1);put(urgent,5,'Affects you',{slotOverride:true,overrideReason:relevance(urgent).connection});}
  // Preserve five genuine reports during outages without silently changing labels.
  for(let slot=1;slot<=5;slot++)if(!chosen.some(s=>s.briefingSlot===slot)){
    const safe=s=>slot===4?publicNewsScope(s)==='us':slot===5?publicNewsScope(s)==='world':![2,3].includes(slot)||goodPersonal(s);
    const s=pick(archives,safe)||pick(recent,safe)||pick(older,safe);
    put(s,slot,slot===1?'Top story · NYT unavailable':slot===4?'U.S. news':slot===5?'World news':'Coverage kept',{carriedForward:true,slotOverride:true,overrideReason:'No qualifying report for this slot; retaining sourced coverage.'});
  }
  return chosen.sort((a,b)=>a.briefingSlot-b.briefingSlot);
}
