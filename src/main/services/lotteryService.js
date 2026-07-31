import { LOTTERY_SOURCES } from '../config.js';

async function fetchOne(source) {
  const response = await fetch(source.primary);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const j = await response.json();
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
