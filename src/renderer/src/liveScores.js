// O poller de placar roda a cada minuto; se o dado parar de chegar (sem internet,
// ESPN fora do ar) o último placar ficaria "ao vivo" pra sempre — então só vale
// enquanto for recente.
export const LIVE_FRESH_MS = 3 * 60 * 1000;

// Quanto tempo um jogo encerrado continua à vista (barra e tela) depois do apito.
export const FINISHED_KEEP_MS = 10 * 60 * 1000;

// Jogos em andamento do Brasil/times acompanhados + os que acabaram há menos de
// 10 minutos (game.finished), ou [] se o dado estiver velho.
export function getLiveGames(liveScores, now = Date.now()) {
  const fresh = liveScores?.lastUpdated && now - liveScores.lastUpdated < LIVE_FRESH_MS;
  if (!fresh) return [];
  return (liveScores?.data?.games || []).filter((g) => !g.finished || now - g.endedAt < FINISHED_KEEP_MS);
}
