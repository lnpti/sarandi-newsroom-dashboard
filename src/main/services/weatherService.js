import { stationConfig } from '../stations/index.js';

function mapDaily(daily) {
  if (!daily?.time) return [];
  return daily.time.map((date, i) => ({
    date,
    code: daily.weather_code?.[i],
    max: Math.round(daily.temperature_2m_max?.[i]),
    min: Math.round(daily.temperature_2m_min?.[i]),
  }));
}

// Próximas horas em passos de 2h (6 pontos ~ 10h à frente) — hora a hora
// lotaria uma tela de TV sem espaço pra rolar.
const HOURLY_STEP_HOURS = 2;
const HOURLY_POINTS = 6;

function mapHourly(hourly) {
  if (!hourly?.time) return [];

  const nowKey = new Date().toISOString().slice(0, 13); // "YYYY-MM-DDTHH"
  let startIdx = hourly.time.findIndex((t) => t.slice(0, 13) >= nowKey);
  if (startIdx < 0) startIdx = 0;

  const points = [];
  for (let i = 0; i < HOURLY_POINTS; i++) {
    const idx = startIdx + i * HOURLY_STEP_HOURS;
    if (idx >= hourly.time.length) break;
    points.push({
      time: hourly.time[idx],
      temp: Math.round(hourly.temperature_2m?.[idx]),
      code: hourly.weather_code?.[idx],
      precipProb: hourly.precipitation_probability?.[idx] ?? null,
    });
  }
  return points;
}

// Temperatura atual de outras cidades (ex.: onde a rádio tem retransmissão) —
// uma única chamada em lote (lat/lon separados por vírgula), em vez de uma
// requisição por cidade. Com 1 cidade só a API devolve um objeto em vez de
// array, então normaliza os dois formatos antes de mapear.
async function fetchExtraCitiesTemps(cities) {
  if (!cities || cities.length === 0) return [];

  const lats = cities.map((c) => c.lat).join(',');
  const lons = cities.map((c) => c.lon).join(',');
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  const results = Array.isArray(json) ? json : [json];

  return cities.map((city, i) => ({
    label: city.label,
    temp: Math.round(results[i]?.current?.temperature_2m ?? NaN),
    code: results[i]?.current?.weather_code,
  }));
}

// Lat/lon/nome da cidade principal e a lista de cidades extras vêm das
// Configurações (editável pela tela de busca de cidade), com o padrão da
// estação como valor inicial.
export async function fetchWeather(settings) {
  const lat = settings?.weatherLat ?? stationConfig.WEATHER_LAT;
  const lon = settings?.weatherLon ?? stationConfig.WEATHER_LON;
  const cityLabel = settings?.weatherCityLabel || stationConfig.CITY_LABEL;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset` +
    `&timezone=America%2FSao_Paulo&forecast_days=5`;

  const [response, extraCities] = await Promise.all([
    fetch(url),
    // Não deixa uma falha nas cidades extras derrubar a previsão principal.
    fetchExtraCitiesTemps(settings?.weatherExtraCities).catch(() => []),
  ]);
  if (!response.ok) {
    throw new Error(`Falha ao buscar previsão do tempo (HTTP ${response.status})`);
  }
  const json = await response.json();
  return {
    cityLabel,
    temp: Math.round(json?.current?.temperature_2m),
    code: json?.current?.weather_code,
    windSpeed: Math.round(json?.current?.wind_speed_10m ?? NaN) || null,
    uvIndex: json?.daily?.uv_index_max?.[0] ?? null,
    sunrise: json?.daily?.sunrise?.[0] || null,
    sunset: json?.daily?.sunset?.[0] || null,
    daily: mapDaily(json?.daily),
    hourly: mapHourly(json?.hourly),
    extraCities,
  };
}
