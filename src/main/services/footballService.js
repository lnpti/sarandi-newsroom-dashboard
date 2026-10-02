import { ESPN_SCHEDULE_BASE } from '../config.js';
import { stationConfig } from '../stations/index.js';

const { FOOTBALL_TEAMS } = stationConfig;

const GAMES_PER_TEAM = 2;
const STANDINGS_BASE = 'https://site.api.espn.com/apis/v2/sports/soccer';
const SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
// lang/region fazem a ESPN devolver nomes de seleções e clubes em português
// (Brazil → Brasil, Italy → Itália, Czechia → República Tcheca).
const ESPN_PT = 'lang=pt&region=br';
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
const ROUND_WINDOW_DAYS = 3; // dias passados
const ROUND_WINDOW_AHEAD_DAYS = 7; // dias à frente (pausa de data FIFA: próxima rodada pode estar a uma semana)

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

// A ESPN passou a recusar (HTTP 400) consulta por intervalo de datas
// (`dates=AAAAMMDD-AAAAMMDD`) — tenta o intervalo primeiro (mais barato) e,
// se falhar, busca dia a dia em paralelo e junta os eventos sem repetir.
const yyyymmdd = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');

async function fetchScoreboardWindow(slug, daysBack, daysAhead) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  const end = new Date(now);
  end.setDate(end.getDate() + daysAhead);

  try {
    return await fetchJson(`${SCOREBOARD_BASE}/${slug}/scoreboard?${ESPN_PT}&dates=${yyyymmdd(start)}-${yyyymmdd(end)}`);
  } catch {
    // cai pro dia a dia
  }

  const days = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(yyyymmdd(d));
  const jsons = await Promise.all(
    days.map((day) => fetchJson(`${SCOREBOARD_BASE}/${slug}/scoreboard?${ESPN_PT}&dates=${day}`).catch(() => null))
  );
  const seen = new Set();
  const events = [];
  for (const j of jsons) {
    for (const e of j?.events || []) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      events.push(e);
    }
  }
  const firstOk = jsons.find((j) => j);
  return { events, leagues: firstOk?.leagues || [] };
}

// `score` vem como objeto ({ value }) nos jogos do calendário do time, mas
// como string simples ("2") no scoreboard — normaliza os dois formatos.
function scoreOf(competitor) {
  const s = competitor.score;
  if (s == null || s === '') return null;
  if (typeof s === 'object') return s.value ?? null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

// Nome inteiro em português quando cabe no cartão; nomes compridos
// ("República Democrática do Congo") usam a forma curta da ESPN ("Congo").
const MAX_TEAM_NAME = 18;
function teamLabel(team) {
  const full = team.displayName || team.shortDisplayName || '';
  return full.length <= MAX_TEAM_NAME ? full : team.shortDisplayName || full;
}

function mapScoreboardEvent(e, leagueName) {
  const comp = e.competitions?.[0];
  const home = comp?.competitors?.find((c) => c.homeAway === 'home');
  const away = comp?.competitors?.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;
  const state = comp.status?.type?.state; // 'pre' | 'in' | 'post'
  return {
    id: e.id,
    date: e.date,
    league: leagueName || null,
    homeAbbr: home.team.abbreviation,
    homeName: teamLabel(home.team),
    homeLogo: home.team.logos?.[0]?.href || home.team.logo || null,
    homeScore: scoreOf(home),
    awayAbbr: away.team.abbreviation,
    awayName: teamLabel(away.team),
    awayLogo: away.team.logos?.[0]?.href || away.team.logo || null,
    awayScore: scoreOf(away),
    completed: !!comp.status?.type?.completed,
    live: state === 'in',
    clock: state === 'in' ? comp.status?.displayClock || null : null,
  };
}

// Todos os jogos dos times envolvidos numa janela de dias ao redor de hoje —
// aproximação de "a rodada" do campeonato (ver ROUND_WINDOW_DAYS acima).
async function fetchRoundFixtures(slug) {
  try {
    const json = await fetchScoreboardWindow(slug, ROUND_WINDOW_DAYS, ROUND_WINDOW_AHEAD_DAYS);
    // Janela maior pega 2 rodadas — fica com os jogos mais próximos de agora e
    // devolve em ordem de data.
    const now = Date.now();
    const matches = (json.events || [])
      .map((e) => mapScoreboardEvent(e))
      .filter(Boolean)
      .sort((a, b) => Math.abs(new Date(a.date) - now) - Math.abs(new Date(b.date) - now))
      .slice(0, 10)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const logo = json.leagues?.[0]?.logos?.[0]?.href || null;
    return { matches, logo };
  } catch {
    return { matches: [], logo: null };
  }
}

// Principais campeonatos do mundo + Libertadores (2º slide de esporte), na
// ordem de prioridade. O scoreboard sem data devolve a "rodada" corrente de
// cada competição — filtra pra janela recente/próxima porque algumas devolvem
// jogo velho (final de Copa, etc.).
const TOP_COMPETITIONS = [
  { slug: 'conmebol.libertadores', label: 'Libertadores' },
  { slug: 'uefa.champions', label: 'Champions League' },
  { slug: 'eng.1', label: 'Premier League' },
  { slug: 'esp.1', label: 'La Liga' },
  { slug: 'ita.1', label: 'Serie A (Itália)' },
  { slug: 'ger.1', label: 'Bundesliga' },
  { slug: 'fra.1', label: 'Ligue 1' },
  { slug: 'conmebol.sudamericana', label: 'Sul-Americana' },
  { slug: 'uefa.europa', label: 'Europa League' },
  { slug: 'por.1', label: 'Liga Portugal' },
];
const NATIONAL_COMPETITIONS = [
  { slug: 'fifa.friendly', label: 'Amistoso' },
  { slug: 'uefa.nations', label: 'Nations League' },
  { slug: 'concacaf.nations.league', label: 'Nations League Concacaf' },
  { slug: 'fifa.world', label: 'Copa do Mundo' },
  { slug: 'fifa.worldq.conmebol', label: 'Eliminatórias Sul-Americanas' },
  { slug: 'fifa.worldq.uefa', label: 'Eliminatórias Europeias' },
  { slug: 'conmebol.america', label: 'Copa América' },
];
const DAY_MS = 86400000;
const NATIONAL_GAMES_LIMIT = 7;
const OTHER_GAMES_LIMIT = 7;
// Dias à frente: seleções 7; campeonatos de clubes 14, porque numa pausa de data
// FIFA a próxima rodada das ligas europeias fica a mais de uma semana.
const NATIONAL_AHEAD_DAYS = 7;
const OTHER_AHEAD_DAYS = 14;
// No máximo N jogos por competição por rodada de sorteio, pra Libertadores,
// Champions e as ligas dividirem a tela em vez de uma só ocupar tudo.
const OTHER_PER_COMPETITION = 2;
// Siglas ESPN de seleções que o público reconhece — só pra ordenação.
const FAMOUS_ABBRS = new Set([
  'ARG', 'URU', 'COL', 'CHI', 'PAR', 'ECU', 'PER', 'FRA', 'ESP', 'ENG', 'GER', 'POR', 'ITA', 'NED',
  'BEL', 'CRO', 'MEX', 'USA', 'JPN', 'KOR', 'MAR', 'SEN',
]);

async function fetchCompetitionEvents({ slug, label }, minTs, maxTs) {
  try {
    const json = await fetchJson(`${SCOREBOARD_BASE}/${slug}/scoreboard?${ESPN_PT}`);
    return (json.events || [])
      .filter((e) => {
        const t = new Date(e.date).getTime();
        return t >= minTs && t <= maxTs;
      })
      .map((e) => mapScoreboardEvent(e, label))
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch {
    return [];
  }
}

function dedupeGames(games) {
  const seen = new Set();
  return games.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
}

// Seleções: Brasil primeiro, depois as conhecidas, depois o resto (amistoso de
// seleção obscura não deve empurrar o jogo da Argentina).
async function fetchNationalGames() {
  const now = Date.now();
  const batches = await Promise.all(
    NATIONAL_COMPETITIONS.map((c) => fetchCompetitionEvents(c, now - DAY_MS, now + NATIONAL_AHEAD_DAYS * DAY_MS))
  );
  const rank = (g) => {
    if (g.homeAbbr === 'BRA' || g.awayAbbr === 'BRA') return 0;
    if (FAMOUS_ABBRS.has(g.homeAbbr) || FAMOUS_ABBRS.has(g.awayAbbr)) return 1;
    return 2;
  };
  return dedupeGames(batches.flat())
    .sort((a, b) => rank(a) - rank(b) || new Date(a.date) - new Date(b.date))
    .slice(0, NATIONAL_GAMES_LIMIT);
}

// Clubes: sorteia por competição na ordem de prioridade (até N de cada, em
// rodadas) e só no fim ordena por data pra exibir.
async function fetchTopCompetitionGames() {
  const now = Date.now();
  const lists = await Promise.all(
    TOP_COMPETITIONS.map((c) => fetchCompetitionEvents(c, now - DAY_MS, now + OTHER_AHEAD_DAYS * DAY_MS))
  );
  const picked = [];
  for (let round = 0; round < OTHER_PER_COMPETITION; round++) {
    for (const list of lists) {
      if (list[round] && picked.length < OTHER_GAMES_LIMIT) picked.push(list[round]);
    }
  }
  return dedupeGames(picked).sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const [standingsResults, roundResults, newsResults, teamNews, otherGames, nationalGames] = await Promise.all([
    Promise.all(leagueEntries.map(([slug]) => fetchStandings(slug))),
    Promise.all(leagueEntries.map(([slug]) => fetchRoundFixtures(slug))),
    Promise.all(leagueEntries.map(([slug]) => fetchLeagueNews(slug))),
    fetchTeamNews(
      leagueEntries.map(([slug]) => slug),
      FOOTBALL_TEAMS
    ),
    fetchTopCompetitionGames(),
    fetchNationalGames(),
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
    otherGames,
    nationalGames,
  };
}
