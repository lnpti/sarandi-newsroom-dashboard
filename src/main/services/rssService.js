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

async function parseUrl(url, encoding) {
  if (!encoding) {
    return parser.parseURL(url);
  }
  // Feeds em encoding legado (ex.: UOL em ISO-8859-1) precisam ser decodificados
  // manualmente antes de virar string, senão acentos saem corrompidos.
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const xml = new TextDecoder(encoding).decode(buffer);
  return parser.parseString(xml);
}

export async function fetchPortal(source) {
  try {
    const feed = await parseUrl(source.primaryUrl, source.encoding);
    return mapItems(feed.items || [], source);
  } catch (primaryErr) {
    if (!source.fallbackUrl) throw primaryErr;
    const feed = await parseUrl(source.fallbackUrl, null);
    return mapItems(feed.items || [], source);
  }
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
