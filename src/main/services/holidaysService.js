import { HOLIDAYS_URL } from '../config.js';

async function fetchYear(year) {
  const response = await fetch(`${HOLIDAYS_URL}/${year}`);
  if (!response.ok) {
    throw new Error(`Falha ao buscar feriados (HTTP ${response.status})`);
  }
  return response.json();
}

// Retorna os próximos feriados nacionais a partir de hoje. Busca o ano atual e,
// se estiver perto do fim do ano, complementa com o ano seguinte.
export async function fetchHolidays() {
  const now = new Date();
  const year = now.getFullYear();
  const todayStr = now.toISOString().slice(0, 10);

  let all = await fetchYear(year);
  if (now.getMonth() >= 9) {
    try {
      all = all.concat(await fetchYear(year + 1));
    } catch {
      // ano seguinte pode não estar disponível ainda; ignora
    }
  }

  return all
    .filter((h) => h.date >= todayStr)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 2)
    .map((h) => ({ date: h.date, name: h.name }));
}
