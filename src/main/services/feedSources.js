// URLs verificadas manualmente (curl) em 2026-07-29.
// G1 e UOL têm feed RSS nativo público; GZH e CBN não expõem RSS próprio
// utilizável hoje, então usamos o Google Notícias filtrado por site como fonte
// primária para esses dois (`site:` precisa ser o domínio que hospeda o
// conteúdo de fato — para GZH isso é gauchazh.clicrbs.com.br, não gauchazh.com.br,
// que só retorna páginas de login/newsletter).
export const FEED_SOURCES = [
  {
    key: 'g1',
    label: 'G1',
    color: '#c4170c',
    primaryUrl: 'https://g1.globo.com/rss/g1/',
    fallbackUrl: 'https://news.google.com/rss/search?q=site:g1.globo.com&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  },
  {
    key: 'gzh',
    label: 'GZH',
    color: '#0057b8',
    primaryUrl: 'https://news.google.com/rss/search?q=site:gauchazh.clicrbs.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    fallbackUrl: null,
  },
  {
    key: 'uol',
    label: 'UOL',
    color: '#f4b400',
    primaryUrl: 'https://rss.uol.com.br/feed/noticias.xml',
    fallbackUrl: 'https://news.google.com/rss/search?q=site:uol.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    encoding: 'iso-8859-1',
  },
  {
    key: 'cbn',
    label: 'CBN',
    color: '#00954e',
    primaryUrl: 'https://news.google.com/rss/search?q=site:cbn.globo.com&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    fallbackUrl: null,
  },
];
