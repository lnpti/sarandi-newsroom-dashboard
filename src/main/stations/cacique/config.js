export const STATION_SLUG = 'cacique';
export const RADIO_NAME = 'Tua Rádio Cacique';

// Servidor Icecast da plataforma Sintonizar — JSON público de status.
// icestats.source presente = online (source.listeners = ouvintes atuais).
export const STREAM_STATUS = {
  type: 'icecast',
  url: 'https://painel.sintonizar.tv.br:10092/status-json.xsl',
};

// Site próprio (tuaradio.com.br) não tem API nem RSS e está atrás de
// Cloudflare — usa o Firecrawl pra raspar a página de notícias.
export const NEWS = {
  type: 'firecrawl',
  listingUrl: 'https://www.tuaradio.com.br/Tua-Radio-Cacique/noticias',
};

// Lagoa Vermelha - RS (cidade da rádio)
export const WEATHER_LAT = -28.209221;
export const WEATHER_LON = -51.525609;
export const WEATHER_ALERT_CITY_MATCH = 'Lagoa Vermelha - RS';

export const FOOTBALL_TEAMS = [
  { key: 'gremio', name: 'Grêmio', espnId: '6273' },
  { key: 'inter', name: 'Internacional', espnId: '1936' },
];

// Sem feed do Google Alertas cadastrado ainda — configurável pela tela de
// Configurações depois que alguém criar o alerta pra região de Lagoa Vermelha.
export const DEFAULT_REGIONAL_RSS_URLS = [];

// Azul extraído de tuaradio.com.br — placeholder até termos a logo oficial.
export const ACCENT = '#003B99';
