import { loadCache, saveCache } from './cache.js';
import { LISTENER_HISTORY_MAX } from './config.js';

const EXTERNAL_KEYS = ['g1', 'gzh', 'uol', 'cbn'];

function emptySourceNode() {
  return { status: 'loading', data: null, lastUpdated: null, error: null };
}

function initialSnapshot() {
  const cached = loadCache();
  const base = {
    listeners: emptySourceNode(),
    listenerHistory: [],
    radioNews: emptySourceNode(),
    regionalNews: emptySourceNode(),
    weather: emptySourceNode(),
    weatherAlerts: emptySourceNode(),
    currency: emptySourceNode(),
    football: emptySourceNode(),
    holidays: emptySourceNode(),
    lottery: emptySourceNode(),
    saint: emptySourceNode(),
    calendar: emptySourceNode(),
    externalNews: Object.fromEntries(EXTERNAL_KEYS.map((k) => [k, emptySourceNode()])),
  };
  if (!cached) return base;
  return {
    listeners: { ...base.listeners, ...cached.listeners },
    listenerHistory: Array.isArray(cached.listenerHistory) ? cached.listenerHistory : [],
    radioNews: { ...base.radioNews, ...cached.radioNews },
    regionalNews: { ...base.regionalNews, ...cached.regionalNews },
    weather: { ...base.weather, ...cached.weather },
    weatherAlerts: { ...base.weatherAlerts, ...cached.weatherAlerts },
    currency: { ...base.currency, ...cached.currency },
    football: { ...base.football, ...cached.football },
    holidays: { ...base.holidays, ...cached.holidays },
    lottery: { ...base.lottery, ...cached.lottery },
    saint: { ...base.saint, ...cached.saint },
    calendar: { ...base.calendar, ...cached.calendar },
    externalNews: Object.fromEntries(
      EXTERNAL_KEYS.map((k) => [k, { ...base.externalNews[k], ...cached.externalNews?.[k] }])
    ),
  };
}

export function createStore() {
  let snapshot = initialSnapshot();
  const listeners = new Set();

  function getSnapshot() {
    return snapshot;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    for (const fn of listeners) fn(snapshot);
  }

  function appendListenerHistory(patch) {
    const history = [...snapshot.listenerHistory, { t: Date.now(), current: patch.data.current }];
    if (history.length > LISTENER_HISTORY_MAX) history.splice(0, history.length - LISTENER_HISTORY_MAX);
    snapshot = { ...snapshot, listenerHistory: history };
  }

  // key is either a top-level key ('listeners'|'radioNews'|'weather') or 'externalNews:<portal>'
  function update(key, patch) {
    if (key.startsWith('externalNews:')) {
      const portal = key.split(':')[1];
      snapshot = {
        ...snapshot,
        externalNews: {
          ...snapshot.externalNews,
          [portal]: { ...snapshot.externalNews[portal], ...patch },
        },
      };
    } else {
      snapshot = { ...snapshot, [key]: { ...snapshot[key], ...patch } };
      if (key === 'listeners' && patch.status === 'ok') appendListenerHistory(patch);
    }
    if (patch.status === 'ok') saveCache(snapshot);
    notify();
  }

  return { getSnapshot, subscribe, update };
}
