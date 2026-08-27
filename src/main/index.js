import { app, BrowserWindow, Menu } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createStore } from './store.js';
import { createPoller } from './poller.js';
import { registerIpc } from './ipc.js';
import { loadSettings, saveSettings } from './settingsStore.js';
import { stationConfig } from './stations/index.js';
import { fetchStreamStatus as fetchShoutcastStatus } from './services/streamStatus/shoutcast.js';
import { fetchStreamStatus as fetchIcecastStatus } from './services/streamStatus/icecast.js';
import { fetchRadioNews as fetchCustomApiNews } from './services/radioNewsService.js';
import { fetchRadioNews as fetchFirecrawlNews } from './services/news/firecrawlNewsService.js';
import { fetchPortal } from './services/rssService.js';
import { FEED_SOURCES } from './services/feedSources.js';
import { fetchRegionalNews } from './services/regionalNewsService.js';
import { fetchWeather } from './services/weatherService.js';
import { fetchWeatherAlerts } from './services/weatherAlertsService.js';
import { fetchCurrency } from './services/currencyService.js';
import { fetchFootball } from './services/footballService.js';
import { fetchHolidays } from './services/holidaysService.js';
import { fetchLottery } from './services/lotteryService.js';
import { fetchSaint } from './services/saintService.js';
import { fetchCalendar } from './services/calendarService.js';
import { fetchYoutubeVideos } from './services/youtubeService.js';
import { notifyNewRadioNews } from './notifier.js';
import { setupAutoUpdater, consumeFullscreenFlag } from './updater.js';
import { loadWindowState, getInitialBounds, attachWindowState } from './windowState.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Nome do app derivado da emissora ativa — chamado antes de qualquer
// app.getPath('userData'), pra cada emissora ter sua própria pasta de
// settings/cache quando testadas na mesma máquina.
app.setName(stationConfig.RADIO_NAME);

// Sem isso, o Windows mostra "electron.app.Electron" nas notificações em vez
// do nome do app — precisa ser o mesmo appId usado no electron-builder.config.js.
const APP_USER_MODEL_IDS = {
  sarandi: 'com.radiosarandi.newsroom-dashboard',
  cacique: 'com.tuaradiocacique.newsroom-dashboard',
};
app.setAppUserModelId(APP_USER_MODEL_IDS[stationConfig.STATION_SLUG] || APP_USER_MODEL_IDS.sarandi);

// Mesmo ícone do PlayNews em qualquer emissora.
const ICON_PATH = join(__dirname, '../../build/icon.ico');

function fetchStreamStatus() {
  return stationConfig.STREAM_STATUS.type === 'icecast'
    ? fetchIcecastStatus(stationConfig.STREAM_STATUS.url)
    : fetchShoutcastStatus(stationConfig.STREAM_STATUS.url);
}

function fetchRadioNews() {
  return stationConfig.NEWS.type === 'firecrawl' ? fetchFirecrawlNews() : fetchCustomApiNews();
}

function createWindow() {
  const windowState = loadWindowState();
  const win = new BrowserWindow({
    ...getInitialBounds(windowState),
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    icon: ICON_PATH,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false,
    },
  });

  attachWindowState(win);

  // Links de notícia/vídeo (target="_blank") abrem numa janela Electron nova
  // (não no navegador do sistema) — sem overrideBrowserWindowOptions aqui,
  // essa janela nasce sem ícone configurado e mostra o ícone genérico do
  // Electron em vez do ícone do app.
  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      icon: ICON_PATH,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    },
  }));

  // Tratado no processo main (before-input-event) em vez de um listener no
  // renderer — funciona independente de qual elemento está com foco na página.
  // preventDefault() evita que o F11 seja engolido por algum acelerador nativo
  // padrão do Electron antes de chegar aqui.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    }
  });

  // Reabre em tela cheia se veio de uma auto-atualização OU se já estava em
  // tela cheia na sessão anterior. Como os bounds já foram restaurados acima,
  // a tela cheia acontece no mesmo monitor onde a janela estava.
  if (consumeFullscreenFlag() || windowState?.fullscreen) {
    win.setFullScreen(true);
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

function startPollers(store, settings, getSettings) {
  const pollers = {};

  pollers.listeners = createPoller({
    key: 'listeners',
    intervalMs: settings.listeners,
    fetchFn: fetchStreamStatus,
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.listeners.start();

  pollers.radioNews = createPoller({
    key: 'radioNews',
    intervalMs: settings.radioNews,
    fetchFn: async () => {
      const previous = store.getSnapshot().radioNews.data;
      const items = await fetchRadioNews();
      notifyNewRadioNews(previous, items);
      return items;
    },
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.radioNews.start();

  pollers.regionalNews = createPoller({
    key: 'regionalNews',
    intervalMs: settings.regionalNews,
    // Lê a lista de feeds na hora do fetch (não na criação do poller), para
    // refletir mudanças feitas na tela de Configurações sem reiniciar o app.
    fetchFn: () => fetchRegionalNews(getSettings().regionalRssUrls, getSettings().regionalBlockedDomains),
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.regionalNews.start();

  pollers.weather = createPoller({
    key: 'weather',
    intervalMs: settings.weather,
    // Lê lat/lon/cidades extras na hora do fetch (não na criação do poller),
    // pra refletir mudanças feitas na tela de Configurações sem reiniciar o app.
    fetchFn: () => fetchWeather(getSettings()),
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.weather.start();

  pollers.weatherAlerts = createPoller({
    key: 'weatherAlerts',
    intervalMs: settings.weatherAlerts,
    fetchFn: () => fetchWeatherAlerts(getSettings().weatherAlertCityMatch),
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.weatherAlerts.start();

  pollers.currency = createPoller({
    key: 'currency',
    intervalMs: settings.currency,
    fetchFn: fetchCurrency,
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.currency.start();

  pollers.football = createPoller({
    key: 'football',
    intervalMs: settings.football,
    fetchFn: fetchFootball,
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.football.start();

  pollers.holidays = createPoller({
    key: 'holidays',
    intervalMs: settings.holidays,
    fetchFn: fetchHolidays,
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.holidays.start();

  pollers.lottery = createPoller({
    key: 'lottery',
    intervalMs: settings.lottery,
    fetchFn: fetchLottery,
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.lottery.start();

  pollers.saint = createPoller({
    key: 'saint',
    intervalMs: settings.saint,
    fetchFn: fetchSaint,
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.saint.start();

  pollers.calendar = createPoller({
    key: 'calendar',
    intervalMs: settings.calendar,
    // Lê a URL na hora do fetch (não na criação do poller), pra refletir
    // mudanças feitas na tela de Configurações sem reiniciar o app.
    fetchFn: () => fetchCalendar(getSettings().calendarIcsUrl),
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.calendar.start();

  pollers.youtube = createPoller({
    key: 'youtube',
    intervalMs: settings.youtube,
    // Lê a URL na hora do fetch (não na criação do poller), pra refletir
    // mudanças feitas na tela de Configurações sem reiniciar o app.
    fetchFn: () => fetchYoutubeVideos(getSettings().youtubeUrl),
    onResult: (key, patch) => store.update(key, patch),
  });
  pollers.youtube.start();

  FEED_SOURCES.forEach((source, index) => {
    const storeKey = `externalNews:${source.key}`;
    const poller = createPoller({
      key: storeKey,
      intervalMs: settings.externalNews,
      fetchFn: () => fetchPortal(source),
      onResult: (key, patch) => store.update(key, patch),
    });
    // pequeno atraso inicial escalonado só no primeiro fetch, pra não disparar
    // as 4 requisições de portal no mesmo instante
    poller.start({ delayMs: index * 3000 });
    pollers[source.key] = poller;
  });

  return pollers;
}

// Aplica um patch de configurações (ex.: { listeners: 60000 }) aos pollers já
// rodando, sem precisar reiniciar o app.
function applyIntervalSettings(pollers, partial) {
  for (const [key, ms] of Object.entries(partial)) {
    if (key === 'externalNews') {
      FEED_SOURCES.forEach((source) => pollers[source.key]?.setIntervalMs(ms));
    } else {
      pollers[key]?.setIntervalMs(ms);
    }
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  const store = createStore();
  const win = createWindow();
  let settings = loadSettings();
  const getSettings = () => settings;
  const pollers = startPollers(store, settings, getSettings);

  registerIpc({
    win,
    store,
    pollers,
    getSettings,
    updateSettings: (partial) => {
      settings = { ...settings, ...partial };
      saveSettings(settings);
      applyIntervalSettings(pollers, partial);
      // Feeds/URL mudaram: busca de novo já, sem esperar o próximo ciclo do poller.
      if ('regionalRssUrls' in partial || 'regionalBlockedDomains' in partial) pollers.regionalNews?.refreshNow();
      if ('calendarIcsUrl' in partial) pollers.calendar?.refreshNow();
      if ('youtubeUrl' in partial) pollers.youtube?.refreshNow();
      if (['weatherLat', 'weatherLon', 'weatherCityLabel', 'weatherExtraCities'].some((k) => k in partial)) {
        pollers.weather?.refreshNow();
      }
      if ('weatherAlertCityMatch' in partial) pollers.weatherAlerts?.refreshNow();
      return settings;
    },
  });

  setupAutoUpdater(win);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
