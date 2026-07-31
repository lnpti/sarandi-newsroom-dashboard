import Parser from 'rss-parser';
import { REGIONAL_NEWS_URL, REGIONAL_ITEM_LIMIT } from '../config.js';

const parser = new Parser();

// Títulos do Google Notícias vêm como "Manchete - Fonte". Separa os dois.
function splitSource(rawTitle) {
  const title = (rawTitle || '').trim();
  const idx = title.lastIndexOf(' - ');
  if (idx > 0) {
    return { title: title.slice(0, idx).trim(), source: title.slice(idx + 3).trim() };
  }
  return { title, source: null };
}

// Fontes que não devem aparecer no feed regional:
// - Rádio Sarandi (já tem coluna dedicada),
// - Rádio Minuano (a pedido).
function isBlockedSource(source) {
  const s = source || '';
  return /r[aá]dio\s+sarandi/i.test(s) || /minuano/i.test(s);
}

export async function fetchRegionalNews() {
  const feed = await parser.parseURL(REGIONAL_NEWS_URL);
  const seen = new Set();
  const items = [];

  for (const item of feed.items || []) {
    const { title, source } = splitSource(item.title);
    if (!title || seen.has(title) || isBlockedSource(source)) continue;
    seen.add(title);
    items.push({
      id: item.guid || item.link || title,
      title,
      source,
      link: item.link || null,
      isoDate: item.isoDate || item.pubDate || null,
    });
    if (items.length >= REGIONAL_ITEM_LIMIT) break;
  }

  return items;
}
