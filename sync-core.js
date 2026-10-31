// Personal data only. Provider caches, credentials, and UI state stay on-device.
const lists = ['tasks', 'studySessions', 'runs', 'lifts', 'moments', 'events', 'bookmarks'];
const sets = ['knownWords', 'completedEvents'];
const maps = ['youtubeSessions', 'duolingoDays', 'recapHighlights'];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const safeName = value => typeof value === 'string' && value.length <= 2000 && !['__proto__', 'constructor', 'prototype'].includes(value);

export function flattenPersonal(state) {
  const result = {};
  const put = (path, value) => { result[JSON.stringify(path)] = structuredClone(value); };
  for (const field of lists) for (const value of state[field] || []) put([field, value.id], value);
  for (const field of sets) for (const value of state[field] || []) put([field, value], true);
  for (const field of maps) for (const [id, value] of Object.entries(state[field] || {})) put([field, id], value);
  for (const [id, session] of Object.entries(state.sessions || {})) {
    for (const exercise of ['pushups', 'situps']) put(['sessions', id, exercise], session[exercise] === true);
  }
  put(['notepad', 'text'], state.notepad?.text || '');
  put(['sheetUrl'], state.sheetUrl || '');
  return result;
}

function pathFor(key) {
  let path; try { path = JSON.parse(key); } catch { throw new Error('Invalid sync entry.'); }
  if (!Array.isArray(path) || !path.every(safeName)) throw new Error('Invalid sync path.');
  const [field, id, part] = path;
  const allowed = path.length === 2 && [...lists, ...sets, ...maps].includes(field)
    || path.length === 3 && field === 'sessions' && /^\d{4}-\d{2}-\d{2}-(am|pm)$/.test(id) && ['pushups', 'situps'].includes(part)
    || path.length === 2 && field === 'notepad' && id === 'text'
    || path.length === 1 && field === 'sheetUrl';
  if (!allowed) throw new Error('Unsupported sync field.');
  return path;
}

export function validateEntries(entries) {
  if (!entries || typeof entries !== 'object' || Array.isArray(entries) || Object.keys(entries).length > 20000 || JSON.stringify(entries).length > 4_000_000) throw new Error('Sync data is invalid or too large.');
  for (const [key, entry] of Object.entries(entries)) {
    const path = pathFor(key);
    if (!entry || !Number.isSafeInteger(entry.clock) || entry.clock < 1 || typeof entry.actor !== 'string' || !/^[\w-]{1,128}$/.test(entry.actor) || typeof entry.deleted !== 'boolean' || !own(entry, 'value')) throw new Error('Invalid sync version.');
    if (!entry.deleted && lists.includes(path[0]) && (!entry.value || entry.value.id !== path[1])) throw new Error('Invalid synced item.');
    if (!entry.deleted && (sets.includes(path[0]) || path[0] === 'sessions') && typeof entry.value !== 'boolean') throw new Error('Invalid synced checkbox.');
  }
  return entries;
}

export function compareVersions(a, b) {
  return a.clock - b.clock || (a.actor < b.actor ? -1 : a.actor > b.actor ? 1 : 0);
}

export function mergeEntries(left, right) {
  validateEntries(left); validateEntries(right);
  const merged = structuredClone(left);
  for (const [key, entry] of Object.entries(right)) if (!own(merged, key) || compareVersions(entry, merged[key]) > 0) merged[key] = structuredClone(entry);
  validateEntries(merged);
  return merged;
}

export function applyEntries(state, entries) {
  validateEntries(entries);
  const result = structuredClone(state);
  for (const [key, entry] of Object.entries(entries)) {
    const [field, id, part] = pathFor(key);
    if (lists.includes(field)) {
      const values = new Map((result[field] || []).map(value => [value.id, value]));
      if (entry.deleted) values.delete(id); else values.set(id, structuredClone(entry.value));
      result[field] = [...values.values()];
    } else if (sets.includes(field)) {
      const values = new Set(result[field] || []);
      if (entry.deleted || !entry.value) values.delete(id); else values.add(id);
      result[field] = [...values];
    } else if (maps.includes(field)) {
      result[field] ||= {};
      if (entry.deleted) delete result[field][id]; else result[field][id] = structuredClone(entry.value);
    } else if (field === 'sessions') {
      result.sessions[id] ||= { pushups: false, situps: false };
      result.sessions[id][part] = !entry.deleted && entry.value === true;
    } else if (field === 'notepad') result.notepad.text = entry.deleted ? '' : entry.value;
    else if (field === 'sheetUrl') {
      const url = entry.deleted ? '' : entry.value;
      if (result.sheetUrl !== url) { result.sheetEvents = []; result.sheetFetchedAt = null; result.sheetSlot = null; }
      result.sheetUrl = url; result.sheetConfigured = true;
    }
  }
  // Rebuild collections in a stable order on all devices.
  for (const field of lists) (result[field] ||= []).sort((a,b) => field === 'moments' ? (b.createdAt || '').localeCompare(a.createdAt || '') || a.id.localeCompare(b.id) : a.id.localeCompare(b.id));
  return result;
}

export class SyncJournal {
  constructor({ actor, initial, empty, saved, now = Date.now }) {
    this.actor = actor; this.now = now;
    this.entries = saved?.entries ? validateEntries(saved.entries) : {};
    this.clock = Math.max(0, ...Object.values(this.entries).map(entry => entry.clock));
    this.observed = saved?.observed || flattenPersonal(empty);
    this.pending = new Set(saved?.pending || []);
    this.capture(initial);
  }
  capture(state) {
    const next = flattenPersonal(state);
    for (const key of new Set([...Object.keys(this.observed), ...Object.keys(next)])) {
      if (own(next, key) === own(this.observed, key) && same(next[key], this.observed[key])) continue;
      // A previously unconnected device knows that a checked set happened;
      // an unchecked default is not evidence to erase another device's set.
      if (!own(this.observed, key) && !own(this.entries, key) && JSON.parse(key)[0] === 'sessions' && next[key] === false) continue;
      this.clock = Math.max(this.clock + 1, this.now());
      this.entries[key] = { clock: this.clock, actor: this.actor, deleted: !own(next, key), value: own(next, key) ? next[key] : null };
      this.pending.add(key);
    }
    this.observed = next;
    validateEntries(this.entries);
  }
  changes() { return Object.fromEntries([...this.pending].map(key => [key, this.entries[key]])); }
  accept(remote, state, validateState) {
    // Validate the complete resulting state BEFORE acknowledging or mutating the journal.
    const merged = mergeEntries(this.entries, remote);
    const next = validateState(applyEntries(state, merged));
    for (const key of this.pending) if (remote[key] && compareVersions(remote[key], this.entries[key]) >= 0) this.pending.delete(key);
    this.entries = merged;
    this.clock = Math.max(this.clock, ...Object.values(merged).map(entry => entry.clock));
    this.observed = flattenPersonal(next);
    return next;
  }
  saved() { return {entries: this.entries, observed: this.observed, pending: [...this.pending]}; }
}
