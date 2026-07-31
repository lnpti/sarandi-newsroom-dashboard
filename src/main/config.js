export const LISTENER_STATS_URL = 'https://vp090.voope.com.br/8052/stats?json=1';
export const STREAM_URL = 'https://vp090.voope.com.br/8052/;';

export const NEWS_API_URL = 'https://radiosarandi.com.br/api-noticias/';
export const NEWS_API_KEY = '8f7b3d96c10a42eeab5849f0d76325ca7d93e8638ad11686d807aa15355bd92exx';
export const NEWS_SITE_BASE = 'https://radiosarandi.com.br';
export const NEWS_IMG_BASE = 'https://radiosarandi.com.br/arquivos/img_noticia_v2/';
export const NEWS_AUDIO_BASE = 'https://radiosarandi.com.br/arquivos/audio_noticia_v2/';
export const NEWS_WINDOW_DAYS = 2;
export const NEWS_ITEM_LIMIT = 20;

export const RSS_ITEM_LIMIT = 10;

// Mesmas coordenadas de radiosarandi-app/stations/sarandi/config.js
export const WEATHER_LAT = -27.94389;
export const WEATHER_LON = -52.92278;

// API pública do INMET com avisos meteorológicos ativos (sem chave)
export const INMET_ALERTS_URL = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';
export const WEATHER_ALERT_CITY_MATCH = 'Sarandi - RS';

// AwesomeAPI — cotações de moedas, gratuita e sem chave
export const CURRENCY_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';

// API pública da ESPN (sem chave). fixture=true traz só jogos futuros.
// Slug "all" cobre TODAS as competições (Brasileirão, Copa do Brasil,
// Libertadores/Sul-Americana) — bra.1 sozinho escondia jogos de outras
// competições e bagunçava a ordem dos próximos jogos.
export const ESPN_SCHEDULE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams';
export const FOOTBALL_TEAMS = [
  { key: 'gremio', name: 'Grêmio', espnId: '6273' },
  { key: 'inter', name: 'Internacional', espnId: '1936' },
];

// Notícias regionais via Google Notícias (sem chave): busca por Sarandi-RS e
// municípios vizinhos. "Sarandi RS" (em vez de só "Sarandi") reduz o ruído da
// Sarandi-PR; -"bairro Sarandi" corta o bairro homônimo de Porto Alegre.
export const REGIONAL_NEWS_QUERY =
  'Sarandi RS OR Rondinha OR "Ronda Alta" OR "Palmeira das Missões" OR Constantina OR "Nova Boa Vista" OR "Sagrada Família" OR "Coqueiros do Sul" -"bairro Sarandi"';
export const REGIONAL_NEWS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(
  REGIONAL_NEWS_QUERY
)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
export const REGIONAL_ITEM_LIMIT = 8;

// BrasilAPI — feriados nacionais por ano (sem chave)
export const HOLIDAYS_URL = 'https://brasilapi.com.br/api/feriados/v1';

// Liturgia diária (santo/celebração do dia), sem chave
export const SAINT_URL = 'https://liturgia.up.railway.app/v2/';

// Loterias — API pública sem chave, com fallback (a segunda cobre se a
// primeira estiver fora do ar).
export const LOTTERY_SOURCES = [
  { key: 'megasena', label: 'Mega-Sena', primary: 'https://loteriascaixa-api.herokuapp.com/api/megasena/latest' },
  { key: 'quina', label: 'Quina', primary: 'https://loteriascaixa-api.herokuapp.com/api/quina/latest' },
  { key: 'lotofacil', label: 'Lotofácil', primary: 'https://loteriascaixa-api.herokuapp.com/api/lotofacil/latest' },
];

// 30s de intervalo por ~24h de histórico
export const LISTENER_HISTORY_MAX = 2880;

// Valores usados até a tela de configurações trocar por algo salvo em settings.json
export const DEFAULT_POLL_INTERVALS_MS = {
  listeners: 30 * 1000,
  radioNews: 4 * 60 * 1000,
  externalNews: 5 * 60 * 1000,
  regionalNews: 10 * 60 * 1000,
  weather: 15 * 60 * 1000,
  weatherAlerts: 15 * 60 * 1000,
  currency: 10 * 60 * 1000,
  football: 60 * 60 * 1000,
  holidays: 12 * 60 * 60 * 1000,
  lottery: 60 * 60 * 1000,
  saint: 12 * 60 * 60 * 1000,
};
