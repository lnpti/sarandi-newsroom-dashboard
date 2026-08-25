import { ESPN_SCHEDULE_BASE } from '../config.js';
import { stationConfig } from '../stations/index.js';

const { FOOTBALL_TEAMS } = stationConfig;

const GAMES_PER_TEAM = 2;
const STANDINGS_BASE = 'https://site.api.espn.com/apis/v2/sports/soccer';
const SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const NEWS_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const NEWS_PER_LEAGUE_LIMIT = 6;
// A ESPN não tem endpoint de notícias por time — busca um lote maior do feed
// do campeonato e filtra pelo nome do time aparecer na manchete/descrição.
const TEAM_NEWS_FETCH_LIMIT = 50;
const TEAM_NEWS_LIMIT = 6;
// Janela de dias ao redor de hoje usada como aproximação de "a rodada" — a
// API da ESPN não expõe um número de rodada pra futebol, só um calendário de
// datas; a maioria dos campeonatos de pontos corridos joga uma rodada inteira
// dentro de ~3 dias antes/depois.
const ROUND_WINDOW_DAYS = 3;

function mapEvent(e, team) {
  const comp = e.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === 'home');
  const away = comp.competitors.find((c) => c.homeAway === 'away');
  const ours = comp.competitors.find((c) => c.team.id === team.espnId);
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
    leagueSlug: e.league?.slug || null,
    completed: !!comp.status?.type?.completed,
    // Sigla ESPN do time acompanhado nesse jogo (não necessariamente o
    // mandante) — usada pra destacar a linha certa na tabela de classificação,
    // sem fixar "GRE"/"INT" no código (funciona pra qualquer configuração).
    ourAbbr: ours?.team.abbreviation || null,
  };
}

// Um Grenal (ou qualquer jogo entre dois times acompanhados) aparece uma vez
// no calendário de cada time — sem isso a mesma partida saía duas vezes na
// lista (uma pelo lado do Grêmio, outra pelo lado do Inter).
function dedupeById(games) {
  const seen = new Set();
  return games.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
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

// Tabela de classificação de um campeonato — null se ele não tiver uma (ex.:
// Copa do Brasil é mata-mata, não tem "tabela").
async function fetchStandings(slug) {
  try {
    const json = await fetchJson(`${STANDINGS_BASE}/${slug}/standings`);
    const entries = json.children?.[0]?.standings?.entries;
    if (!entries || entries.length === 0) return null;

    const statValue = (stats, name) => stats.find((s) => s.name === name)?.value ?? null;

    return entries
      .map((entry) => ({
        rank: statValue(entry.stats, 'rank'),
        teamName: entry.team.displayName,
        teamAbbr: entry.team.abbreviation,
        teamLogo: entry.team.logos?.[0]?.href || null,
        played: statValue(entry.stats, 'gamesPlayed'),
        wins: statValue(entry.stats, 'wins'),
        draws: statValue(entry.stats, 'ties'),
        losses: statValue(entry.stats, 'losses'),
        goalDiff: statValue(entry.stats, 'pointDifferential'),
        points: statValue(entry.stats, 'points'),
      }))
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  } catch {
    return null;
  }
}

// Todos os jogos dos times envolvidos numa janela de dias ao redor de hoje —
// aproximação de "a rodada" do campeonato (ver ROUND_WINDOW_DAYS acima).
async function fetchRoundFixtures(slug) {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - ROUND_WINDOW_DAYS);
    const end = new Date(now);
    end.setDate(end.getDate() + ROUND_WINDOW_DAYS);
    const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

    const json = await fetchJson(`${SCOREBOARD_BASE}/${slug}/scoreboard?dates=${fmt(start)}-${fmt(end)}`);

    const matches = (json.events || []).map((e) => {
      const comp = e.competitions[0];
      const home = comp.competitors.find((c) => c.homeAway === 'home');
      const away = comp.competitors.find((c) => c.homeAway === 'away');
      return {
        id: e.id,
        date: e.date,
        homeAbbr: home.team.abbreviation,
        // Esse endpoint (scoreboard) não traz `team.logos[]` como os outros
        // dois usados neste arquivo — só um `team.logo` (string única).
        homeLogo: home.team.logos?.[0]?.href || home.team.logo || null,
        homeScore: home.score?.value ?? null,
        awayAbbr: away.team.abbreviation,
        awayLogo: away.team.logos?.[0]?.href || away.team.logo || null,
        awayScore: away.score?.value ?? null,
        completed: !!comp.status?.type?.completed,
      };
    });

    const logo = json.leagues?.[0]?.logos?.[0]?.href || null;
    return { matches, logo };
  } catch {
    return { matches: [], logo: null };
  }
}

function mapArticle(a) {
  return {
    id: String(a.id),
    title: a.headline,
    image: a.images[0].url,
    link: a.links?.web?.href || null,
    publishedAt: a.published || null,
  };
}

function normalizeText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Notícias de esporte direto do ESPN Brasil (espn.com.br) — lang/region fazem
// a mesma API devolver o conteúdo em português em vez do internacional.
async function fetchLeagueNews(slug) {
  try {
    const json = await fetchJson(`${NEWS_BASE}/${slug}/news?lang=pt&region=br`);
    return (json.articles || [])
      .filter((a) => a.headline && a.images?.[0]?.url)
      .slice(0, NEWS_PER_LEAGUE_LIMIT)
      .map(mapArticle);
  } catch {
    return [];
  }
}

// Notícias que mencionam os times acompanhados (ex.: Grêmio/Inter), puxadas
// de um lote maior do mesmo feed de notícias do campeonato — sem isso, os
// times só apareciam nas notícias genéricas do campeonato inteiro.
async function fetchTeamNews(slugs, teams) {
  const teamNames = teams.map((t) => normalizeText(t.name)).filter(Boolean);
  if (teamNames.length === 0) return [];

  const batches = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const json = await fetchJson(`${NEWS_BASE}/${slug}/news?lang=pt&region=br&limit=${TEAM_NEWS_FETCH_LIMIT}`);
        return json.articles || [];
      } catch {
        return [];
      }
    })
  );

  const seen = new Set();
  return batches
    .flat()
    .filter((a) => {
      if (!a.headline || !a.images?.[0]?.url || seen.has(a.id)) return false;
      const haystack = normalizeText(`${a.headline} ${a.description || ''}`);
      const mentioned = teamNames.some((name) => haystack.includes(name));
      if (!mentioned) return false;
      seen.add(a.id);
      return true;
    })
    .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
    .slice(0, TEAM_NEWS_LIMIT)
    .map(mapArticle);
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

  // Campeonatos em que os times têm jogo marcado agora — classificação e
  // rodada só fazem sentido pra esses, buscados dinamicamente (não fixos).
  const leagues = new Map();
  for (const g of [...games, ...lastResults]) {
    if (g.leagueSlug && !leagues.has(g.leagueSlug)) leagues.set(g.leagueSlug, g.league);
  }

  const leagueEntries = [...leagues.entries()];
  const [standingsResults, roundResults, newsResults, teamNews] = await Promise.all([
    Promise.all(leagueEntries.map(([slug]) => fetchStandings(slug))),
    Promise.all(leagueEntries.map(([slug]) => fetchRoundFixtures(slug))),
    Promise.all(leagueEntries.map(([slug]) => fetchLeagueNews(slug))),
    fetchTeamNews(
      leagueEntries.map(([slug]) => slug),
      FOOTBALL_TEAMS
    ),
  ]);

  const standings = leagueEntries
    .map(([slug, name], i) => ({ slug, name, table: standingsResults[i] }))
    .filter((l) => l.table);

  const rounds = leagueEntries
    .map(([slug, name], i) => ({ slug, name, logo: roundResults[i].logo, matches: roundResults[i].matches }))
    .filter((l) => l.matches.length > 0);

  const trackedAbbrs = [...new Set([...games, ...lastResults].map((g) => g.ourAbbr).filter(Boolean))];

  // Junta as notícias de todos os campeonatos ativos, sem duplicar (a mesma
  // matéria pode aparecer no feed de mais de uma competição).
  const seenNews = new Set();
  const news = newsResults
    .flat()
    .filter((a) => (seenNews.has(a.id) ? false : (seenNews.add(a.id), true)))
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

  return {
    upcoming: dedupeById(games.sort((a, b) => new Date(a.date) - new Date(b.date))),
    lastResults: dedupeById(lastResults),
    standings,
    rounds,
    trackedAbbrs,
    // Nomes dos times acompanhados nesta estação (não fixa "Grêmio"/"Inter" no
    // código — outra estação pode ter uma configuração de times diferente).
    trackedTeamNames: FOOTBALL_TEAMS.map((t) => t.name),
    news,
    teamNews,
  };
}
