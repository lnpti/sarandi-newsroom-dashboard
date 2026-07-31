import { CURRENCY_URL } from '../config.js';

// AwesomeAPI retorna { USDBRL: {...}, EURBRL: {...} } com bid (compra) e
// pctChange (variação % no dia) como strings.
function mapCurrency(raw) {
  if (!raw) return null;
  return {
    bid: Number(raw.bid),
    pctChange: Number(raw.pctChange),
  };
}

export async function fetchCurrency() {
  const response = await fetch(CURRENCY_URL);
  if (!response.ok) {
    throw new Error(`Falha ao buscar cotações (HTTP ${response.status})`);
  }
  const json = await response.json();
  return {
    usd: mapCurrency(json.USDBRL),
    eur: mapCurrency(json.EURBRL),
  };
}
