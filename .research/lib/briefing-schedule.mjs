import {PERSONAL_NEWS_LAYOUT,personalBriefingProblems,EDITORIAL_VERSION} from '../public/news.js';
import { checkInWindow } from '../public/shared.js';

// GitHub cron can start late. Catch up by edition, never by the arrival hour.
export function briefingDue(previous, now = new Date()) {
  if (previous?.news?.layout !== PERSONAL_NEWS_LAYOUT || previous?.news?.schemaVersion !== 2 || previous.news.editionKey !== checkInWindow(now).key
    || !Array.isArray(previous.news.stories) || !Number.isFinite(Date.parse(previous.fetchedAt))) return true;
  if(previous.news.editorialVersion!==EDITORIAL_VERSION)return true;
  if(personalBriefingProblems(previous.news.stories).length)return true;
  // A complete edition is stable until the next check-in. Rotating whenever
  // a card was carried/older consumed good stories hourly and degraded later runs.
  const needsMore=previous.news.stories.length<5;
  return needsMore && +now - Date.parse(previous.fetchedAt) >= 60 * 60 * 1000;
}
