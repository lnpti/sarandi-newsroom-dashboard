import { useCallback, useEffect, useRef, useState } from 'react';

// Telas com várias páginas internas (ex.: Esporte) trocam de página mais
// rápido que o tempo cheio de uma tela — senão 4 páginas × 20s seriam mais de
// um minuto numa tela só.
const PAGE_SECONDS_RATIO = 0.6;

// Avança pelas telas habilitadas, em loop. Uma tela com `pagesFor(key) > 1`
// mostra cada página por PAGE_SECONDS_RATIO × secondsPerSlide e só depois
// passa pra próxima tela; as demais ficam secondsPerSlide inteiros.
//
// A posição é guardada pela CHAVE da tela (não pelo índice): a lista muda no
// meio do jogo (a tela de jogo ao vivo entra e sai do rodízio) e o rodízio
// continua de onde estava em vez de voltar pra primeira tela. As chaves da
// lista precisam ser únicas.
//
// next()/prev() avançam pra outra TELA (pulando as páginas) e goToPage()
// escolhe a página da tela atual; nos dois casos a contagem automática
// recomeça dali.
export function useSlideRotation(slideKeys, secondsPerSlide, pagesFor = () => 1) {
  const [pos, setPos] = useState({ key: slideKeys[0] ?? null, page: 0 });
  const keysRef = useRef(slideKeys);
  const pagesRef = useRef(pagesFor);
  keysRef.current = slideKeys;
  pagesRef.current = pagesFor;

  const keysId = slideKeys.join('|');
  const count = slideKeys.length;
  const found = slideKeys.indexOf(pos.key);
  // Tela atual sumiu da lista (ex.: o jogo acabou e a tela ao vivo saiu): cai
  // pra primeira em vez de ficar sem nada.
  const currentIndex = found >= 0 ? found : 0;
  const page = found >= 0 ? pos.page : 0;
  const currentPages = count === 0 ? 1 : Math.max(1, pagesFor(slideKeys[currentIndex]));

  useEffect(() => {
    if (count === 0) return undefined;
    // Uma tela só e sem páginas: nada a rodar.
    if (count === 1 && currentPages <= 1) return undefined;

    const seconds = Math.max(1, secondsPerSlide) * (currentPages > 1 ? PAGE_SECONDS_RATIO : 1);
    const timer = setTimeout(() => {
      setPos((p) => {
        const keys = keysRef.current;
        if (keys.length === 0) return p;
        const idx = keys.indexOf(p.key);
        if (idx < 0) return { key: keys[0], page: 0 };
        const pages = Math.max(1, pagesRef.current(keys[idx]));
        if (p.page + 1 < pages) return { key: p.key, page: p.page + 1 };
        return { key: keys[(idx + 1) % keys.length], page: 0 };
      });
    }, seconds * 1000);

    return () => clearTimeout(timer);
  }, [pos, secondsPerSlide, keysId, count, currentPages]);

  const step = useCallback((delta) => {
    setPos((p) => {
      const keys = keysRef.current;
      if (keys.length === 0) return p;
      const idx = Math.max(0, keys.indexOf(p.key));
      return { key: keys[(idx + delta + keys.length) % keys.length], page: 0 };
    });
  }, []);

  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  // Escolha manual de página dentro da tela atual — a contagem automática
  // recomeça dali (o objeto novo de pos reinicia o timer).
  const goToPage = useCallback((newPage) => {
    setPos((p) => {
      const keys = keysRef.current;
      const key = keys.includes(p.key) ? p.key : keys[0];
      return { key, page: newPage };
    });
  }, []);

  return { index: count === 0 ? -1 : currentIndex, page, next, prev, goToPage };
}
