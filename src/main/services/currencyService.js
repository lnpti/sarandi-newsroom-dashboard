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

// A HG Brasil (bitcoin/bolsas) usa uma chave de demonstração compartilhada e
// falha às vezes por limite de uso — sem isso, uma falha transitória zerava
// bitcoin/bolsas na tela até a próxima consulta funcionar. `previous` é o
// último dado bom já mostrado; usado como respaldo em vez de sumir.
export async function fetchCurrency(previous) {
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
    usd: mapCurrency(awesome?.USDBRL) || mapHgCurrency(market?.currencies?.USD) || previous?.usd || null,
    eur: mapCurrency(awesome?.EURBRL) || mapHgCurrency(market?.currencies?.EUR) || previous?.eur || null,
    btc: mapHgCurrency(market?.currencies?.BTC) || previous?.btc || null,
    ibovespa: mapIndex(market?.stocks?.IBOVESPA) || previous?.ibovespa || null,
    dowjones: mapIndex(market?.stocks?.DOWJONES) || previous?.dowjones || null,
    nasdaq: mapIndex(market?.stocks?.NASDAQ) || previous?.nasdaq || null,
  };
}
