// API de geocodificação da Open-Meteo — sem chave, usada só pra tela de
// Configurações converter "nome da cidade digitado" em lat/lon.
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const RESULT_LIMIT = 8;

export async function searchCity(query) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=${RESULT_LIMIT}&language=pt&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();

  return (json.results || []).map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1 || null,
    country: r.country || null,
    lat: r.latitude,
    lon: r.longitude,
  }));
}
