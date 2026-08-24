import { app } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_POLL_INTERVALS_MS } from './config.js';
import { stationConfig } from './stations/index.js';

function settingsPath() {
  return join(app.getPath('userData'), 'settings.json');
}

function defaults() {
  return {
    ...DEFAULT_POLL_INTERVALS_MS,
    regionalRssUrls: stationConfig.DEFAULT_REGIONAL_RSS_URLS,
    calendarIcsUrl: '',
  };
}

export function loadSettings() {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8');
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function saveSettings(settings) {
  try {
    writeFileSync(settingsPath(), JSON.stringify(settings), 'utf-8');
  } catch {
    // configurações são best-effort; ignora falha de escrita (ex.: disco cheio)
  }
}
