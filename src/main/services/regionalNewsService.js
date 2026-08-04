import Parser from 'rss-parser';
import { DEFAULT_REGIONAL_RSS_URLS, REGIONAL_ITEM_LIMIT, REGIONAL_NEWS_WINDOW_DAYS } from '../config.js';

const parser = new Parser();

// O Google Alertas embrulha o link real num redirect (google.com/url?...&url=REAL)
function unwrapGoogleRedirect(href) {
  if (!href) return null;
  try {
    const real = new URL(href).searchParams.get('url');
    return real || href;
  } catch {
    return href;
  }
}

// Entidades HTML que sobram no título por causa de um double-encoding do
// próprio feed do Google Alertas (ex.: "HOJE&gt; RGE" em vez de "HOJE> RGE").
const TITLE_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };
function decodeTitleEntities(str) {
  return str.replace(/&(#?\w+);/g, (match, code) => TITLE_ENTITIES[code] ?? match);
}

// O Google Alertas envolve os termos que bateram com a busca em <b> dentro
// do título (ex.: "... em <b>Carazinho</b>, RS") — remove antes de exibir.
function cleanTitle(rawTitle) {
  return decodeTitleEntities((rawTitle || '').replace(/<[^>]+>/g, ''));
}

// Títulos às vezes vêm como "Manchete - Fonte" (nem sempre — muitos títulos
// não têm fonte nenhuma no feed do Alertas).
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

// Boa parte dessas fontes não vem com nome legível no título (source null) —
// checa também o domínio do link pra garantir que nada delas escape do bloqueio.
function isBlockedLink(link) {
  if (!link) return false;
  try {
    const host = new URL(link).hostname.toLowerCase();
    return /(^|\.)radiosarandi\.com\.br$/.test(host) || /(^|\.)radiominuano\.com\.br$/.test(host);
  } catch {
    return false;
  }
}

export async function fetchRegionalNews(urls) {
  const feedUrls = Array.isArray(urls) && urls.length > 0 ? urls : DEFAULT_REGIONAL_RSS_URLS;
  const cutoff = Date.now() - REGIONAL_NEWS_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const results = await Promise.allSettled(feedUrls.map((url) => parser.parseURL(url)));

  // Se todos os feeds falharem (ex.: link do Alertas inválido), propaga erro
  // pro poller marcar status:'error' em vez de silenciosamente esvaziar a lista.
  if (results.every((r) => r.status === 'rejected')) {
    throw new Error(results[0].reason?.message || 'Falha ao buscar notícias regionais');
  }

  const seen = new Set();
  const items = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;

    for (const item of result.value.items || []) {
      const { title, source } = splitSource(cleanTitle(item.title));
      if (!title || seen.has(title) || isBlockedSource(source)) continue;

      const link = unwrapGoogleRedirect(item.link);
      if (isBlockedLink(link)) continue;

      const isoDate = item.isoDate || item.pubDate || null;
      // O alerta não filtra por data — descarta o que estiver fora da janela recente.
      if (!isoDate || new Date(isoDate).getTime() < cutoff) continue;

      seen.add(title);
      items.push({ id: item.id || item.guid || link || title, title, source, link, isoDate });
    }
  }

  items.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate));

  return items.slice(0, REGIONAL_ITEM_LIMIT);
}
