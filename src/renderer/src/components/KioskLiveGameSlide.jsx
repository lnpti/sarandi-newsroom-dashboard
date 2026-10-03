import { getLiveGames } from '../liveScores.js';

function Team({ name, logo, scored }) {
  return (
    <div className={`lg-team ${scored ? 'lg-team--scored' : ''}`}>
      {logo ? <img className="lg-team__logo" src={logo} alt="" /> : <span className="lg-team__logo lg-team__logo--empty" />}
      <span className="lg-team__name">{name}</span>
    </div>
  );
}

function LiveGameCard({ game, goal }) {
  const scoring = goal && goal.gameId === game.id ? goal.side : null;
  return (
    <section className={`lg-game ${scoring ? 'lg-game--goal' : ''}`}>
      {scoring && <div className="lg-goal">⚽ GOOOL! · {goal.teamName}</div>}
      <div className="lg-game__row">
        <Team name={game.homeName} logo={game.homeLogo} scored={scoring === 'home'} />
        <div className="lg-center">
          <span className="lg-score">
            <span className={scoring === 'home' ? 'lg-score__n lg-score__n--scored' : 'lg-score__n'}>{game.homeScore}</span>
            <span className="lg-score__x">×</span>
            <span className={scoring === 'away' ? 'lg-score__n lg-score__n--scored' : 'lg-score__n'}>{game.awayScore}</span>
          </span>
          {game.clock && <span className="lg-clock">{game.clock}</span>}
        </div>
        <Team name={game.awayName} logo={game.awayLogo} scored={scoring === 'away'} />
      </div>
    </section>
  );
}

// Tela inteira do(s) jogo(s) ao vivo do Brasil/times acompanhados. Entra no
// rodízio só enquanto há jogo em andamento (ver KioskView) e, com o alerta de
// gol ligado, também interrompe a tela atual quando o placar muda (`goal`).
export default function KioskLiveGameSlide({ liveScores, goal }) {
  const games = getLiveGames(liveScores).slice(0, 2);

  return (
    <div className={`kiosk-slide kiosk-slide--live ${goal ? 'kiosk-slide--goal' : ''}`}>
      <div className="kiosk-slide__header lg-header">
        <span className="lg-header__badge">
          <span className="lg-header__dot" /> AO VIVO
        </span>
        <span>Placar em tempo real</span>
      </div>
      {games.length === 0 ? (
        <p className="kiosk-slide__empty">Nenhum jogo em andamento.</p>
      ) : (
        <div className={`lg ${games.length > 1 ? 'lg--two' : ''}`}>
          {games.map((game) => (
            <LiveGameCard key={game.id} game={game} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
