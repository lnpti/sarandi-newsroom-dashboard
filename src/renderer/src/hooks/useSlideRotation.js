import { useCallback, useEffect, useRef, useState } from 'react';

// Telas com várias páginas internas (ex.: Esporte) trocam de página mais
// rápido que o tempo cheio de uma tela — senão 4 páginas × 20s seriam mais de
// um minuto numa tela só.
const PAGE_SECONDS_RATIO = 0.6;

// Avança pelas telas habilitadas, em loop. Uma tela com `pagesFor(key) > 1`
// mostra cada página por PAGE_SECONDS_RATIO × secondsPerSlide e só depois
// passa pra próxima tela; as demais ficam secondsPerSlide inteiros.
// Reinicia se a lista de telas ou a duração mudarem (ex.: usuário desmarcou
// uma tela ou trocou a duração em Configurações). next()/prev() avançam pra
// outra TELA (pulando as páginas) e goToPage() escolhe a página da tela atual;
// nos dois casos a contagem automática recomeça dali.
export function useSlideRotation(slideKeys, secondsPerSlide, pagesFor = () => 1) {
  const [pos, setPos] = useState({ index: 0, page: 0 });
  const keysRef = useRef(slideKeys);
  const pagesRef = useRef(pagesFor);
  keysRef.current = slideKeys;
  pagesRef.current = pagesFor;

  const keysId = slideKeys.join('|');
  const count = slideKeys.length;
  const currentIndex = count === 0 ? 0 : pos.index % count;
  const currentPages = count === 0 ? 1 : Math.max(1, pagesFor(slideKeys[currentIndex]));

  useEffect(() => {
    setPos({ index: 0, page: 0 });
  }, [keysId]);

  useEffect(() => {
    if (count === 0) return undefined;
    // Uma tela só e sem páginas: nada a rodar.
    if (count === 1 && currentPages <= 1) return undefined;

    const seconds = Math.max(1, secondsPerSlide) * (currentPages > 1 ? PAGE_SECONDS_RATIO : 1);
    const timer = setTimeout(() => {
      setPos((p) => {
        const keys = keysRef.current;
        if (keys.length === 0) return p;
        const index = p.index % keys.length;
        const pages = Math.max(1, pagesRef.current(keys[index]));
        if (p.page + 1 < pages) return { index, page: p.page + 1 };
        return { index: (index + 1) % keys.length, page: 0 };
      });
    }, seconds * 1000);

    return () => clearTimeout(timer);
  }, [pos, secondsPerSlide, keysId, count, currentPages]);

  const next = useCallback(() => {
    setPos((p) => ({ index: (p.index + 1) % Math.max(1, keysRef.current.length), page: 0 }));
  }, []);

  const prev = useCallback(() => {
    setPos((p) => {
      const n = Math.max(1, keysRef.current.length);
      return { index: (p.index - 1 + n) % n, page: 0 };
    });
  }, []);

  // Escolha manual de página dentro da tela atual — a contagem automática
  // recomeça dali (o objeto novo de pos reinicia o timer).
  const goToPage = useCallback((page) => {
    setPos((p) => ({ index: p.index, page }));
  }, []);

  return { index: count === 0 ? -1 : currentIndex, page: pos.page, next, prev, goToPage };
}
