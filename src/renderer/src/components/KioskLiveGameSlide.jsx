import { getLiveGames } from '../liveScores.js';

const ICONS = { goal: '⚽', yellow: '🟨', red: '🟥', sub: '🔁' };

// Quantos lances por time cabem na coluna: o jogo único tem a tela toda, os
// dois jogos dividem a altura.
const MAX_EVENTS_SINGLE = 9;
const MAX_EVENTS_DOUBLE = 5;

// Gols e cartões sempre aparecem; as substituições (mais numerosas) só
// preenchem o que sobrar, as mais recentes primeiro. Sai em ordem de minuto.
function pickEvents(events, side, max) {
  const mine = events.filter((e) => e.side === side);
  const important = mine.filter((e) => e.kind !== 'sub');
  const subs = mine.filter((e) => e.kind === 'sub');
  const room = Math.max(0, max - important.length);
  const keptSubs = new Set(subs.slice(Math.max(0, subs.length - room)));
  return mine.filter((e) => e.kind !== 'sub' || keptSubs.has(e)).slice(-max);
}

function Team({ name, logo, scored }) {
  return (
    <div className={`lg-team ${scored ? 'lg-team--scored' : ''}`}>
      {logo ? <img className="lg-team__logo" src={logo} alt="" /> : <span className="lg-team__logo lg-team__logo--empty" />}
      <span className="lg-team__name">{name}</span>
    </div>
  );
}

function EventRow({ ev }) {
  const detail =
    ev.kind === 'goal'
      ? [ev.note, ev.other && `assist. ${ev.other}`].filter(Boolean).join(' · ')
      : ev.kind === 'sub'
        ? ev.other && `sai ${ev.other}`
        : '';
  return (
    <div className={`lg-ev lg-ev--${ev.kind}`}>
      <span className="lg-ev__min">{ev.minute}</span>
      <span className="lg-ev__ico" aria-hidden="true">
        {ICONS[ev.kind]}
      </span>
      <span className="lg-ev__main">
        <span className="lg-ev__player">{ev.player || (ev.kind === 'goal' ? 'Gol' : '')}</span>
        {detail && <span className="lg-ev__detail">{detail}</span>}
      </span>
    </div>
  );
}

function EventList({ events, side, max }) {
  const list = pickEvents(events, side, max);
  return (
    <div className={`lg-evlist lg-evlist--${side}`}>
      {list.length === 0 ? <span className="lg-evlist__empty">Sem lances ainda</span> : list.map((ev, i) => <EventRow key={i} ev={ev} />)}
    </div>
  );
}

function StatRow({ stat }) {
  const total = stat.home + stat.away;
  const homePct = total > 0 ? (stat.home / total) * 100 : 50;
  const fmt = (v) => (stat.pct ? `${Math.round(v)}%` : v);
  return (
    <div className="lg-stat">
      <div className="lg-stat__line">
        <span className="lg-stat__v">{fmt(stat.home)}</span>
        <span className="lg-stat__label">{stat.label}</span>
        <span className="lg-stat__v">{fmt(stat.away)}</span>
      </div>
      <div className="lg-stat__bar">
        <span className="lg-stat__home" style={{ width: `${homePct}%` }} />
        <span className="lg-stat__away" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

// Quem fez o gol que acabou de sair. O detalhe pode demorar um ciclo a mais que
// o placar (a ESPN ainda não listou o lance): sem o lance correspondente, cai
// pro nome do time em vez de mostrar o jogador do gol anterior.
function scorerOf(game, goal) {
  const goals = (game.details?.events || []).filter((e) => e.kind === 'goal' && e.side === goal.side);
  const score = goal.side === 'home' ? game.homeScore : game.awayScore;
  return goals.length >= score ? goals[goals.length - 1] : null;
}

function LiveGameCard({ game, goal, showDetails, two }) {
  const scoring = goal && goal.gameId === game.id ? goal.side : null;
  const details = showDetails ? game.details : null;
  const scorer = scoring ? scorerOf(game, goal) : null;
  const max = two ? MAX_EVENTS_DOUBLE : MAX_EVENTS_SINGLE;

  return (
    <section
      className={`lg-game ${scoring ? 'lg-game--goal' : ''} ${details ? 'lg-game--detailed' : ''} ${game.finished ? 'lg-game--ended' : ''}`}
    >
      {scoring && (
        <div className="lg-goal">
          ⚽ GOOOL! · {scorer?.player ? `${scorer.player} (${goal.teamName})` : goal.teamName}
        </div>
      )}
      <div className="lg-game__row">
        <Team name={game.homeName} logo={game.homeLogo} scored={scoring === 'home'} />
        <div className="lg-center">
          <span className="lg-score">
            <span className={scoring === 'home' ? 'lg-score__n lg-score__n--scored' : 'lg-score__n'}>{game.homeScore}</span>
            <span className="lg-score__x">×</span>
            <span className={scoring === 'away' ? 'lg-score__n lg-score__n--scored' : 'lg-score__n'}>{game.awayScore}</span>
          </span>
          {game.clock && <span className={`lg-clock ${game.finished ? 'lg-clock--ended' : ''}`}>{game.clock}</span>}
        </div>
        <Team name={game.awayName} logo={game.awayLogo} scored={scoring === 'away'} />
      </div>

      {details && (
        <div className={`lg-details ${!two && details.stats.length > 0 ? 'lg-details--stats' : ''}`}>
          <EventList events={details.events} side="home" max={max} />
          {!two && details.stats.length > 0 && (
            <div className="lg-stats">
              {details.stats.map((stat) => (
                <StatRow key={stat.label} stat={stat} />
              ))}
            </div>
          )}
          <EventList events={details.events} side="away" max={max} />
        </div>
      )}
    </section>
  );
}

// Tela inteira do(s) jogo(s) ao vivo do Brasil/times acompanhados. Entra no
// rodízio só enquanto há jogo em andamento (ver KioskView) e, com o alerta de
// gol ligado, também interrompe a tela atual quando o placar muda (`goal`).
export default function KioskLiveGameSlide({ liveScores, goal, showDetails = true }) {
  const games = getLiveGames(liveScores).slice(0, 2);
  const two = games.length > 1;
  // Só encerrados (os 10 minutos depois do apito final): selo neutro, sem ponto pulsante.
  const allEnded = games.length > 0 && games.every((g) => g.finished);

  return (
    <div className={`kiosk-slide kiosk-slide--live ${goal ? 'kiosk-slide--goal' : ''}`}>
      <div className="kiosk-slide__header lg-header">
        <span className={`lg-header__badge ${allEnded ? 'lg-header__badge--ended' : ''}`}>
          {!allEnded && <span className="lg-header__dot" />} {allEnded ? 'ENCERRADO' : 'AO VIVO'}
        </span>
        <span>{allEnded ? 'Resultado final' : 'Placar em tempo real'}</span>
      </div>
      {games.length === 0 ? (
        <p className="kiosk-slide__empty">Nenhum jogo em andamento.</p>
      ) : (
        <div className={`lg ${two ? 'lg--two' : ''}`}>
          {games.map((game) => (
            <LiveGameCard key={game.id} game={game} goal={goal} showDetails={showDetails} two={two} />
          ))}
        </div>
      )}
    </div>
  );
}
