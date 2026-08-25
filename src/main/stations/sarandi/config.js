export const STATION_SLUG = 'sarandi';
export const RADIO_NAME = 'Rádio Sarandi 103.3';

export const STREAM_STATUS = {
  type: 'shoutcast',
  url: 'https://vp090.voope.com.br/8052/stats?json=1',
};

export const NEWS = {
  type: 'custom-api',
  apiUrl: 'https://radiosarandi.com.br/api-noticias/',
  apiKey: '8f7b3d96c10a42eeab5849f0d76325ca7d93e8638ad11686d807aa15355bd92exx',
  siteBase: 'https://radiosarandi.com.br',
  imgBase: 'https://radiosarandi.com.br/arquivos/img_noticia_v2/',
  audioBase: 'https://radiosarandi.com.br/arquivos/audio_noticia_v2/',
  windowDays: 10,
  itemLimit: 15,
};

// Sarandi - RS (cidade da rádio)
export const CITY_LABEL = 'Sarandi';
export const WEATHER_LAT = -27.94389;
export const WEATHER_LON = -52.92278;
export const WEATHER_ALERT_CITY_MATCH = 'Sarandi - RS';

export const FOOTBALL_TEAMS = [
  { key: 'gremio', name: 'Grêmio', espnId: '6273' },
  { key: 'inter', name: 'Internacional', espnId: '1936' },
];

// Feed RSS do Google Alertas: Sarandi RS e municípios vizinhos.
export const DEFAULT_REGIONAL_RSS_URLS = [
  'https://www.google.com.br/alerts/feeds/08693795775322126867/9253604654146928066',
];

export const ACCENT = '#e63946';
