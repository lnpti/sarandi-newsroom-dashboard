import { AGRO_NEWS_SOURCES, YAHOO_FINANCE_HEADERS } from '../config.js';
import { fetchPortal } from './rssService.js';

// Mercado agrícola com foco no Rio Grande do Sul.
//
// Preços de praças gaúchas (soja, milho, trigo, arroz, boi, leite): não existe
// API gratuita pra isso, então lê as tabelas públicas de cotações do Notícias
// Agrícolas (HTML) — cada commodity numa tentativa separada, pra uma tabela
// que mudou de formato derrubar só o seu cartão. Chicago e dólar vêm do Yahoo
// Finance (mesmo endpoint que as cotações usam). Notícias: Canal Rural.

const QUOTES_BASE = 'https://www.noticiasagricolas.com.br/cotacoes';
const PAGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

const NEWS_TOTAL = 8;

// ---- HTML → tabelas ------------------------------------------------------
const cleanText = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// '1.450,60' → 1450.6 · 's/ cotação' / '-' → null
function parseNumber(text) {
  if (text == null) return null;
  const m = String(text).match(/-?\d[\d.]*(?:,\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// '+2,50' → 2.5 · '-0,06' → -0.06 · '-' (sem variação informada) → null
function parsePct(text) {
  const t = String(text ?? '').trim();
  if (!/\d/.test(t)) return null;
  return parseNumber(t.replace('+', ''));
}

async function fetchPage(slug) {
  const response = await fetch(`${QUOTES_BASE}/${slug}`, { headers: PAGE_HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

// Cada bloco `<div class="cotacao">` tem um <h2> (título) e uma tabela.
function parseTables(html) {
  return html
    .split('<div class="cotacao">')
    .slice(1)
    .map((block) => {
      const title = cleanText((block.match(/<h2>([\s\S]*?)<\/h2>/) || [])[1] || '');
      const rows = [...block.matchAll(/<tr>\s*((?:<td[\s\S]*?<\/td>\s*){2,5})<\/tr>/g)].map((m) =>
        [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => cleanText(x[1]))
      );
      const updated = (block.match(/Atualizado em:\s*([\d/]+)/) || [])[1] || null;
      return { title, rows, updated };
    });
}

const findTable = (tables, titleRegex) => tables.find((t) => titleRegex.test(t.title));

// "Nonoai/RS (Coopertradição)" → "Nonoai/RS"
const shortLabel = (label) => label.replace(/\s*\(.*$/, '').trim();

// Linhas "Praça | preço | variação" com preço de verdade (some "s/ cotação").
function priceRows(table, labelRegex, { priceCol = 1, pctCol = 2 } = {}) {
  if (!table) return [];
  return table.rows
    .filter((r) => labelRegex.test(r[0]) && parseNumber(r[priceCol]) != null)
    .map((r) => ({ label: shortLabel(r[0]), value: parseNumber(r[priceCol]), pct: parsePct(r[pctCol]) }));
}

// ---- Yahoo (Chicago e dólar) ---------------------------------------------
async function fetchYahoo(symbol) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
      { headers: YAHOO_FINANCE_HEADERS }
    );
    if (!response.ok) return null;
    const meta = (await response.json())?.chart?.result?.[0]?.meta;
    if (!meta || meta.regularMarketPrice == null) return null;
    const price = Number(meta.regularMarketPrice);
    const prev = Number(meta.chartPreviousClose);
    return { price, pct: prev ? ((price - prev) / prev) * 100 : null };
  } catch {
    return null;
  }
}

// Cotação de Chicago em centavos de dólar por bushel → US$/bushel
const chicago = (quote) => (quote ? { value: quote.price / 100, pct: quote.pct, unit: 'US$/bu' } : null);

// ---- Commodities ---------------------------------------------------------
async function buildSoy(chicagoQuote) {
  const tables = parseTables(await fetchPage('soja'));
  const physical = findTable(tables, /^Soja - Mercado Físico$/);
  const port = priceRows(physical, /Porto Rio Grande \(dispon/i)[0];
  const rs = priceRows(physical, /\/RS/);
  const headline = port
    ? { ...port, label: 'Porto de Rio Grande', unit: 'R$/sc 60 kg' }
    : rs[0] && { ...rs[0], unit: 'R$/sc 60 kg' };
  if (!headline) throw new Error('soja sem cotação do RS');
  return {
    key: 'soja',
    name: 'Soja',
    icon: '🌱',
    headline,
    rows: rs.slice(0, 2).filter((r) => r.label !== headline.label).map((r) => ({ ...r, unit: 'R$/sc' })),
    chicago: chicago(chicagoQuote),
    updated: physical?.updated || null,
  };
}

async function buildCorn(chicagoQuote) {
  const tables = parseTables(await fetchPage('milho'));
  const physical = findTable(tables, /^Milho - Mercado Físico$/);
  const indicator = findTable(tables, /^Indicador do Milho Esalq/)?.rows[0];
  const rs = priceRows(physical, /\/RS/);
  const benchmark =
    indicator && parseNumber(indicator[1]) != null
      ? { label: 'Indicador Esalq/B3', value: parseNumber(indicator[1]), pct: parsePct(indicator[2]), unit: 'R$/sc' }
      : null;
  const headline = rs[0] ? { ...rs[0], unit: 'R$/sc 60 kg' } : benchmark && { ...benchmark, unit: 'R$/sc 60 kg' };
  if (!headline) throw new Error('milho sem cotação');
  return {
    key: 'milho',
    name: 'Milho',
    icon: '🌽',
    headline,
    rows: rs[0] && benchmark ? [benchmark] : [],
    chicago: chicago(chicagoQuote),
    updated: physical?.updated || null,
  };
}

async function buildWheat(chicagoQuote) {
  const tables = parseTables(await fetchPage('trigo'));
  const cepea = findTable(tables, /^Preço Médio do Trigo Cepea/);
  // [Data, Região, R$/t, Variação]
  const row = cepea?.rows.find((r) => /Rio Grande do Sul|\bRS\b/i.test(r[1]));
  const perTon = row ? parseNumber(row[2]) : null;
  if (perTon == null) throw new Error('trigo sem cotação do RS');
  const pct = parsePct(row[3]);
  return {
    key: 'trigo',
    name: 'Trigo',
    icon: '🌾',
    headline: { label: 'Média RS · Cepea/Esalq', value: (perTon * 60) / 1000, pct, unit: 'R$/sc 60 kg', approx: true },
    rows: [{ label: 'Por tonelada', value: perTon, pct: null, unit: 'R$/t' }],
    chicago: chicago(chicagoQuote),
    updated: row[0] || null,
  };
}

async function buildRice() {
  const tables = parseTables(await fetchPage('arroz'));
  const indicator = findTable(tables, /^Indicador Arroz em Casca - Esalq\/Senar-RS/)?.rows[0];
  const value = indicator ? parseNumber(indicator[1]) : null;
  if (value == null) throw new Error('arroz sem indicador do RS');
  const praças = [
    ...priceRows(findTable(tables, /^Arroz - Mercado Físico$/), /\/RS|Rio Grande do Sul/),
    ...priceRows(findTable(tables, /Agulhinha/), /\/RS/),
  ];
  return {
    key: 'arroz',
    name: 'Arroz em casca',
    icon: '🍚',
    headline: { label: 'Indicador Esalq/Senar-RS', value, pct: parsePct(indicator[2]), unit: 'R$/sc 50 kg' },
    rows: praças.slice(0, 2).map((r) => ({ ...r, unit: 'R$/sc' })),
    chicago: null,
    updated: indicator[0] || null,
  };
}

async function buildCattle() {
  const tables = parseTables(await fetchPage('boi-gordo'));
  const scot = findTable(tables, /^Mercado Físico - Scot/);
  // [Município, à vista, a prazo, vaca gorda]
  const west = scot?.rows.find((r) => /^RS Oeste/i.test(r[0]));
  const pelotas = scot?.rows.find((r) => /^RS Pelotas/i.test(r[0]));
  const indicator = findTable(tables, /^Indicador do Boi Gordo Esalq/)?.rows[0];
  const headlineRow = west && parseNumber(west[1]) != null ? west : pelotas;
  if (!headlineRow || parseNumber(headlineRow[1]) == null) throw new Error('boi sem cotação do RS');
  const rows = [];
  if (headlineRow === west && pelotas && parseNumber(pelotas[1]) != null) {
    rows.push({ label: 'RS Pelotas', value: parseNumber(pelotas[1]), pct: null, unit: 'R$/kg' });
  }
  if (indicator && parseNumber(indicator[1]) != null) {
    rows.push({ label: 'Indicador Esalq/B3 (SP)', value: parseNumber(indicator[1]), pct: parsePct(indicator[2]), unit: 'R$/@' });
  }
  return {
    key: 'boi',
    name: 'Boi gordo',
    icon: '🐂',
    headline: {
      label: headlineRow === west ? 'RS Oeste · à vista' : 'RS Pelotas · à vista',
      value: parseNumber(headlineRow[1]),
      pct: null,
      unit: 'R$/kg',
    },
    rows,
    chicago: null,
    updated: scot?.updated || null,
  };
}

async function buildMilk() {
  const tables = parseTables(await fetchPage('leite'));
  const table = findTable(tables, /^Leite - Preços ao Produtor/);
  const find = (uf) => table?.rows.find((r) => r[0] === uf);
  const rs = find('RS');
  if (!rs || parseNumber(rs[1]) == null) throw new Error('leite sem preço do RS');
  const others = ['SC', 'PR']
    .map(find)
    .filter((r) => r && parseNumber(r[1]) != null)
    .map((r) => ({ label: r[0], value: parseNumber(r[1]), pct: parsePct(r[2]), unit: 'R$/L', decimals: 4 }));
  return {
    key: 'leite',
    name: 'Leite ao produtor',
    icon: '🥛',
    headline: { label: 'Rio Grande do Sul', value: parseNumber(rs[1]), pct: parsePct(rs[2]), unit: 'R$/litro', decimals: 4 },
    rows: others,
    chicago: null,
    updated: table?.updated || null,
  };
}

// ---- Notícias ------------------------------------------------------------
const RS_MENTION = /\bRS\b|gaúch|rio grande do sul/i;

async function fetchAgroNews() {
  const results = await Promise.allSettled(AGRO_NEWS_SOURCES.map((s) => fetchPortal(s)));
  const seen = new Set();
  const merged = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      if (!item.image || !item.link || seen.has(item.link)) continue;
      seen.add(item.link);
      merged.push(item);
    }
  }
  // Mais recentes primeiro; as que falam do RS sobem (público da rádio).
  merged.sort((a, b) => new Date(b.isoDate || 0) - new Date(a.isoDate || 0));
  const rs = merged.filter((i) => RS_MENTION.test(i.title));
  const rest = merged.filter((i) => !RS_MENTION.test(i.title));
  return [...rs, ...rest].slice(0, NEWS_TOTAL);
}

// ---- Principal -----------------------------------------------------------
export async function fetchAgro(previous) {
  const [soy, corn, wheat, fx] = await Promise.all([
    fetchYahoo('ZS=F'),
    fetchYahoo('ZC=F'),
    fetchYahoo('ZW=F'),
    fetchYahoo('BRL=X'),
  ]);

  const builders = [
    ['soja', () => buildSoy(soy)],
    ['milho', () => buildCorn(corn)],
    ['trigo', () => buildWheat(wheat)],
    ['arroz', () => buildRice()],
    ['boi', () => buildCattle()],
    ['leite', () => buildMilk()],
  ];
  const [built, news] = await Promise.all([
    Promise.allSettled(builders.map(([, build]) => build())),
    fetchAgroNews().catch(() => []),
  ]);

  // Cartão que falhou agora mantém o último valor bom, em vez de sumir da tela.
  const items = built
    .map((r, i) =>
      r.status === 'fulfilled' ? r.value : previous?.items?.find((it) => it.key === builders[i][0]) ?? null
    )
    .filter(Boolean);
  if (items.length === 0) throw new Error('nenhuma cotação agrícola disponível');

  return {
    fx: fx ? { price: fx.price, pct: fx.pct } : previous?.fx ?? null,
    items,
    news: news.length > 0 ? news : previous?.news ?? [],
    quotesDate: items.map((i) => i.updated).find((d) => /\d{2}\/\d{2}\/\d{4}/.test(d || '')) || null,
  };
}
