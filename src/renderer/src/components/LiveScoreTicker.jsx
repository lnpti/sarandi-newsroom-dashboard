import { useEffect, useState } from 'react';
import { getLiveGames } from '../liveScores.js';

function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// Com 2 jogos ao mesmo tempo a barra não comporta os nomes por extenso — usa a
// sigla (INT, GRE, BRA...) em vez de espremer ou rolar a barra.
function Team({ name, abbr, logo, compact }) {
  return (
    <span className="live-team">
      {logo && <img className="live-team__logo" src={logo} alt="" />}
      <span className="live-team__name">{compact ? abbr || name : name || abbr}</span>
    </span>
  );
}

function LiveGame({ game, compact }) {
  return (
    <div className="live-game">
      <Team name={game.homeName} abbr={game.homeAbbr} logo={game.homeLogo} compact={compact} />
      <span className="live-game__score">
        {game.homeScore}
        <span className="live-game__x">×</span>
        {game.awayScore}
      </span>
      <Team name={game.awayName} abbr={game.awayAbbr} logo={game.awayLogo} compact={compact} />
      {game.clock && <span className="live-game__clock">{game.finished ? 'Fim' : game.clock}</span>}
    </div>
  );
}

// Placar ao vivo na barra inferior: só aparece com jogo EM ANDAMENTO do Brasil
// ou dos times acompanhados; sem jogo (ou dado velho) não ocupa espaço.
export default function LiveScoreTicker({ liveScores }) {
  const now = useNow(30000);
  const games = getLiveGames(liveScores, now);
  if (games.length === 0) return null;

  const shown = games.slice(0, 2);
  const multi = shown.length > 1;
  // Só encerrados: o selo vira "ENCERRADO" (sem o ponto pulsante) e a caixa fica neutra.
  const allEnded = shown.every((g) => g.finished);

  return (
    <div
      className={`live-ticker ${multi ? 'live-ticker--multi' : ''} ${allEnded ? 'live-ticker--ended' : ''}`}
      title={allEnded ? 'Jogo encerrado' : 'Placar ao vivo'}
    >
      <span className="live-ticker__badge">
        {!allEnded && <span className="live-ticker__dot" />} {allEnded ? 'ENCERRADO' : 'AO VIVO'}
      </span>
      {/* 2 jogos ficam empilhados (uma linha cada) pra caber na altura/largura da barra */}
      <div className="live-ticker__games">
        {shown.map((game) => (
          <LiveGame key={game.id} game={game} compact={multi} />
        ))}
      </div>
    </div>
  );
}
