import { stationConfig } from '../../stations/index.js';

const FIRECRAWL_URL = 'https://api.firecrawl.dev/v1/scrape';
const ITEM_LIMIT = 15;

// Casa cada link de notícia no markdown retornado pelo Firecrawl. A URL do
// site já embute categoria e data (.../noticias/{categoria}/DD-MM-YYYY/{slug}),
// que é uma fonte bem mais confiável que o texto solto ao redor do link.
const LINK_RE =
  /\[([^\]]+)\]\((https:\/\/www\.tuaradio\.com\.br\/[^/]+\/noticias\/([a-z0-9-]+)\/(\d{2})-(\d{2})-(\d{4})\/([a-z0-9-]+))\)/g;

// Mesmo padrão de URL, mas casando o href no HTML (não no markdown) — usado
// só pra achar a imagem de cada notícia (ver extractImages).
const HREF_RE =
  /href="(https:\/\/www\.tuaradio\.com\.br\/[^"]+\/noticias\/[a-z0-9-]+\/\d{2}-\d{2}-\d{4}\/[a-z0-9-]+)"/g;

// As miniaturas do site são carregadas via lazy-load (div com data-src, não
// <img src>), então não aparecem na conversão pra markdown — só no HTML.
// Cada notícia tem sua imagem logo depois do próprio link, antes do próximo
// link de notícia; por isso a busca é limitada à janela entre um href e o
// próximo (ou 1500 chars), pra não pegar a imagem errada.
function extractImages(html) {
  const hrefMatches = [...html.matchAll(HREF_RE)];
  const imgByUrl = new Map();

  for (let i = 0; i < hrefMatches.length; i++) {
    const url = hrefMatches[i][1];
    if (imgByUrl.has(url)) continue;

    const start = hrefMatches[i].index + hrefMatches[i][0].length;
    const end = hrefMatches[i + 1] ? hrefMatches[i + 1].index : html.length;
    const segment = html.slice(start, Math.min(end, start + 1500));

    const imgMatch = segment.match(/data-src="([^"]+)"/);
    imgByUrl.set(url, imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : null);
  }

  return imgByUrl;
}

function decodeMarkdownEscapes(str) {
  return str.replace(/\\([\\*_[\]()#+.!-])/g, '$1');
}

// O texto do link mistura categoria em negrito, título em negrito, e às vezes
// data/resumo em texto solto (ex.: "**Geral**  **Título da notícia** 24/08 |
// 00:00H\\\n\\\nResumo..."). Categoria é o 1º bloco em negrito, título o 2º —
// o resto (se sobrar) é tratado como resumo.
function parseLinkText(raw) {
  const bolds = [...raw.matchAll(/\*\*(.+?)\*\*/g)].map((m) => decodeMarkdownEscapes(m[1]).trim());
  const categoria = bolds[0] || 'Geral';
  const titulo = bolds[1] || bolds[0] || '';

  const afterTitle = raw.slice(raw.indexOf(bolds[1] ? `**${bolds[1]}**` : '') + `**${titulo}**`.length);
  const resumo = decodeMarkdownEscapes(
    afterTitle
      .replace(/\\+/g, ' ')
      .replace(/^\s*[-–]?\s*\d{2}\/\d{2}(\s*\|\s*\d{2}:\d{2}h?)?\s*/i, '')
      .replace(/ouvir not[íi]cia/i, '')
      .trim()
  );

  return { categoria, titulo, resumo };
}

export async function fetchRadioNews() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY não configurada.');
  }

  const response = await fetch(FIRECRAWL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: stationConfig.NEWS.listingUrl,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar notícias via Firecrawl (HTTP ${response.status})`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error('Firecrawl retornou uma falha ao raspar a página de notícias.');
  }

  const markdown = json.data?.markdown || '';
  const imgByUrl = extractImages(json.data?.html || '');
  const seen = new Set();
  const items = [];

  for (const match of markdown.matchAll(LINK_RE)) {
    const [, linkText, url, , dd, mm, yyyy] = match;
    if (seen.has(url)) continue;
    seen.add(url);

    const { categoria, titulo, resumo } = parseLinkText(linkText);
    if (!titulo) continue;

    items.push({
      id: url,
      categoria,
      titulo,
      resumo,
      data: `${dd}/${mm}/${yyyy}`,
      datahora: `${yyyy}-${mm}-${dd} 00:00`,
      url,
      img: imgByUrl.get(url) || null,
      audio: null,
    });
  }

  return items
    .sort((a, b) => (a.datahora < b.datahora ? 1 : -1))
    .slice(0, ITEM_LIMIT);
}
