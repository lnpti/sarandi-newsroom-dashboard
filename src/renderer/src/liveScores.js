// O poller de placar roda a cada minuto; se o dado parar de chegar (sem internet,
// ESPN fora do ar) o último placar ficaria "ao vivo" pra sempre — então só vale
// enquanto for recente.
export const LIVE_FRESH_MS = 3 * 60 * 1000;

// Jogos em andamento do Brasil/times acompanhados, ou [] se o dado estiver velho.
export function getLiveGames(liveScores, now = Date.now()) {
  const fresh = liveScores?.lastUpdated && now - liveScores.lastUpdated < LIVE_FRESH_MS;
  return fresh ? liveScores?.data?.games || [] : [];
}
