import { useEffect, useState } from 'react';

// O poller roda a cada minuto; se o dado parar de chegar (sem internet, ESPN
// fora do ar) o último placar ficaria "ao vivo" pra sempre — então só vale
// enquanto for recente.
const FRESH_MS = 3 * 60 * 1000;

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
      {game.clock && <span className="live-game__clock">{game.clock}</span>}
    </div>
  );
}

// Placar ao vivo na barra inferior: só aparece com jogo EM ANDAMENTO do Brasil
// ou dos times acompanhados; sem jogo (ou dado velho) não ocupa espaço.
export default function LiveScoreTicker({ liveScores }) {
  const now = useNow(30000);
  const games = liveScores?.data?.games || [];
  const fresh = liveScores?.lastUpdated && now - liveScores.lastUpdated < FRESH_MS;
  if (!fresh || games.length === 0) return null;

  return (
    <div className="live-ticker" title="Placar ao vivo">
      <span className="live-ticker__badge">
        <span className="live-ticker__dot" /> AO VIVO
      </span>
      {games.slice(0, 2).map((game) => (
        <LiveGame key={game.id} game={game} compact={games.length > 1} />
      ))}
    </div>
  );
}
