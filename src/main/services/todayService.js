// "O que é hoje": efemérides, aniversariantes e datas comemorativas do dia, da
// Wikipédia em português (API pública, sem chave — só pede User-Agent).
const BASE = 'https://pt.wikipedia.org/api/rest_v1/feed/onthisday/all';
const HEADERS = { 'User-Agent': 'PlayNews/1.0 (radio newsroom dashboard)' };

const EVENTS_SHOWN = 3;
const BIRTHS_SHOWN = 3;
const COMMEMORATIVE_SHOWN = 5;
const TEXT_MAX = 140;

function shorten(text) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= TEXT_MAX) return clean;
  const cut = clean.slice(0, TEXT_MAX);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 60 ? cut.lastIndexOf(' ') : TEXT_MAX)}…`;
}

// n itens espalhados pela lista inteira (do mais antigo ao mais recente), em
// vez dos n primeiros — dá mais variedade de época no mesmo espaço.
function spread(list, n) {
  if (n <= 0) return [];
  if (list.length <= n) return list;
  if (n === 1) return [list[0]];
  const picked = [];
  for (let i = 0; i < n; i++) picked.push(list[Math.round((i * (list.length - 1)) / (n - 1))]);
  return [...new Set(picked)];
}

const byYearDesc = (a, b) => (b.year ?? 0) - (a.year ?? 0);

function mapEntry(e) {
  return { year: e.year ?? null, text: shorten(e.text) };
}

// Datas comemorativas de verdade ("Dia Internacional da Música"); a lista da
// Wikipédia mistura aniversários de município e nomes de santos.
function commemorative(holidays) {
  const seen = new Set();
  return (holidays || [])
    .map((h) => (h.text || '').trim())
    .filter((t) => /^(Dia|Semana|Mês|Noite|Festa|Festival)\b/i.test(t) && !/aniversário/i.test(t))
    .filter((t) => (seen.has(t) ? false : (seen.add(t), true)))
    .slice(0, COMMEMORATIVE_SHOWN);
}

export async function fetchToday() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const response = await fetch(`${BASE}/${mm}/${dd}`, { headers: HEADERS });
  if (!response.ok) throw new Error(`Falha ao buscar efemérides (HTTP ${response.status})`);
  const j = await response.json();

  const events = spread([...(j.events || [])].sort(byYearDesc), EVENTS_SHOWN).map(mapEntry);

  // Brasileiros primeiro (público da rádio), depois completa com os demais.
  const births = [...(j.births || [])].sort(byYearDesc);
  const brazilians = births.filter((b) => /brasileir/i.test(b.text || '')).slice(0, 3);
  const others = spread(births.filter((b) => !brazilians.includes(b)), BIRTHS_SHOWN - brazilians.length);
  const bornToday = [...brazilians, ...others].sort(byYearDesc).slice(0, BIRTHS_SHOWN).map(mapEntry);

  return {
    commemorative: commemorative(j.holidays),
    events,
    births: bornToday,
  };
}
