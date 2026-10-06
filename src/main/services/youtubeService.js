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

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9',
};

function mapVideo(id, title, publishedAt, publishedLabel) {
  return {
    id,
    title,
    link: `https://www.youtube.com/watch?v=${id}`,
    publishedAt: publishedAt || null,
    // Quando só se sabe "há 2 meses" (a página do canal não traz a data exata),
    // a tela mostra esse texto em vez de uma data inventada.
    publishedLabel: publishedLabel || '',
    // Convenção de URL de thumbnail do YouTube — dispensa mais uma requisição.
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

async function fetchFromRss(channelId) {
  const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  return (feed.items || [])
    .slice(0, VIDEO_LIMIT)
    .map((item) => mapVideo(item.videoId || item.id, item.title, item.isoDate || item.pubDate, ''));
}

// "há 3 horas" / "Transmitido há 2 dias" → data aproximada (só até dias, onde o
// erro é pequeno); semanas/meses/anos ficam só como texto.
// A página escreve por extenso ("há 3 horas") ou abreviado ("há 6 h", "há 2 d",
// "há 3 sem.") conforme o layout do canal.
const RELATIVE_RE = /h[aá]\s+(\d+)\s*(seg|min|horas?|h|dias?|d|sem|m[eê]s|meses|anos?)\b/i;

function relativeUnitMs(unit) {
  const u = unit.toLowerCase();
  if (u.startsWith('seg')) return 1e3;
  if (u.startsWith('min')) return 6e4;
  if (u.startsWith('h')) return 36e5;
  if (u.startsWith('d')) return 864e5;
  return null; // semanas, meses e anos: só como texto
}

function parseRelative(text) {
  const raw = text || '';
  const m = raw.match(RELATIVE_RE);
  const label = raw.replace(/^transmitido( ao vivo)?\s+/i, '').replace(/^h/, 'H');
  if (!m) return { publishedAt: null, label };
  const ms = relativeUnitMs(m[2]);
  return ms
    ? { publishedAt: new Date(Date.now() - Number(m[1]) * ms).toISOString(), label }
    : { publishedAt: null, label };
}

// Dois formatos de lista na página do canal: o antigo (videoRenderer) e o novo
// (lockupViewModel, com o texto de data entre as "metadata parts"). Os dois
// viram { id, title, whenText, live, upcoming }.
function collectVideos(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectVideos(item, out);
    return;
  }
  const old = node.videoRenderer;
  if (old?.videoId) {
    out.push({
      id: old.videoId,
      title: (old.title?.runs || []).map((x) => x.text).join('') || old.title?.simpleText || '',
      whenText: old.publishedTimeText?.simpleText || '',
      live: (old.viewCountText?.runs || []).some((x) => /assistindo/i.test(x.text)),
      upcoming: !!old.upcomingEventData,
    });
  }
  const lockup = node.lockupViewModel;
  if (lockup?.contentId && lockup.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
    const meta = lockup.metadata?.lockupMetadataViewModel;
    const parts = (meta?.metadata?.contentMetadataViewModel?.metadataRows || [])
      .flatMap((row) => row.metadataParts || [])
      .map((p) => p.text?.content || '');
    out.push({
      id: lockup.contentId,
      title: meta?.title?.content || '',
      whenText: parts.find((t) => RELATIVE_RE.test(t)) || '',
      live: parts.some((t) => /assistindo/i.test(t)),
      upcoming: parts.some((t) => /^(estreia|agendad)/i.test(t)),
    });
  }
  for (const value of Object.values(node)) collectVideos(value, out);
}

// O feed RSS do YouTube passou a responder 404 (para qualquer canal) — a página
// "Vídeos" do canal traz a mesma lista no JSON embutido (ytInitialData), mais
// recentes primeiro.
const INITIAL_DATA_RE = /ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/;

async function fetchFromChannelPage(channelId) {
  const response = await fetch(`https://www.youtube.com/channel/${channelId}/videos`, { headers: BROWSER_HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(INITIAL_DATA_RE);
  if (!match) throw new Error('Lista de vídeos do canal não encontrada');

  const found = [];
  collectVideos(JSON.parse(match[1]), found);

  const seen = new Set();
  const videos = [];
  for (const v of found) {
    // Estreia agendada ainda não é vídeo: não pode virar "último vídeo".
    if (seen.has(v.id) || v.upcoming) continue;
    seen.add(v.id);
    const when = parseRelative(v.whenText);
    videos.push(mapVideo(v.id, v.title, when.publishedAt, v.live ? 'Ao vivo agora' : when.label));
    if (videos.length >= VIDEO_LIMIT) break;
  }
  return videos;
}

export async function fetchYoutubeVideos(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) return [];

  const channelId = await resolveChannelId(trimmed);
  try {
    const fromRss = await fetchFromRss(channelId);
    if (fromRss.length > 0) return fromRss;
  } catch {
    // cai pra página do canal
  }
  return fetchFromChannelPage(channelId);
}
