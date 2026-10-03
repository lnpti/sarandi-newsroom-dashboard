import { stationConfig } from '../stations/index.js';

// Placar ao vivo dos jogos que importam pra rádio — Brasil (seleção) e os times
// acompanhados da emissora (Grêmio/Inter) — mostrado na barra inferior só
// enquanto a bola rola.
//
// Usa a agenda de cada time (`teams/<id>/schedule?fixture=true`), que inclui o
// jogo em andamento de QUALQUER competição. O placar geral "soccer/all/scoreboard"
// não serve: ele deixa de fora competições inteiras (amistosos de seleções, por
// exemplo) e o jogo da seleção simplesmente não aparecia.

const { FOOTBALL_TEAMS } = stationConfig;

const SCHEDULE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams';
// Id da seleção brasileira na ESPN.
const BRAZIL_NATIONAL_ID = '205';
const MAX_TEAM_NAME = 18;

const trackedIds = () => [BRAZIL_NATIONAL_ID, ...FOOTBALL_TEAMS.map((t) => String(t.espnId))];

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function teamLabel(team) {
  const full = team.displayName || team.shortDisplayName || '';
  return full.length <= MAX_TEAM_NAME ? full : team.shortDisplayName || full;
}

// Na agenda o placar vem como objeto ({ value, displayValue }); no placar geral
// vem como texto — aceita os dois.
function scoreOf(competitor) {
  const s = competitor.score;
  const raw = s && typeof s === 'object' ? (s.value ?? s.displayValue) : s;
  const n = Number(raw);
  return raw == null || raw === '' || Number.isNaN(n) ? 0 : n;
}

function clockLabel(status) {
  if (status?.type?.name === 'STATUS_HALFTIME') return 'Intervalo';
  return status?.displayClock || status?.type?.shortDetail || '';
}

function mapLiveEvent(e) {
  const comp = e.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === 'home');
  const away = comp?.competitors?.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;
  return {
    id: e.id,
    homeName: teamLabel(home.team),
    homeAbbr: home.team.abbreviation,
    homeLogo: home.team.logos?.[0]?.href || home.team.logo || null,
    homeScore: scoreOf(home),
    awayName: teamLabel(away.team),
    awayAbbr: away.team.abbreviation,
    awayLogo: away.team.logos?.[0]?.href || away.team.logo || null,
    awayScore: scoreOf(away),
    clock: clockLabel(comp.status),
    // Só pra ordenar: jogo da seleção primeiro.
    national: [home, away].some((c) => String(c.team.id) === BRAZIL_NATIONAL_ID),
  };
}

// Só jogos EM ANDAMENTO (state 'in'). Um Grenal (os dois times acompanhados)
// aparece na agenda dos dois — dedupe por id.
export async function fetchLiveScores() {
  const results = await Promise.allSettled(
    trackedIds().map((id) => fetchJson(`${SCHEDULE_BASE}/${id}/schedule?fixture=true&lang=pt&region=br`))
  );
  if (results.every((r) => r.status === 'rejected')) throw results[0].reason;

  const seen = new Set();
  const games = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const e of r.value.events || []) {
      if (e.competitions?.[0]?.status?.type?.state !== 'in' || seen.has(e.id)) continue;
      const mapped = mapLiveEvent(e);
      if (!mapped) continue;
      seen.add(e.id);
      games.push(mapped);
    }
  }
  games.sort((a, b) => Number(b.national) - Number(a.national));
  return { games };
}
