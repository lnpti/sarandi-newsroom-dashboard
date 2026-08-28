import { LOTTERY_SOURCES } from '../config.js';

// A Federal não sorteia "dezenas" (números de 2 dígitos) como as outras — são
// 5 bilhetes de 6 dígitos, um por colocação (1º ao 5º prêmio), cada um com um
// valor de prêmio fixo. Não "acumula" no sentido das outras loterias, então
// tem um formato de retorno próprio (`tickets`) em vez de reaproveitar
// `dezenas`/`acumulou`/`ganhadores`.
function mapFederal(j) {
  const premiacoes = j.premiacoes || [];
  const tickets = (j.dezenas || j.dezenasOrdemSorteio || []).map((numero, i) => ({
    posicao: i + 1,
    numero,
    premio: premiacoes.find((p) => p.faixa === i + 1)?.valorPremio ?? null,
  }));
  return {
    key: 'federal',
    label: 'Federal',
    concurso: j.concurso,
    data: j.data,
    tickets,
  };
}

async function fetchOne(source) {
  const response = await fetch(source.primary);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const j = await response.json();

  if (source.key === 'federal') return mapFederal(j);

  const faixa1 = Array.isArray(j.premiacoes)
    ? j.premiacoes.find((p) => p.faixa === 1)
    : j.premiacoes;
  return {
    key: source.key,
    label: source.label,
    concurso: j.concurso,
    data: j.data,
    dezenas: j.dezenas || j.dezenasOrdemSorteio || [],
    acumulou: !!j.acumulou,
    ganhadores: faixa1?.ganhadores ?? null,
    estimativaProximo: j.valorEstimadoProximoConcurso || null,
    dataProximo: j.dataProximoConcurso || null,
  };
}

export async function fetchLottery() {
  const results = await Promise.allSettled(LOTTERY_SOURCES.map((s) => fetchOne(s)));
  const data = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (data.length === 0) {
    throw new Error(results[0]?.reason?.message || 'Falha ao buscar loterias');
  }
  return data;
}
