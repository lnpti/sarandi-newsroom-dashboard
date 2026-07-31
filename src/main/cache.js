import { app } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function cachePath() {
  return join(app.getPath('userData'), 'cache.json');
}

export function loadCache() {
  try {
    const raw = readFileSync(cachePath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCache(snapshot) {
  try {
    writeFileSync(cachePath(), JSON.stringify(snapshot), 'utf-8');
  } catch {
    // cache is best-effort; ignore write failures (e.g. disk full)
  }
}
