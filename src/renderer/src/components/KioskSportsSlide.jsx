import TopStoriesRow from './TopStoriesRow.jsx';

// Quantos jogos de rodada mostrar por campeonato — precisa caber na tela sem
// rolar (é uma TV sem ninguém mexendo), então corta em vez de listar tudo.
const ROUND_MATCHES_LIMIT = 6;

function toSportsStory(item) {
  return {
    id: item.id,
    image: item.image,
    title: item.title,
    link: item.link,
    badge: <span className="news-card__category">ESPN</span>,
  };
}

// Mistura notícias específicas dos times acompanhados com notícias gerais do
// campeonato num só card de 6 — até 3 de cada, mas se um lado tiver menos
// (o filtro por time nem sempre acha o suficiente no dia), o outro lado
// preenche o resto, sem duplicar (a mesma matéria pode vir nos dois feeds).
function combineNews(teamNews, generalNews, total, teamQuota) {
  const seen = new Set();
  const result = [];

  for (const item of teamNews) {
    if (result.length >= teamQuota) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  for (const item of generalNews) {
    if (result.length >= total) break;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

function formatWhen(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoje ${time}`;
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${day} · ${time}`;
}

function TeamSide({ abbr, logo }) {
  return (
    <span className="kiosk-game-row__side">
      {logo && <img className="kiosk-game-row__logo" src={logo} alt="" />}
      <span className="kiosk-game-row__abbr">{abbr}</span>
    </span>
  );
}

function ResultRow({ game }) {
  return (
    <div className="kiosk-game-row">
      <TeamSide abbr={game.homeAbbr} logo={game.homeLogo} />
      <span className="kiosk-game-row__score">
        {game.homeScore} × {game.awayScore}
      </span>
      <TeamSide abbr={game.awayAbbr} logo={game.awayLogo} />
      <span className="kiosk-game-row__when">{formatWhen(game.date)}</span>
    </div>
  );
}

function UpcomingRow({ game }) {
  return (
    <div className="kiosk-game-row">
      <TeamSide abbr={game.homeAbbr} logo={game.homeLogo} />
      <span className="kiosk-game-row__x">×</span>
      <TeamSide abbr={game.awayAbbr} logo={game.awayLogo} />
      <span className="kiosk-game-row__when">
        {game.league && <span className="kiosk-game-row__league">{game.league}</span>}
        {formatWhen(game.date)}
      </span>
    </div>
  );
}

// Tabela completa é demais pra uma tela de rodízio — mostra o topo (6) e, se
// os times acompanhados não estiverem lá, mostra as linhas deles também com
// um separador, em vez da tabela inteira.
function compactTable(table, trackedAbbrs) {
  const top = table.slice(0, 6);
  const topAbbrs = new Set(top.map((r) => r.teamAbbr));
  const tracked = table.filter((r) => trackedAbbrs.includes(r.teamAbbr) && !topAbbrs.has(r.teamAbbr));
  return { top, tracked };
}

function StandingsRow({ row, tracked }) {
  return (
    <div className={`kiosk-standings-row ${tracked ? 'kiosk-standings-row--tracked' : ''}`}>
      <span className="kiosk-standings-row__rank">{row.rank}º</span>
      {row.teamLogo && <img className="kiosk-standings-row__logo" src={row.teamLogo} alt="" />}
      <span className="kiosk-standings-row__team">{row.teamAbbr}</span>
      <span className="kiosk-standings-row__stats">
        {row.played}J · {row.wins}V {row.draws}E {row.losses}D · SG {row.goalDiff > 0 ? '+' : ''}
        {row.goalDiff}
      </span>
      <span className="kiosk-standings-row__points">{row.points}</span>
    </div>
  );
}

export default function KioskSportsSlide({ football }) {
  const upcoming = football?.data?.upcoming || [];
  const lastResults = football?.data?.lastResults || [];
  const standings = football?.data?.standings || [];
  const rounds = football?.data?.rounds || [];
  const trackedAbbrs = football?.data?.trackedAbbrs || [];
  const news = football?.data?.news || [];
  const teamNews = football?.data?.teamNews || [];

  const seen = new Set();
  const nextPerTeam = upcoming.filter((g) => (seen.has(g.team) ? false : (seen.add(g.team), true)));

  const sportsNews = combineNews(teamNews, news, 6, 3).map(toSportsStory);

  return (
    <div className="kiosk-slide kiosk-slide--sports">
      <div className="kiosk-slide__header">⚽ Esporte</div>
      <div className="kiosk-slide__body kiosk-sports-body">
        <div className="kiosk-sports">
          <div className="kiosk-sports__col">
            {lastResults.length > 0 && (
              <div className="kiosk-sports__group">
                <div className="kiosk-sports__group-title">🏆 Últimos resultados</div>
                {lastResults.map((g) => (
                  <ResultRow key={g.id} game={g} />
                ))}
              </div>
            )}
            <div className="kiosk-sports__group">
              <div className="kiosk-sports__group-title">Próximos jogos</div>
              {nextPerTeam.map((g) => (
                <UpcomingRow key={g.id} game={g} />
              ))}
            </div>
          </div>

          <div className="kiosk-sports__col">
            {standings.map((league) => {
              const { top, tracked } = compactTable(league.table, trackedAbbrs);
              return (
                <div className="kiosk-sports__group" key={`standings-${league.slug}`}>
                  <div className="kiosk-sports__group-title">📊 {league.name}</div>
                  <div className="kiosk-standings">
                    {top.map((row) => (
                      <StandingsRow key={row.teamAbbr} row={row} tracked={trackedAbbrs.includes(row.teamAbbr)} />
                    ))}
                    {tracked.length > 0 && <div className="kiosk-standings__divider">···</div>}
                    {tracked.map((row) => (
                      <StandingsRow key={row.teamAbbr} row={row} tracked />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="kiosk-sports__col">
            {rounds.map((league) => (
              <div className="kiosk-sports__group" key={`round-${league.slug}`}>
                <div className="kiosk-sports__group-title">🗓️ Rodada — {league.name}</div>
                {league.matches.slice(0, ROUND_MATCHES_LIMIT).map((g) => (
                  <div className="kiosk-game-row kiosk-game-row--compact" key={g.id}>
                    <TeamSide abbr={g.homeAbbr} logo={g.homeLogo} />
                    {g.completed ? (
                      <span className="kiosk-game-row__score">
                        {g.homeScore} × {g.awayScore}
                      </span>
                    ) : (
                      <span className="kiosk-game-row__x">×</span>
                    )}
                    <TeamSide abbr={g.awayAbbr} logo={g.awayLogo} />
                    <span className="kiosk-game-row__when">{formatWhen(g.date)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {sportsNews.length > 0 && (
          <div className="kiosk-sports__news">
            <div className="kiosk-sports__group-title">📰 Notícias de Esporte</div>
            <TopStoriesRow items={sportsNews} pageSize={6} autoRotate={false} />
          </div>
        )}
      </div>
    </div>
  );
}
