import { ESPN_SCHEDULE_BASE } from '../config.js';
import { stationConfig } from '../stations/index.js';

const { FOOTBALL_TEAMS } = stationConfig;

const GAMES_PER_TEAM = 2;

function mapEvent(e, team) {
  const comp = e.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  // `score` vem como objeto ({ value, displayValue, ... }) nos jogos já
  // disputados; nos futuros o campo simplesmente não existe.
  return {
    id: e.id,
    team: team.key,
    date: e.date,
    homeName: home.team.displayName,
    homeAbbr: home.team.abbreviation,
    homeLogo: home.team.logos?.[0]?.href || null,
    homeScore: home.score?.value ?? null,
    awayName: away.team.displayName,
    awayAbbr: away.team.abbreviation,
    awayLogo: away.team.logos?.[0]?.href || null,
    awayScore: away.score?.value ?? null,
    venue: comp.venue?.fullName || null,
    league: e.league?.name || null,
    completed: !!comp.status?.type?.completed,
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchTeamGames(team) {
  // A API da ESPN separa os dois casos: `fixture=true` só traz jogos futuros;
  // sem esse parâmetro só traz jogos já disputados. Por isso duas chamadas.
  const [upcomingJson, playedJson] = await Promise.all([
    fetchJson(`${ESPN_SCHEDULE_BASE}/${team.espnId}/schedule?fixture=true`),
    fetchJson(`${ESPN_SCHEDULE_BASE}/${team.espnId}/schedule`),
  ]);

  const upcoming = (upcomingJson.events || [])
    .slice(0, GAMES_PER_TEAM)
    .map((e) => mapEvent(e, team));

  const played = (playedJson.events || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastResult = played[0];

  return {
    upcoming,
    lastResult: lastResult ? mapEvent(lastResult, team) : null,
  };
}

export async function fetchFootball() {
  const results = await Promise.allSettled(FOOTBALL_TEAMS.map((t) => fetchTeamGames(t)));
  const games = [];
  const lastResults = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      games.push(...r.value.upcoming);
      if (r.value.lastResult) lastResults.push(r.value.lastResult);
    }
  }
  // Se as duas falharam, propaga erro pro poller marcar status:'error'
  if (games.length === 0 && lastResults.length === 0 && results.every((r) => r.status === 'rejected')) {
    throw new Error(results[0].reason?.message || 'Falha ao buscar jogos');
  }
  return {
    upcoming: games.sort((a, b) => new Date(a.date) - new Date(b.date)),
    lastResults,
  };
}
