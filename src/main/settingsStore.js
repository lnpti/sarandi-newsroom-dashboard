import { app } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_POLL_INTERVALS_MS } from './config.js';

function settingsPath() {
  return join(app.getPath('userData'), 'settings.json');
}

export function loadSettings() {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8');
    return { ...DEFAULT_POLL_INTERVALS_MS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_POLL_INTERVALS_MS };
  }
}

export function saveSettings(settings) {
  try {
    writeFileSync(settingsPath(), JSON.stringify(settings), 'utf-8');
  } catch {
    // configurações são best-effort; ignora falha de escrita (ex.: disco cheio)
  }
}
