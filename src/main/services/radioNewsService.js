import { stationConfig } from '../stations/index.js';

const { apiUrl: NEWS_API_URL, apiKey: NEWS_API_KEY, siteBase: NEWS_SITE_BASE,
  imgBase: NEWS_IMG_BASE, audioBase: NEWS_AUDIO_BASE, windowDays: NEWS_WINDOW_DAYS,
  itemLimit: NEWS_ITEM_LIMIT } = stationConfig.NEWS;

// Mapeamento portado de radiosarandi-app/src/services/noticiasApi.js
const HTML_ENTITIES = {
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã',
  Aacute: 'Á', Atilde: 'Ã', Agrave: 'À',
  eacute: 'é', egrave: 'è', ecirc: 'ê',
  Eacute: 'É', Ecirc: 'Ê', Egrave: 'È',
  iacute: 'í', icirc: 'î',
  Iacute: 'Í',
  oacute: 'ó', ocirc: 'ô', otilde: 'õ', ograve: 'ò',
  Oacute: 'Ó', Otilde: 'Õ',
  uacute: 'ú', ucirc: 'û',
  Uacute: 'Ú',
  ccedil: 'ç', Ccedil: 'Ç',
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'",
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  mdash: '—', ndash: '–', hellip: '…',
};

function decodeHtmlEntities(str) {
  return str.replace(/&(#?\w+);/g, (match, code) => HTML_ENTITIES[code] ?? match);
}

function htmlParaTexto(html) {
  if (!html) return '';
  const bruto = decodeHtmlEntities(
    html
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  );

  const paragrafos = [];
  for (const linhaBruta of bruto.split('\n')) {
    const linha = linhaBruta.trim();
    if (linha === '' && paragrafos[paragrafos.length - 1] === '') continue;
    paragrafos.push(linha);
  }
  return paragrafos.join('\n').trim();
}

function gerarSlug(titulo) {
  return titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function formatData(datahora) {
  if (!datahora) return '';
  const [dataPart] = datahora.split(' ');
  const [ano, mes, dia] = dataPart.split('-');
  return `${dia}/${mes}/${ano}`;
}

function mapNoticia(item) {
  const capa = item.imagens?.find((img) => img.capa === 1) || item.imagens?.[0];

  return {
    id: String(item.id),
    categoria: item.grupo?.nome || 'Geral',
    titulo: item.titulo,
    resumo: htmlParaTexto(item.descricao),
    data: formatData(item.datahora),
    datahora: item.datahora,
    url: `${NEWS_SITE_BASE}/noticia/${item.id}/${gerarSlug(item.titulo)}`,
    img: capa ? `${NEWS_IMG_BASE}${capa.endereco}` : null,
    audio: item.audio ? `${NEWS_AUDIO_BASE}${item.audio}` : null,
  };
}

function toDateParam(date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchRadioNews() {
  const dataFinal = new Date();
  const dataInicial = new Date(dataFinal);
  dataInicial.setDate(dataInicial.getDate() - NEWS_WINDOW_DAYS);

  const response = await fetch(NEWS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data_inicial: toDateParam(dataInicial),
      data_final: toDateParam(dataFinal),
      chave: NEWS_API_KEY,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar notícias (HTTP ${response.status})`);
  }

  const json = await response.json();

  if (!json.sucesso) {
    throw new Error('A API de notícias retornou uma falha.');
  }

  return json.noticias
    .map(mapNoticia)
    .sort((a, b) => (a.datahora < b.datahora ? 1 : -1))
    .slice(0, NEWS_ITEM_LIMIT);
}
