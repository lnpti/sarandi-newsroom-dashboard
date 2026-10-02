// Páginas do slide de Esporte (Modo TV): em vez de empilhar jogos, tabela,
// rodada e notícias numa tela só (tudo pequeno demais na TV), o slide mostra
// uma coisa por vez, grande, e roda entre elas. Aqui fica só a lógica de dados
// — quais páginas existem e com quê — pra KioskView saber quantas são sem
// precisar renderizar o slide.

export const SPORTS_PAGE_LABELS = {
  games: 'Jogos',
  standings: 'Classificação',
  round: 'Rodada',
  news: 'Notícias',
};

const GAMES_PER_PANEL = 4;
const NEWS_TOTAL = 8; // 2 destaques + 6 cards, como nas notícias nacionais
const NEWS_TEAM_QUOTA = 4;

function dedupeById(games) {
  const seen = new Set();
  return games.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
}

// Notícias específicas dos times acompanhados primeiro (até a cota), o resto
// vem das gerais do campeonato — sem repetir a mesma matéria que apareça nos
// dois feeds.
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

export function getSportsData(football) {
  const data = football?.data || {};
  const byDate = (a, b) => new Date(a.date) - new Date(b.date);

  // Um Grenal aparece nos dois times acompanhados — dedupe por id, e agora
  // mostra todos (não só 1 por time), já que cada página tem espaço de sobra.
  const lastResults = dedupeById(data.lastResults || [])
    .sort((a, b) => byDate(b, a))
    .slice(0, GAMES_PER_PANEL);
  const upcoming = dedupeById(data.upcoming || []).sort(byDate).slice(0, GAMES_PER_PANEL);

  return {
    lastResults,
    upcoming,
    standings: data.standings || [],
    rounds: (data.rounds || []).filter((league) => league.matches?.length > 0),
    trackedAbbrs: data.trackedAbbrs || [],
    news: combineNews(data.teamNews || [], data.news || [], NEWS_TOTAL, NEWS_TEAM_QUOTA),
  };
}

// Ids das páginas que têm dado, na ordem de exibição.
export function getSportsPages(football) {
  const d = getSportsData(football);
  const pages = [];
  if (d.lastResults.length > 0 || d.upcoming.length > 0) pages.push('games');
  if (d.standings.length > 0) pages.push('standings');
  if (d.rounds.length > 0) pages.push('round');
  if (d.news.length > 0) pages.push('news');
  return pages;
}
