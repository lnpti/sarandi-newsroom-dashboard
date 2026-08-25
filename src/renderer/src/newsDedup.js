// Palavras comuns demais pra ajudar a identificar se duas manchetes são a
// mesma notícia — sem isso, títulos diferentes sobre assuntos diferentes
// podem parecer duplicados só por compartilharem conectivos.
const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'e', 'ou', 'que', 'com', 'para', 'por', 'sem', 'sobre',
  'apos', 'antes', 'mais', 'menos', 'ja', 'ainda', 'como', 'se', 'sua', 'seu', 'suas',
  'seus', 'ao', 'aos', 'foi', 'ser', 'tem', 'vai', 'vao', 'diz', 'entre', 'ate',
]);

function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Coeficiente de sobreposição (comum / menor conjunto) em vez de Jaccard —
// mais tolerante quando um portal escreve um título bem mais longo/curto que
// outro pra mesma notícia.
function overlap(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let common = 0;
  for (const t of setA) if (setB.has(t)) common++;
  return common / Math.min(setA.size, setB.size);
}

const SIMILARITY_THRESHOLD = 0.6;

// Remove manchetes quase idênticas vindas de portais diferentes (mesma
// notícia de agência, cada portal reescreve o título do seu jeito). A lista
// já costuma vir ordenada por data — mantém a primeira ocorrência de cada
// grupo (a mais recente) e descarta o resto.
export function dedupeSimilarTitles(items) {
  const kept = [];
  const keptTokens = [];
  for (const item of items) {
    const tokens = normalizeTitle(item.title);
    const isDuplicate = keptTokens.some((seen) => overlap(tokens, seen) >= SIMILARITY_THRESHOLD);
    if (isDuplicate) continue;
    kept.push(item);
    keptTokens.push(tokens);
  }
  return kept;
}
