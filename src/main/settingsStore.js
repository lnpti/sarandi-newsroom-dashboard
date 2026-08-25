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
    youtubeUrl: stationConfig.DEFAULT_YOUTUBE_URL || '',
    weatherCityLabel: stationConfig.CITY_LABEL,
    weatherLat: stationConfig.WEATHER_LAT,
    weatherLon: stationConfig.WEATHER_LON,
    weatherAlertCityMatch: stationConfig.WEATHER_ALERT_CITY_MATCH,
    weatherExtraCities: stationConfig.DEFAULT_WEATHER_EXTRA_CITIES || [],
    kioskModeOn: false,
    kioskEnabledSlides: [
      'radioNews',
      'externalNews',
      'regionalNews',
      'weather',
      'football',
      'dailyInfo',
      'currency',
      'calendar',
      // Só entra se a estação já tem um canal configurado — senão ninguém
      // quer uma tela vazia de "nenhum vídeo encontrado" no rodízio.
      ...(stationConfig.DEFAULT_YOUTUBE_URL ? ['youtube'] : []),
    ],
    kioskSecondsPerSlide: 20,
  };
}

// Loterias/feriados/santo do dia viraram uma única tela ("dailyInfo") — quem
// já tinha configurado o Modo TV com as 3 telas antigas separadas precisa
// migrar pra não perder a tela ao abrir o app com essa versão.
const OLD_DAILY_KEYS = ['lottery', 'holidays', 'saint'];
function migrateKioskSlides(slides, youtubeUrl) {
  if (!Array.isArray(slides)) return slides;

  let next = slides;
  if (next.some((k) => OLD_DAILY_KEYS.includes(k))) {
    const filtered = next.filter((k) => !OLD_DAILY_KEYS.includes(k));
    next = filtered.includes('dailyInfo') ? filtered : [...filtered, 'dailyInfo'];
  }

  // Tela nova ("Flashs Agendados") — quem já tinha configurado o Modo TV
  // antes dela existir precisa ganhá-la sem precisar mexer nas Configurações.
  if (!next.includes('calendar')) next = [...next, 'calendar'];

  // Idem pro YouTube, mas só quando já existe um canal configurado (senão
  // vira uma tela vazia no meio do rodízio de quem nunca cadastrou nada).
  if (youtubeUrl && !next.includes('youtube')) next = [...next, 'youtube'];

  return next;
}

export function loadSettings() {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8');
    const merged = { ...defaults(), ...JSON.parse(raw) };
    merged.kioskEnabledSlides = migrateKioskSlides(merged.kioskEnabledSlides, merged.youtubeUrl);
    return merged;
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
