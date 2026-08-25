import Parser from 'rss-parser';

const parser = new Parser({ customFields: { item: [['yt:videoId', 'videoId']] } });

const VIDEO_LIMIT = 8;
const CHANNEL_ID_RE = /\/channel\/(UC[\w-]{22})/;
const CANONICAL_RE = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/;

// O feed RSS do YouTube só aceita channel ID (UC...), mas a maioria dos links
// que alguém cola nas Configurações é uma URL de handle/nome customizado
// (ex.: youtube.com/tuaradiocacique) — resolve raspando o <link rel="canonical">
// da própria página do canal, que sempre aponta pro /channel/UC... real.
// Cacheado em memória: só precisa resolver uma vez por sessão do app.
const channelIdCache = new Map();

async function resolveChannelId(url) {
  const direct = url.match(CHANNEL_ID_RE);
  if (direct) return direct[1];

  if (channelIdCache.has(url)) return channelIdCache.get(url);

  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(CANONICAL_RE);
  if (!match) throw new Error('Canal do YouTube não encontrado nessa URL');

  channelIdCache.set(url, match[1]);
  return match[1];
}

export async function fetchYoutubeVideos(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return [];

  const channelId = await resolveChannelId(trimmed);
  const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);

  return (feed.items || []).slice(0, VIDEO_LIMIT).map((item) => ({
    id: item.videoId || item.id,
    title: item.title,
    link: item.link,
    publishedAt: item.isoDate || item.pubDate || null,
    // Convenção de URL de thumbnail do YouTube — dispensa mais uma requisição.
    thumbnail: item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : null,
  }));
}
