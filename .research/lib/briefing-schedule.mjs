import {PERSONAL_NEWS_LAYOUT} from '../public/news.js';
import { checkInWindow } from '../public/shared.js';

// GitHub cron can start late. Catch up by edition, never by the arrival hour.
export function briefingDue(previous, now = new Date()) {
  if (previous?.news?.layout !== PERSONAL_NEWS_LAYOUT || previous?.news?.schemaVersion !== 2 || previous.news.editionKey !== checkInWindow(now).key
    || !Array.isArray(previous.news.stories) || !Number.isFinite(Date.parse(previous.fetchedAt))) return true;
  // A short edition can gain genuinely new reporting later in the window.
  const needsMore=previous.news.stories.length<5 || previous.news.stories.some(s=>s?.carriedForward || s?.olderReport) || previous.news.nytStatus?.available===false;
  return needsMore && +now - Date.parse(previous.fetchedAt) >= 60 * 60 * 1000;
}
