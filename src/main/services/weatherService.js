import { WEATHER_LAT, WEATHER_LON } from '../config.js';

const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
  `&current=temperature_2m,weather_code` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
  `&timezone=America%2FSao_Paulo&forecast_days=5`;

function mapDaily(daily) {
  if (!daily?.time) return [];
  return daily.time.map((date, i) => ({
    date,
    code: daily.weather_code?.[i],
    max: Math.round(daily.temperature_2m_max?.[i]),
    min: Math.round(daily.temperature_2m_min?.[i]),
  }));
}

export async function fetchWeather() {
  const response = await fetch(WEATHER_URL);
  if (!response.ok) {
    throw new Error(`Falha ao buscar previsão do tempo (HTTP ${response.status})`);
  }
  const json = await response.json();
  return {
    temp: Math.round(json?.current?.temperature_2m),
    code: json?.current?.weather_code,
    daily: mapDaily(json?.daily),
  };
}
