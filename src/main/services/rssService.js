import Parser from 'rss-parser';
import { RSS_ITEM_LIMIT } from '../config.js';
import { FEED_SOURCES } from './feedSources.js';

const parser = new Parser();

function stripPortalSuffix(title, label) {
  const suffix = ` - ${label}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

// G1 e UOL embutem a imagem de capa como <img src="..."> dentro do HTML do
// item (content/description) — feeds do Google Notícias (GZH/CBN) não têm
// imagem nenhuma, então isso fica null pra eles.
function extractImage(item) {
  const html = item.content || item['content:encoded'] || item.description || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function mapItems(items, source) {
  return items.slice(0, RSS_ITEM_LIMIT).map((item, index) => ({
    id: item.guid || item.link || `${source.key}-${index}`,
    title: stripPortalSuffix((item.title || '').trim(), source.label),
    link: item.link || null,
    isoDate: item.isoDate || item.pubDate || null,
    portal: source.key,
    image: extractImage(item),
  }));
}

// Baixa com o fetch do Node (que descomprime gzip sozinho) em vez do http do
// rss-parser: o G1 passou a responder com gzip mesmo sem pedir, e o parser
// falhava com 'Non-whitespace before first tag' — o app caía pro Google
// Notícias, que não traz imagem nenhuma. Feeds em encoding legado (ex.: UOL em
// ISO-8859-1) são decodificados manualmente, senão os acentos saem corrompidos.
async function parseUrl(url, encoding) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlayNews/1.0)' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const decoded = new TextDecoder(encoding || 'utf-8').decode(buffer);
  // O UOL passou a mandar `<rss>` sem `version="2.0"` — o rss-parser rejeita
  // ("Feed not recognized as RSS 1 or 2") e o app caía pro Google Notícias.
  const xml = decoded.replace(/<rss(?![^>]*\bversion=)([^>]*)>/i, '<rss version="2.0"$1>');
  return parser.parseString(xml);
}

async function loadPortalItems(source) {
  try {
    const feed = await parseUrl(source.primaryUrl, source.encoding);
    return mapItems(feed.items || [], source);
  } catch (primaryErr) {
    if (!source.fallbackUrl) throw primaryErr;
    const feed = await parseUrl(source.fallbackUrl, null);
    return mapItems(feed.items || [], source);
  }
}

// ---- Foto de capa buscada na própria matéria -------------------------------
// Só o G1 traz imagem no RSS; UOL quase nunca, e GZH/CBN (via Google Notícias)
// nunca. Sem foto os cartões da TV ficavam vazios — e se o G1 falhasse (o app cai
// pro Google Notícias) a tela inteira ficava sem foto. Então, pras notícias sem
// imagem, abre a página da matéria e lê o <meta og:image>. Links do Google
// Notícias (news.google.com/rss/articles/...) não são a matéria: é preciso pedir
// o endereço real ao próprio Google antes.
const ENRICH_LIMIT = 8; // notícias por portal (as que a TV realmente mostra)
const ENRICH_CONCURRENCY = 4;
const ENRICH_TIMEOUT_MS = 9000;
const ENRICH_RETRY_MS = 15 * 60 * 1000; // falha só é tentada de novo depois disso
const PAGE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const enrichCache = new Map(); // link original -> { link, image, at }

async function resolveGoogleNewsUrl(link) {
  const id = new URL(link).pathname.split('/').pop();
  const page = await (
    await fetch(`https://news.google.com/rss/articles/${id}`, {
      headers: { 'User-Agent': PAGE_UA },
      signal: AbortSignal.timeout(ENRICH_TIMEOUT_MS),
    })
  ).text();
  const signature = page.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = page.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) throw new Error('assinatura do Google Notícias não encontrada');

  const request = [
    'Fbv4je',
    JSON.stringify([
      'garturlreq',
      [['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1], 'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
      id,
      Number(timestamp),
      signature,
    ]),
    null,
    'generic',
  ];
  const response = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
    method: 'POST',
    headers: { 'User-Agent': PAGE_UA, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `f.req=${encodeURIComponent(JSON.stringify([[request]]))}`,
    signal: AbortSignal.timeout(ENRICH_TIMEOUT_MS),
  });
  const body = (await response.text()).split('\n\n')[1];
  const real = JSON.parse(JSON.parse(body)[0][2])[1];
  if (typeof real !== 'string' || !real.startsWith('http')) throw new Error('endereço real não encontrado');
  return real;
}

function extractOgImage(html) {
  for (const tag of html.match(/<meta\s+[^>]*>/gi) || []) {
    if (!/property=["']og:image["']/i.test(tag)) continue;
    const match = tag.match(/content=["']([^"']+)["']/i);
    if (match) return match[1].replace(/&amp;/g, '&');
  }
  return null;
}

async function enrichOne(item) {
  const cached = enrichCache.get(item.link);
  if (cached && (cached.image || Date.now() - cached.at < ENRICH_RETRY_MS)) {
    return cached.image ? { ...item, image: cached.image, link: cached.link } : item;
  }

  let link = item.link;
  let image = null;
  try {
    if (/^https?:\/\/news\.google\.com\//i.test(link)) link = await resolveGoogleNewsUrl(link);
    const response = await fetch(link, {
      headers: { 'User-Agent': PAGE_UA, 'Accept-Language': 'pt-BR,pt;q=0.9' },
      redirect: 'follow',
      signal: AbortSignal.timeout(ENRICH_TIMEOUT_MS),
    });
    if (response.ok) {
      const found = extractOgImage(await response.text());
      image = found ? new URL(found, link).href : null;
    }
  } catch {
    // Site fora do ar, bloqueando ou lento: segue sem foto nessa notícia.
  }
  enrichCache.set(item.link, { link, image, at: Date.now() });
  // Abre a matéria direto no portal (e não na página de redirecionamento do Google).
  return image ? { ...item, image, link } : item;
}

async function enrichImages(items) {
  const targets = items.slice(0, ENRICH_LIMIT).filter((item) => !item.image && item.link);
  if (targets.length === 0) return items;

  const byLink = new Map();
  for (let i = 0; i < targets.length; i += ENRICH_CONCURRENCY) {
    const batch = targets.slice(i, i + ENRICH_CONCURRENCY);
    const done = await Promise.all(batch.map(enrichOne));
    batch.forEach((item, j) => byLink.set(item.link, done[j]));
  }
  return items.map((item) => byLink.get(item.link) || item);
}

export async function fetchPortal(source) {
  return enrichImages(await loadPortalItems(source));
}

export async function fetchAllPortals() {
  const results = await Promise.allSettled(FEED_SOURCES.map((s) => fetchPortal(s)));
  return FEED_SOURCES.map((source, i) => ({
    key: source.key,
    ...(results[i].status === 'fulfilled'
      ? { ok: true, data: results[i].value }
      : { ok: false, error: results[i].reason?.message || String(results[i].reason) }),
  }));
}
