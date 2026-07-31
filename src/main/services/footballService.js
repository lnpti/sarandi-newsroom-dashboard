import { ESPN_SCHEDULE_BASE, FOOTBALL_TEAMS } from '../config.js';

const GAMES_PER_TEAM = 2;

async function fetchTeamGames(team) {
  const response = await fetch(`${ESPN_SCHEDULE_BASE}/${team.espnId}/schedule?fixture=true`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = await response.json();
  const now = Date.now();

  return (json.events || [])
    .filter((e) => new Date(e.date).getTime() > now)
    .slice(0, GAMES_PER_TEAM)
    .map((e) => {
      const comp = e.competitions[0];
      const home = comp.competitors.find((c) => c.homeAway === 'home');
      const away = comp.competitors.find((c) => c.homeAway === 'away');
      return {
        id: e.id,
        team: team.key,
        date: e.date,
        homeName: home.team.displayName,
        homeAbbr: home.team.abbreviation,
        homeLogo: home.team.logos?.[0]?.href || null,
        awayName: away.team.displayName,
        awayAbbr: away.team.abbreviation,
        awayLogo: away.team.logos?.[0]?.href || null,
        venue: comp.venue?.fullName || null,
        league: e.league?.name || null,
      };
    });
}

export async function fetchFootball() {
  const results = await Promise.allSettled(FOOTBALL_TEAMS.map((t) => fetchTeamGames(t)));
  const games = [];
  for (const r of results) {
    if (r.status === 'fulfilled') games.push(...r.value);
  }
  // Se as duas falharam, propaga erro pro poller marcar status:'error'
  if (games.length === 0 && results.every((r) => r.status === 'rejected')) {
    throw new Error(results[0].reason?.message || 'Falha ao buscar jogos');
  }
  return games.sort((a, b) => new Date(a.date) - new Date(b.date));
}
