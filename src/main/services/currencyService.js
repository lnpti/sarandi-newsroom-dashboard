import { CURRENCY_URL, MARKET_URL } from '../config.js';

// AwesomeAPI retorna { USDBRL: {...}, EURBRL: {...} } com bid (compra) e
// pctChange (variação % no dia) como strings.
function mapCurrency(raw) {
  if (!raw) return null;
  return {
    bid: Number(raw.bid),
    pctChange: Number(raw.pctChange),
  };
}

// HG Brasil retorna moedas como { buy, variation } — mesmo formato usado
// como fallback do dólar/euro e fonte única do bitcoin.
function mapHgCurrency(raw) {
  if (!raw || raw.buy == null) return null;
  return {
    bid: Number(raw.buy),
    pctChange: Number(raw.variation),
  };
}

// Índices de bolsa vêm em pontos, não em R$ — shape separado do de moeda.
function mapIndex(raw) {
  if (!raw || raw.points == null) return null;
  return {
    points: Number(raw.points),
    pctChange: Number(raw.variation),
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchCurrency() {
  const [awesomeRes, marketRes] = await Promise.allSettled([
    fetchJson(CURRENCY_URL),
    fetchJson(MARKET_URL),
  ]);

  if (awesomeRes.status === 'rejected' && marketRes.status === 'rejected') {
    throw new Error(awesomeRes.reason?.message || 'Falha ao buscar cotações');
  }

  const awesome = awesomeRes.status === 'fulfilled' ? awesomeRes.value : null;
  const market = marketRes.status === 'fulfilled' ? marketRes.value?.results : null;

  return {
    usd: mapCurrency(awesome?.USDBRL) || mapHgCurrency(market?.currencies?.USD),
    eur: mapCurrency(awesome?.EURBRL) || mapHgCurrency(market?.currencies?.EUR),
    btc: mapHgCurrency(market?.currencies?.BTC),
    ibovespa: mapIndex(market?.stocks?.IBOVESPA),
    dowjones: mapIndex(market?.stocks?.DOWJONES),
    nasdaq: mapIndex(market?.stocks?.NASDAQ),
  };
}
