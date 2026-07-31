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
  return {
    nome: j.liturgia,
    cor: j.cor || null,
    data: j.data || null,
  };
}
