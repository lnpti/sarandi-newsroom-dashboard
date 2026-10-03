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
    regionalBlockedDomains: stationConfig.DEFAULT_REGIONAL_BLOCKED_DOMAINS || [],
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
      'footballWorld',
      'dailyInfo',
      'currency',
      'agro',
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
function migrateKioskSlides(slides) {
  if (!Array.isArray(slides)) return slides;

  let next = slides;
  if (next.some((k) => OLD_DAILY_KEYS.includes(k))) {
    const filtered = next.filter((k) => !OLD_DAILY_KEYS.includes(k));
    next = filtered.includes('dailyInfo') ? filtered : [...filtered, 'dailyInfo'];
  }

  // IMPORTANTE: aqui NÃO se reativa tela que o usuário desligou. "Flashs" e
  // "YouTube" já foram forçados de volta a cada abertura do app (qualquer tela
  // ausente da lista era readicionada) — quem desligava uma delas a via voltar
  // a cada atualização. A lista salva manda.
  return next;
}

export function loadSettings() {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8');
    const merged = { ...defaults(), ...JSON.parse(raw) };
    // A lista de telas do Modo TV salva é a verdade: atualizar o app NUNCA liga
    // nem desliga tela nenhuma. Tela nova aparece desmarcada em Configurações
    // (só instalação nova já vem com ela, pelo defaults()).
    merged.kioskEnabledSlides = migrateKioskSlides(merged.kioskEnabledSlides);
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
