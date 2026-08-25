export const RSS_ITEM_LIMIT = 10;

// API pública do INMET com avisos meteorológicos ativos (sem chave)
export const INMET_ALERTS_URL = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';

// AwesomeAPI — cotações de moedas, gratuita e sem chave
export const CURRENCY_URL = 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL';

// HG Brasil Finance — bitcoin e principais índices de bolsa (Ibovespa, Dow
// Jones, Nasdaq), sem chave (modo demo, dado levemente atrasado)
export const MARKET_URL = 'https://api.hgbrasil.com/finance?format=json-cors';

// API pública da ESPN (sem chave). fixture=true traz só jogos futuros.
// Slug "all" cobre TODAS as competições (Brasileirão, Copa do Brasil,
// Libertadores/Sul-Americana) — bra.1 sozinho escondia jogos de outras
// competições e bagunçava a ordem dos próximos jogos.
export const ESPN_SCHEDULE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams';

export const REGIONAL_ITEM_LIMIT = 12;
export const REGIONAL_NEWS_WINDOW_DAYS = 30;

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
  calendar: 15 * 60 * 1000,
  youtube: 30 * 60 * 1000,
};
