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
const SUMMARY_URL = (eventId) =>
  `https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${eventId}&lang=pt&region=br`;
const SUMMARY_TIMEOUT_MS = 8000;
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
    homeId: String(home.team.id),
    awayId: String(away.team.id),
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

// ---- Detalhes do jogo (gols, cartões, substituições, estatísticas) ---------
// Vêm do "summary" da ESPN, já em português. Cada lance traz o time (id), o
// minuto e os jogadores envolvidos: gol = [quem fez, quem deu a assistência];
// substituição = [quem entrou, quem saiu].
const STAT_ROWS = [
  ['possessionPct', 'Posse de bola', true],
  ['totalShots', 'Finalizações'],
  ['shotsOnTarget', 'No alvo'],
  ['wonCorners', 'Escanteios'],
  ['foulsCommitted', 'Faltas'],
  ['offsides', 'Impedimentos'],
  ['saves', 'Defesas'],
];

function eventKind(k) {
  const text = k.type?.text || '';
  const type = k.type?.type || '';
  if (k.scoringPlay || /^gol/i.test(text)) return 'goal';
  if (/red/i.test(type) || /vermelho/i.test(text)) return 'red';
  if (/yellow/i.test(type) || /amarelo/i.test(text)) return 'yellow';
  if (/substitution/i.test(type) || /substitui/i.test(text)) return 'sub';
  return null;
}

export function parseMatchDetails(summary, homeId, awayId) {
  const sideOf = (id) => (String(id) === homeId ? 'home' : String(id) === awayId ? 'away' : null);

  const events = [];
  for (const k of summary.keyEvents || []) {
    const kind = eventKind(k);
    const side = sideOf(k.team?.id);
    if (!kind || !side) continue;
    const names = (k.participants || []).map((p) => p.athlete?.displayName).filter(Boolean);
    const text = k.type?.text || '';
    events.push({
      kind,
      side,
      minute: k.clock?.displayValue || '',
      player: names[0] || '',
      // gol: assistência · substituição: quem saiu
      other: names[1] || '',
      note: /p[eê]nalti/i.test(text) ? 'pênalti' : /contra/i.test(text) ? 'gol contra' : '',
    });
  }

  const teams = summary.boxscore?.teams || [];
  const statOf = (team, name) => {
    const v = Number(team?.statistics?.find((x) => x.name === name)?.displayValue);
    return Number.isFinite(v) ? v : null;
  };
  const homeTeam = teams.find((t) => String(t.team?.id) === homeId);
  const awayTeam = teams.find((t) => String(t.team?.id) === awayId);
  const stats = [];
  for (const [name, label, pct] of STAT_ROWS) {
    const home = statOf(homeTeam, name);
    const away = statOf(awayTeam, name);
    if (home == null || away == null) continue;
    stats.push({ label, home, away, pct: !!pct });
  }

  return { events, stats };
}

async function fetchSummary(eventId, homeId, awayId, withDetails) {
  try {
    const response = await fetch(SUMMARY_URL(eventId), { signal: AbortSignal.timeout(SUMMARY_TIMEOUT_MS) });
    if (!response.ok) return null;
    const json = await response.json();
    const comp = json.header?.competitions?.[0];
    const scoreFor = (id) => {
      const c = comp?.competitors?.find((x) => String(x.team?.id) === id);
      return c ? scoreOf(c) : null;
    };
    return {
      state: comp?.status?.type?.state || null,
      homeScore: scoreFor(homeId),
      awayScore: scoreFor(awayId),
      details: withDetails ? parseMatchDetails(json, homeId, awayId) : null,
    };
  } catch {
    // Sem detalhe (ESPN lenta ou jogo de campeonato menor sem cobertura): a tela
    // mostra só o placar, como antes.
    return null;
  }
}

export async function fetchMatchDetails(eventId, homeId, awayId) {
  return (await fetchSummary(eventId, homeId, awayId, true))?.details ?? null;
}

// ---- Jogo encerrado continua à vista por 10 minutos ------------------------
// O jogo some da lista "ao vivo" da ESPN quando acaba. Guardamos o último placar
// de cada jogo visto ao vivo; quando ele some, confirmamos o fim no summary (que
// também traz o placar FINAL — gol nos acréscimos — e os detalhes) e o mantemos
// por FINISHED_KEEP_MS, marcado como encerrado.
const FINISHED_KEEP_MS = 10 * 60 * 1000;
// Se a ESPN demorar a marcar o jogo como encerrado, desiste de esperar e usa o
// último placar visto.
const FINISH_CONFIRM_GIVE_UP_MS = 5 * 60 * 1000;
// Duração aproximada de um jogo (90' + intervalo + acréscimos): só serve pra
// estimar o apito final de um jogo que acabou ANTES de o app abrir.
const ESTIMATED_GAME_MS = 115 * 60 * 1000;

// Memória entre buscas (o poller roda sempre no mesmo processo).
const lastLive = new Map(); // id -> último placar visto ao vivo
const pending = new Map(); // id -> { game, since }: sumiu da lista, falta confirmar o fim
const finished = new Map(); // id -> jogo encerrado (com endedAt)
let bootChecked = false;

function finalize(game, summary, endedAt) {
  finished.set(game.id, {
    ...game,
    homeScore: summary?.homeScore ?? game.homeScore,
    awayScore: summary?.awayScore ?? game.awayScore,
    details: summary?.details ?? game.details ?? null,
    finished: true,
    clock: 'Fim de jogo',
    endedAt,
  });
}

// Ao abrir o app logo depois de um jogo acabar, não houve nenhum momento "ao
// vivo" pra guardar: procura nos jogos já disputados (agenda sem fixture=true)
// os que terminaram há menos de 10 minutos, pela hora estimada do apito final.
async function recoverRecentlyFinished(withDetails) {
  const now = Date.now();
  const results = await Promise.allSettled(
    trackedIds().map((id) => fetchJson(`${SCHEDULE_BASE}/${id}/schedule?lang=pt&region=br`))
  );
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const e of r.value.events || []) {
      if (e.competitions?.[0]?.status?.type?.state !== 'post' || finished.has(e.id)) continue;
      const endedAt = Math.min(now, new Date(e.date).getTime() + ESTIMATED_GAME_MS);
      if (!Number.isFinite(endedAt) || now - endedAt >= FINISHED_KEEP_MS) continue;
      const game = mapLiveEvent(e);
      if (!game) continue;
      finalize(game, await fetchSummary(game.id, game.homeId, game.awayId, withDetails), endedAt);
    }
  }
}

// Jogos EM ANDAMENTO (state 'in') + os que acabaram há menos de 10 minutos
// (finished: true). Um Grenal (os dois times acompanhados) aparece na agenda
// dos dois — dedupe por id.
export async function fetchLiveScores({ details = true } = {}) {
  const now = Date.now();
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

  // Jogo que estava ao vivo e sumiu da lista: confirma o fim no summary.
  for (const [id, game] of lastLive) {
    if (!seen.has(id)) {
      lastLive.delete(id);
      pending.set(id, { game, since: now });
    }
  }
  await Promise.all(
    [...pending].map(async ([id, p]) => {
      const summary = await fetchSummary(id, p.game.homeId, p.game.awayId, details);
      if (summary?.state === 'in') {
        // Falha passageira da lista (ou uma das agendas não respondeu): ainda é ao vivo.
        pending.delete(id);
        games.push({
          ...p.game,
          homeScore: summary.homeScore ?? p.game.homeScore,
          awayScore: summary.awayScore ?? p.game.awayScore,
          details: summary.details ?? p.game.details,
        });
      } else if (summary?.state === 'post') {
        pending.delete(id);
        finalize(p.game, summary, now);
      } else if (now - p.since > FINISH_CONFIRM_GIVE_UP_MS) {
        pending.delete(id);
        finalize(p.game, summary, p.since);
      }
    })
  );

  if (!bootChecked) {
    bootChecked = true;
    await recoverRecentlyFinished(details);
  }

  // Detalhes só dos jogos ao vivo que a tela mostra (no máximo 2) e só se ligados.
  if (details) {
    await Promise.all(
      games.slice(0, 2).map(async (game) => {
        if (!game.details) game.details = await fetchMatchDetails(game.id, game.homeId, game.awayId);
      })
    );
  }
  for (const game of games) lastLive.set(game.id, game);

  for (const [id, game] of finished) {
    if (now - game.endedAt >= FINISHED_KEEP_MS) finished.delete(id);
  }

  // Ao vivo antes de encerrado; em cada grupo, a seleção primeiro.
  const order = (a, b) => Number(b.national) - Number(a.national);
  return { games: [...games.sort(order), ...[...finished.values()].sort(order)] };
}
