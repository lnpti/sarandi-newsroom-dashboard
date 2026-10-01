import { SAINT_URL } from '../config.js';

export async function fetchSaint() {
  const response = await fetch(SAINT_URL);
  if (!response.ok) {
    throw new Error(`Falha ao buscar santo do dia (HTTP ${response.status})`);
  }
  const j = await response.json();
  if (!j.liturgia) {
    throw new Error('Resposta inesperada da liturgia diária');
  }
  // Só as referências ('Lc 10,1-12'), não o texto das leituras (enorme).
  const ref = (key) => j.leituras?.[key]?.[0]?.referencia || null;
  return {
    nome: j.liturgia,
    cor: j.cor || null,
    data: j.data || null,
    leituras: {
      primeira: ref('primeiraLeitura'),
      salmo: ref('salmo'),
      segunda: ref('segundaLeitura'),
      evangelho: ref('evangelho'),
    },
  };
}
