import { B3_STOCK_LIST_URL, CURRENCY_URL, YAHOO_FINANCE_HEADERS, YAHOO_FINANCE_SYMBOLS } from '../config.js';

// AwesomeAPI retorna { USDBRL: {...}, EURBRL: {...}, BTCBRL: {...} } com bid
// (compra) e pctChange (variação % no dia) como strings.
function mapCurrency(raw) {
  if (!raw) return null;
  return {
    bid: Number(raw.bid),
    pctChange: Number(raw.pctChange),
  };
}

async function fetchJson(url, headers) {
  const response = await fetch(url, headers ? { headers } : undefined);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Yahoo Finance devolve o preço/variação atual dentro de "meta" — sem sell,
// só o preço de mercado mesmo (points), formato diferente da AwesomeAPI.
async function fetchYahooIndex(symbol) {
  const json = await fetchJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
    YAHOO_FINANCE_HEADERS
  );
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) return null;
  return {
    points: Number(meta.regularMarketPrice),
    pctChange: Number(meta.regularMarketChangePercent ?? 0),
  };
}

// Maiores altas/baixas do dia na B3 — a lista da brapi vem cheia de BDRs e
// ações com pouquíssima liquidez (às vezes só 1 ou 2 negócios no dia), cuja
// variação % é ruído, não uma "alta/baixa" de verdade. Filtra por volume
// mínimo pra sobrar só ações realmente negociadas (nomes reconhecíveis tipo
// PETR4/VALE3), como um telejornal mostraria.
const B3_MOVERS_FETCH_LIMIT = 200;
const B3_MOVERS_MIN_VOLUME = 1_000_000;
const B3_MOVERS_TOP_N = 10;

// A brapi só devolve a razão social ("GRUPO CASAS BAHIA S.A."), não o nome
// fantasia que o público reconhece ("Casas Bahia") — não existe fonte
// gratuita e em lote pra isso (Yahoo bloqueou o endpoint em lote e o nome
// curto individual vem cheio de sufixo técnico tipo "PETROBRAS PN EDJ N2").
// Tabela própria pros papéis mais líquidos da B3 (a maioria dos que aparecem
// como maiores altas/baixas, já filtrados por volume); o que não estiver
// aqui cai pra razão social mesmo.
const B3_FANTASY_NAMES = {
  PETR: 'Petrobras', VALE: 'Vale', ITUB: 'Itaú Unibanco', BBDC: 'Bradesco',
  ABEV: 'Ambev', BBAS: 'Banco do Brasil', MGLU: 'Magazine Luiza', WEGE: 'WEG',
  RENT: 'Localiza', SUZB: 'Suzano', GGBR: 'Gerdau', CSNA: 'CSN', USIM: 'Usiminas',
  JBSS: 'JBS', BEEF: 'Minerva', MRFG: 'Marfrig', CPLE: 'Copel', SBSP: 'Sabesp',
  ELET: 'Eletrobras', EQTL: 'Equatorial', ENGI: 'Energisa', TAEE: 'Taesa',
  CMIG: 'Cemig', B3SA: 'B3', BPAC: 'BTG Pactual', SANB: 'Santander Brasil',
  ITSA: 'Itaúsa', HAPV: 'Hapvida', RDOR: "Rede D'Or", RADL: 'Raia Drogasil',
  PCAR: 'Pão de Açúcar', LREN: 'Lojas Renner', CEAB: 'C&A', BHIA: 'Casas Bahia',
  AMER: 'Americanas', COGN: 'Cogna', YDUQ: 'Yduqs', CVCB: 'CVC', AZUL: 'Azul',
  GOLL: 'Gol', EMBR: 'Embraer', CCRO: 'CCR', ECOR: 'EcoRodovias', RAIL: 'Rumo',
  AZEV: 'Azevedo & Travassos', SOJA: 'Boa Safra Sementes', EZTC: 'EZTec',
  CYRE: 'Cyrela', MRVE: 'MRV', DIRR: 'Direcional', FLRY: 'Fleury',
  ONCO: 'Oncoclínicas', QUAL: 'Qualicorp', HYPE: 'Hypera', RAIZ: 'Raízen',
  SMTO: 'São Martinho', CSAN: 'Cosan', UGPA: 'Ultrapar', KLBN: 'Klabin',
  SLCE: 'SLC Agrícola', ALPA: 'Alpargatas', LWSA: 'Locaweb', TOTS: 'Totvs',
  POSI: 'Positivo', INTB: 'Intelbras', NTCO: 'Natura&Co', PRIO: 'PetroRio',
  CSMG: 'Copasa', TIMS: 'TIM', VIVT: 'Vivo', FESA: 'Ferbasa', CASH: 'Méliuz',
  VSTE: 'Veste',
};

// Tickers da B3 são a sigla da empresa + 1 ou 2 dígitos (classe da ação,
// ex.: PETR3/PETR4) — tira os dígitos pra achar a empresa na tabela.
function fantasyName(ticker, fallbackName) {
  const base = (ticker || '').replace(/\d+$/, '');
  return B3_FANTASY_NAMES[base] || fallbackName;
}

function mapStock(s) {
  return {
    symbol: s.stock,
    name: fantasyName(s.stock, s.name),
    change: Number(s.change),
  };
}

async function fetchB3Movers(sortOrder) {
  const url = `${B3_STOCK_LIST_URL}?sortBy=change&sortOrder=${sortOrder}&limit=${B3_MOVERS_FETCH_LIMIT}&type=stock`;
  const json = await fetchJson(url);
  return (json.stocks || [])
    .filter((s) => s.volume && s.volume > B3_MOVERS_MIN_VOLUME && s.change != null)
    .slice(0, B3_MOVERS_TOP_N)
    .map(mapStock);
}

// Cada fonte pode falhar isoladamente (rede, limite de uso) sem derrubar o
// resto — `previous` é o último dado bom já mostrado, usado como respaldo em
// vez de a cotação sumir da tela por causa de uma falha passageira.
export async function fetchCurrency(previous) {
  const [currencyRes, ibovespaRes, dowjonesRes, nasdaqRes, gainersRes, losersRes] = await Promise.allSettled([
    fetchJson(CURRENCY_URL),
    fetchYahooIndex(YAHOO_FINANCE_SYMBOLS.ibovespa),
    fetchYahooIndex(YAHOO_FINANCE_SYMBOLS.dowjones),
    fetchYahooIndex(YAHOO_FINANCE_SYMBOLS.nasdaq),
    fetchB3Movers('desc'),
    fetchB3Movers('asc'),
  ]);

  if ([currencyRes, ibovespaRes, dowjonesRes, nasdaqRes].every((r) => r.status === 'rejected')) {
    throw new Error(currencyRes.reason?.message || 'Falha ao buscar cotações');
  }

  const currency = currencyRes.status === 'fulfilled' ? currencyRes.value : null;
  const resultOf = (r) => (r.status === 'fulfilled' ? r.value : null);

  return {
    usd: mapCurrency(currency?.USDBRL) || previous?.usd || null,
    eur: mapCurrency(currency?.EURBRL) || previous?.eur || null,
    btc: mapCurrency(currency?.BTCBRL) || previous?.btc || null,
    ibovespa: resultOf(ibovespaRes) || previous?.ibovespa || null,
    dowjones: resultOf(dowjonesRes) || previous?.dowjones || null,
    nasdaq: resultOf(nasdaqRes) || previous?.nasdaq || null,
    gainers: resultOf(gainersRes) || previous?.gainers || [],
    losers: resultOf(losersRes) || previous?.losers || [],
  };
}
