import { INMET_ALERTS_URL } from '../config.js';
import { stationConfig } from '../stations/index.js';

const { WEATHER_ALERT_CITY_MATCH } = stationConfig;

const SEVERITY_RANK = {
  'Grande Perigo': 3,
  Perigo: 2,
  'Perigo Potencial': 1,
};

// "YYYY-MM-DD HH:MM" (horário local America/Sao_Paulo). A máquina roda no fuso
// do Brasil, então new Date interpreta como local.
function parseLocal(s) {
  if (!s) return null;
  const d = new Date(s.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

// Só é "ativo agora" se já começou e ainda não terminou. Isso evita mostrar
// alertas futuros antes da hora e alertas cujo fim já passou mas que o INMET
// ainda não marcou como encerrado.
function isActiveNow(a, now) {
  const inicio = parseLocal(a.inicio);
  const fim = parseLocal(a.fim);
  if (inicio != null && now < inicio) return false;
  if (fim != null && now > fim) return false;
  return true;
}

export async function fetchWeatherAlerts() {
  const response = await fetch(INMET_ALERTS_URL);
  if (!response.ok) {
    throw new Error(`Falha ao buscar alertas do INMET (HTTP ${response.status})`);
  }
  // A API às vezes responde 200 com um texto simples em vez de JSON (ex.: aviso
  // de limite de requisições) — detecta isso antes de tentar parsear.
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inesperada do INMET: ${text.slice(0, 120)}`);
  }
  const all = [...(json.hoje || []), ...(json.futuro || [])];
  const now = Date.now();

  return all
    .filter(
      (a) =>
        !a.encerrado &&
        isActiveNow(a, now) &&
        (a.municipios || '').includes(WEATHER_ALERT_CITY_MATCH)
    )
    .map((a) => ({
      id: a.id,
      descricao: a.descricao,
      severidade: a.severidade,
      cor: a.aviso_cor,
      inicio: a.inicio,
      fim: a.fim,
      riscos: a.riscos || [],
      instrucoes: a.instrucoes || [],
    }))
    .sort((a, b) => (SEVERITY_RANK[b.severidade] ?? 0) - (SEVERITY_RANK[a.severidade] ?? 0));
}
