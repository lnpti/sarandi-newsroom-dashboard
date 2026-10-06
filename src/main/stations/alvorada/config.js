export const STATION_SLUG = 'alvorada';
export const RADIO_NAME = 'Tua Rádio Alvorada';

// Canais de atualização automática — GitHub Releases primeiro; se o GitHub
// estiver inacessível (rede que bloqueia), cai pro espelho no Cloudflare R2
// (publicado por scripts/publish-cloudflare.mjs). Mesmos valores do
// electron-builder.config.js.
export const UPDATE_FEEDS = {
  github: { owner: 'lnpti', repo: 'tua-radio-alvorada-dashboard' },
  r2: 'https://pub-8060abbe70084968817647c74ce4ffbc.r2.dev/playnews-alvorada',
};

// Servidor Icecast da plataforma Sintonizar (mesma da Tua Rádio Cacique, porta
// própria) — JSON público de status. icestats.source presente = online
// (source.listeners = ouvintes atuais).
export const STREAM_STATUS = {
  type: 'icecast',
  url: 'https://painel.sintonizar.tv.br:10102/status-json.xsl',
};

// Site da rede (tuaradio.com.br) não tem API nem RSS e está atrás de
// Cloudflare — usa o Firecrawl pra raspar a página de notícias da Alvorada.
export const NEWS = {
  type: 'firecrawl',
  listingUrl: 'https://www.tuaradio.com.br/Tua-Radio-Alvorada/noticias',
};

// Marau - RS (cidade da rádio)
export const CITY_LABEL = 'Marau';
export const WEATHER_LAT = -28.44917;
export const WEATHER_LON = -52.2;
export const WEATHER_ALERT_CITY_MATCH = 'Marau - RS';

// Cidades da região (Produção e Planalto) — mostradas como temperaturas extras
// no slide de clima do Modo TV. Configurável em Configurações → Clima.
export const DEFAULT_WEATHER_EXTRA_CITIES = [
  { label: 'Passo Fundo', lat: -28.26278, lon: -52.40667 },
  { label: 'Carazinho', lat: -28.28389, lon: -52.78639 },
  { label: 'Soledade', lat: -28.81833, lon: -52.51028 },
  { label: 'Nova Prata', lat: -28.78389, lon: -51.61 },
  { label: 'Casca', lat: -28.56111, lon: -51.97833 },
  { label: 'Vila Maria', lat: -28.53472, lon: -52.15361 },
];

export const FOOTBALL_TEAMS = [
  { key: 'gremio', name: 'Grêmio', espnId: '6273' },
  { key: 'inter', name: 'Internacional', espnId: '1936' },
];

// Sem feed do Google Alertas cadastrado ainda — configurável pela tela de
// Configurações depois que alguém criar o alerta pra região de Marau.
export const DEFAULT_REGIONAL_RSS_URLS = [];

// Nenhum portal excluído por padrão (a lista é editável em Configurações).
export const DEFAULT_REGIONAL_BLOCKED_DOMAINS = [];

// Sem canal do YouTube cadastrado — a tela de vídeos só entra no rodízio de
// quem cadastra um em Configurações.
export const DEFAULT_YOUTUBE_URL = '';

// Azul da marca Tua Rádio (extraído de tuaradio.com.br).
export const ACCENT = '#003B99';
