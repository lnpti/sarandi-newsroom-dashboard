import FeaturedStoriesRow from './FeaturedStoriesRow.jsx';
import TopStoriesRow from './TopStoriesRow.jsx';
import { SPORTS_PAGE_LABELS, getSportsData, getSportsPages } from '../sportsPages.js';
import { dayLabel, timeLabel } from '../sportsFormat.js';

// Quantas linhas da tabela de classificação aparecem (o resto some, mas os
// times acompanhados são sempre mostrados, mesmo fora do topo).
const STANDINGS_TOP = 8;

function toSportsStory(item) {
  return {
    id: item.id,
    image: item.image,
    title: item.title,
    link: item.link,
    badge: <span className="news-card__category">ESPN</span>,
  };
}

function Side({ name, abbr, logo, align }) {
  return (
    <div className={`sp-side sp-side--${align}`}>
      {logo ? <img className="sp-side__logo" src={logo} alt="" /> : <span className="sp-side__logo sp-side__logo--empty" />}
      <span className="sp-side__name">{name || abbr}</span>
    </div>
  );
}

function Game({ game, showLeague = true }) {
  const hasScore = (game.completed || game.live) && game.homeScore != null && game.awayScore != null;
  return (
    <div className={`sp-game ${game.live ? 'sw-game--live' : ''}`}>
      <div className="sp-game__meta">
        <span className="sp-game__league">{showLeague ? game.league : ''}</span>
        {game.live ? (
          <span className="sw-game__live">
            <span className="sw-game__live-dot" /> AO VIVO{game.clock ? ` · ${game.clock}` : ''}
          </span>
        ) : (
          <span>
            {game.completed ? 'Encerrado · ' : ''}
            {dayLabel(game.date)}
          </span>
        )}
      </div>
      <div className="sp-game__row">
        <Side name={game.homeName} abbr={game.homeAbbr} logo={game.homeLogo} align="home" />
        <div className="sp-game__center">
          {hasScore ? (
            <span className="sp-game__score">
              {game.homeScore}
              <span className="sp-game__score-x">×</span>
              {game.awayScore}
            </span>
          ) : (
            <span className="sp-game__time">{timeLabel(game.date)}</span>
          )}
        </div>
        <Side name={game.awayName} abbr={game.awayAbbr} logo={game.awayLogo} align="away" />
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="sp-panel">
      <h3 className="sp-panel__title">{title}</h3>
      {children}
    </section>
  );
}

function GamesPage({ lastResults, upcoming }) {
  const panels = [
    { title: '🏆 Últimos resultados', games: lastResults },
    { title: '🗓️ Próximos jogos', games: upcoming },
  ].filter((p) => p.games.length > 0);

  return (
    <div className={`sp-grid ${panels.length === 1 ? 'sp-grid--single' : ''}`}>
      {panels.map((p) => (
        <Panel key={p.title} title={p.title}>
          <div className="sp-list sp-list--xl">
            {p.games.map((g) => (
              <Game key={g.id} game={g} />
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// Topo da tabela e, se os times acompanhados ficarem de fora, as linhas deles
// logo depois de um separador — em vez de listar a tabela inteira.
function compactTable(table, trackedAbbrs) {
  const top = table.slice(0, STANDINGS_TOP);
  const topAbbrs = new Set(top.map((r) => r.teamAbbr));
  const tracked = table.filter((r) => trackedAbbrs.includes(r.teamAbbr) && !topAbbrs.has(r.teamAbbr));
  return { top, tracked };
}

function StandingsRow({ row, tracked }) {
  const sg = row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff;
  return (
    <div className={`sp-row ${tracked ? 'sp-row--tracked' : ''}`}>
      <span className="sp-row__rank">{row.rank}º</span>
      {row.teamLogo ? <img className="sp-row__logo" src={row.teamLogo} alt="" /> : <span className="sp-row__logo" />}
      <span className="sp-row__team">{row.teamName || row.teamAbbr}</span>
      <span className="sp-row__stats">
        {row.played}J · {row.wins}V {row.draws}E {row.losses}D · SG {sg}
      </span>
      <span className="sp-row__points">{row.points}</span>
    </div>
  );
}

function StandingsPage({ standings: allStandings, trackedAbbrs }) {
  const standings = allStandings.slice(0, 2);
  return (
    <div className={`sp-grid ${standings.length === 1 ? 'sp-grid--single' : ''}`}>
      {standings.map((league) => {
        const { top, tracked } = compactTable(league.table, trackedAbbrs);
        return (
          <Panel key={league.slug} title={`📊 ${league.name}`}>
            <div className="sp-table">
              {top.map((row) => (
                <StandingsRow key={row.teamAbbr} row={row} tracked={trackedAbbrs.includes(row.teamAbbr)} />
              ))}
              {tracked.length > 0 && <div className="sp-table__divider">···</div>}
              {tracked.map((row) => (
                <StandingsRow key={row.teamAbbr} row={row} tracked />
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

// Até 5 jogos cabem numa coluna só; passando disso (rodada cheia do Brasileirão
// = 10), vira 2 colunas e os cartões diminuem um pouco.
const ROUND_SINGLE_COLUMN_MAX = 5;

function RoundPage({ rounds: allRounds }) {
  // 2 painéis lado a lado no máximo, e cada um com o que cabe numa coluna.
  const rounds = allRounds.slice(0, 2);
  return (
    <div className={`sp-grid ${rounds.length === 1 ? 'sp-grid--single sp-grid--wide' : ''}`}>
      {rounds.map((league) => {
        const wide = rounds.length === 1 && league.matches.length > ROUND_SINGLE_COLUMN_MAX;
        const size = wide ? 'sm' : rounds.length === 1 ? 'lg' : 'md';
        return (
          <Panel key={league.slug} title={`🗓️ Rodada — ${league.name}`}>
            <div className={`sp-list sp-list--${size} ${wide ? 'sp-list--two' : ''}`}>
              {(rounds.length === 1 ? league.matches : league.matches.slice(0, ROUND_SINGLE_COLUMN_MAX)).map((g) => (
                <Game key={g.id} game={g} showLeague={false} />
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

export default function KioskSportsSlide({ football, page = 0, onSelectPage }) {
  const pages = getSportsPages(football);
  const current = pages.length > 0 ? pages[page % pages.length] : null;
  const data = getSportsData(football);
  const stories = data.news.map(toSportsStory);

  const header = (
    <div className="kiosk-slide__header sp-header">
      <span>⚽ Esporte</span>
      {pages.length > 1 && (
        <div className="sp-tabs">
          {pages.map((id, i) => (
            <button
              key={id}
              type="button"
              className={`sp-tab ${id === current ? 'sp-tab--active' : ''}`}
              onClick={() => onSelectPage?.(i)}
            >
              {SPORTS_PAGE_LABELS[id]}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // A página de notícias reaproveita o layout das notícias nacionais
  // (2 destaques + 6 cards), que já tem todo o CSS de TV.
  if (current === 'news') {
    return (
      <div key="news" className="kiosk-slide kiosk-slide--news">
        {header}
        <div className="kiosk-slide__body">
          <FeaturedStoriesRow items={stories.slice(0, 2)} />
          <TopStoriesRow items={stories.slice(2, 8)} pageSize={6} autoRotate={false} />
        </div>
      </div>
    );
  }

  return (
    <div key={current || 'empty'} className="kiosk-slide kiosk-slide--sports">
      {header}
      <div className="kiosk-slide__body sp-body">
        {current === 'games' && <GamesPage lastResults={data.lastResults} upcoming={data.upcoming} />}
        {current === 'standings' && <StandingsPage standings={data.standings} trackedAbbrs={data.trackedAbbrs} />}
        {current === 'round' && <RoundPage rounds={data.rounds} />}
        {current === null && <p className="kiosk-slide__empty">Sem dados de esporte no momento.</p>}
      </div>
    </div>
  );
}
