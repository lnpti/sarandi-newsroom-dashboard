import { useEffect, useRef, useState } from 'react';
import { getLiveGames } from '../liveScores.js';

// Detecta GOL comparando o placar de cada jogo com o da leitura anterior (o
// poller roda a cada minuto) e devolve o gol mais recente por `seconds`
// segundos — usado pra interromper o rodízio com a tela do jogo.
//
// A primeira leitura de um jogo só é memorizada, nunca vira alerta (senão ligar
// o app no meio do jogo dispararia um "GOL!" falso). Placar que DIMINUI (gol
// anulado pelo VAR) também não alerta.
export function useGoalAlert(liveScores, { enabled, seconds }) {
  const [goal, setGoal] = useState(null);
  const lastScores = useRef(new Map());
  const clearTimer = useRef(null);

  useEffect(() => {
    const games = getLiveGames(liveScores);
    const seen = new Set();

    for (const game of games) {
      seen.add(game.id);
      const prev = lastScores.current.get(game.id);
      lastScores.current.set(game.id, { home: game.homeScore, away: game.awayScore });
      if (!prev || !enabled) continue;

      const side = game.homeScore > prev.home ? 'home' : game.awayScore > prev.away ? 'away' : null;
      if (!side) continue;

      setGoal({
        key: `${game.id}-${game.homeScore}-${game.awayScore}`,
        gameId: game.id,
        side,
        teamName: side === 'home' ? game.homeName : game.awayName,
      });
      clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setGoal(null), Math.max(3, seconds) * 1000);
    }

    // Jogo que terminou: esquece o placar dele.
    for (const id of [...lastScores.current.keys()]) {
      if (!seen.has(id)) lastScores.current.delete(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveScores?.lastUpdated, enabled]);

  useEffect(() => () => clearTimeout(clearTimer.current), []);

  // Desligou a opção com um alerta no ar: apaga na hora.
  useEffect(() => {
    if (!enabled) setGoal(null);
  }, [enabled]);

  return goal;
}
