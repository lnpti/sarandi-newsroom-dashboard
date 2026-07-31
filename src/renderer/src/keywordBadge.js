const KEYWORDS = ['URGENTE', 'AO VIVO', 'ULTIMA HORA', 'EXCLUSIVO', 'ALERTA'];

function normalize(str) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase();
}

export function matchKeyword(title) {
  if (!title) return null;
  const normalized = normalize(title);
  return KEYWORDS.find((keyword) => normalized.includes(keyword)) || null;
}
