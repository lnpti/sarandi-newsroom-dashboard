import { useCallback, useEffect, useRef, useState } from 'react';

// Avança um índice de 0 a slideKeys.length-1 a cada secondsPerSlide, em loop.
// Reinicia o timer se a lista de telas ou a duração mudarem (ex.: usuário
// desmarcou uma tela ou trocou a duração em Configurações), e também expõe
// next()/prev() pra avanço manual — que reinicia a contagem automática a
// partir da tela escolhida, em vez de já pular de novo logo em seguida.
export function useSlideRotation(slideKeys, secondsPerSlide) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const countRef = useRef(0);

  const restartTimer = useCallback(() => {
    clearInterval(timerRef.current);
    countRef.current = slideKeys.length;
    if (countRef.current <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % countRef.current);
    }, Math.max(1, secondsPerSlide) * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKeys.join('|'), secondsPerSlide]);

  useEffect(() => {
    setIndex(0);
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, [restartTimer]);

  function next() {
    if (countRef.current === 0) return;
    setIndex((i) => (i + 1) % countRef.current);
    restartTimer();
  }

  function prev() {
    if (countRef.current === 0) return;
    setIndex((i) => (i - 1 + countRef.current) % countRef.current);
    restartTimer();
  }

  return { index: slideKeys.length === 0 ? -1 : index % slideKeys.length, next, prev };
}
