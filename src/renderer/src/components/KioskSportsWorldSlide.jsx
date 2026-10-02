import { dayLabel, timeLabel } from '../sportsFormat.js';

function Side({ name, abbr, logo, align }) {
  return (
    <div className={`sw-side sw-side--${align}`}>
      {logo ? <img className="sw-side__logo" src={logo} alt="" /> : <span className="sw-side__logo sw-side__logo--empty" />}
      <span className="sw-side__name">{name || abbr}</span>
    </div>
  );
}

function GameCard({ game }) {
  const hasScore = (game.completed || game.live) && game.homeScore != null && game.awayScore != null;
  return (
    <div className={`sw-game ${game.live ? 'sw-game--live' : ''}`}>
      <div className="sw-game__meta">
        <span className="sw-game__league">{game.league}</span>
        {game.live ? (
          <span className="sw-game__live">
            <span className="sw-game__live-dot" /> AO VIVO{game.clock ? ` · ${game.clock}` : ''}
          </span>
        ) : (
          <span className="sw-game__when">
            {game.completed ? 'Encerrado · ' : ''}
            {dayLabel(game.date)}
          </span>
        )}
      </div>
      <div className="sw-game__row">
        <Side name={game.homeName} abbr={game.homeAbbr} logo={game.homeLogo} align="home" />
        <div className="sw-game__center">
          {hasScore ? (
            <span className="sw-game__score">
              {game.homeScore}
              <span className="sw-game__score-x">×</span>
              {game.awayScore}
            </span>
          ) : (
            <span className="sw-game__time">{timeLabel(game.date)}</span>
          )}
        </div>
        <Side name={game.awayName} abbr={game.awayAbbr} logo={game.awayLogo} align="away" />
      </div>
    </div>
  );
}

// Mais de 8 jogos não cabem em fila única na altura da TV — vira 2 colunas.
const SINGLE_COLUMN_MAX = 8;

// Jogos por painel — poucos e grandes, pra ler de longe na TV.
const GAMES_PER_PANEL = 7;

function Panel({ title, icon, games, emptyText }) {
  const twoCols = games.length > SINGLE_COLUMN_MAX;
  return (
    <section className="sw-panel">
      <h3 className="sw-panel__title">
        <span className="sw-panel__icon">{icon}</span> {title}
      </h3>
      {games.length === 0 ? (
        <p className="sw-panel__empty">{emptyText}</p>
      ) : (
        <div className={`sw-panel__list ${twoCols ? 'sw-panel__list--wide' : ''}`}>
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function KioskSportsWorldSlide({ football }) {
  // Seleções: encerrados primeiro, depois os demais — cada grupo por data e hora.
  // (O serviço escolhe os jogos por prioridade — Brasil primeiro; a ordem de
  // exibição é decidida aqui.)
  const national = (football?.data?.nationalGames || []).slice(0, GAMES_PER_PANEL).sort(
    (a, b) => Number(!!b.completed) - Number(!!a.completed) || new Date(a.date) - new Date(b.date)
  );
  // Poucos jogos por painel (cartões maiores na TV) — o corte também vale pra dados
  // antigos em cache, de quando o serviço mandava mais.
  const others = (football?.data?.otherGames || []).slice(0, GAMES_PER_PANEL);

  // Sem jogo de seleção (ou sem jogo de outros campeonatos), o painel que tem
  // dados ocupa a tela inteira em 2 colunas, em vez de deixar metade vazia.
  const onlyOthers = national.length === 0 && others.length > 0;
  const onlyNational = others.length === 0 && national.length > 0;

  return (
    <div className="kiosk-slide kiosk-slide--sportsworld">
      <div className="kiosk-slide__header">
        🌍 Esporte · {onlyOthers ? 'Outros campeonatos' : onlyNational ? 'Seleções' : 'Seleções e outros campeonatos'}
      </div>
      <div className={`sw ${onlyOthers || onlyNational ? 'sw--single' : ''}`}>
        {!onlyOthers && (
          <Panel
            title="Seleções"
            icon="🏳️"
            games={national}
            emptyText="Nenhum jogo de seleções nos próximos dias."
          />
        )}
        {!onlyNational && (
          <Panel
            title="Outros campeonatos"
            icon="🏆"
            games={others}
            emptyText="Nenhum jogo de outros campeonatos nos próximos dias."
          />
        )}
      </div>
    </div>
  );
}
