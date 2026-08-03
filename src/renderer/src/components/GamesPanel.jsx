function formatWhen(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoje ${time}`;
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${day} · ${time}`;
}

function GameRow({ game }) {
  return (
    <div className="game-row">
      <div className="game-row__teams">
        <span className="game-row__side">
          <span className="game-row__abbr">{game.homeAbbr}</span>
          {game.homeLogo && <img className="game-row__logo" src={game.homeLogo} alt="" />}
        </span>
        <span className="game-row__x">×</span>
        <span className="game-row__side">
          {game.awayLogo && <img className="game-row__logo" src={game.awayLogo} alt="" />}
          <span className="game-row__abbr">{game.awayAbbr}</span>
        </span>
      </div>
      <div className="game-row__meta">
        <span className="game-row__when">{formatWhen(game.date)}</span>
        {game.league && <span className="game-row__league">{game.league}</span>}
      </div>
    </div>
  );
}

function ResultRow({ game }) {
  return (
    <div className="game-row game-row--result">
      <div className="game-row__teams">
        <span className="game-row__side">
          <span className="game-row__abbr">{game.homeAbbr}</span>
          {game.homeLogo && <img className="game-row__logo" src={game.homeLogo} alt="" />}
        </span>
        <span className="game-row__score">
          {game.homeScore} × {game.awayScore}
        </span>
        <span className="game-row__side">
          {game.awayLogo && <img className="game-row__logo" src={game.awayLogo} alt="" />}
          <span className="game-row__abbr">{game.awayAbbr}</span>
        </span>
      </div>
      <div className="game-row__meta">
        <span className="game-row__when">{formatWhen(game.date)}</span>
        {game.league && <span className="game-row__league">{game.league}</span>}
      </div>
    </div>
  );
}

export default function GamesPanel({ football }) {
  const upcoming = football?.data?.upcoming;
  const lastResults = football?.data?.lastResults;
  if ((!upcoming || upcoming.length === 0) && (!lastResults || lastResults.length === 0)) return null;

  // Próximo jogo de cada time (um por time)
  const seen = new Set();
  const nextPerTeam = [];
  for (const g of upcoming || []) {
    if (seen.has(g.team)) continue;
    seen.add(g.team);
    nextPerTeam.push(g);
  }

  return (
    <div className="games-panel">
      {lastResults && lastResults.length > 0 && (
        <>
          <div className="games-panel__header">🏆 Últimos resultados</div>
          {lastResults.map((g) => (
            <ResultRow key={g.id} game={g} />
          ))}
        </>
      )}
      <div className="games-panel__header games-panel__header--upcoming">⚽ Próximos jogos</div>
      {nextPerTeam.map((g) => (
        <GameRow key={g.id} game={g} />
      ))}
    </div>
  );
}
