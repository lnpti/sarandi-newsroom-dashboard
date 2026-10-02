import { useSlideRotation } from '../hooks/useSlideRotation.js';
import KioskPortalNewsSlide from './KioskPortalNewsSlide.jsx';
import KioskNationalNewsSlide from './KioskNationalNewsSlide.jsx';
import KioskRegionalNewsSlide from './KioskRegionalNewsSlide.jsx';
import KioskWeatherSlide from './KioskWeatherSlide.jsx';
import KioskSportsSlide from './KioskSportsSlide.jsx';
import KioskSportsWorldSlide from './KioskSportsWorldSlide.jsx';
import KioskDailyInfoSlide from './KioskDailyInfoSlide.jsx';
import KioskCurrencySlide from './KioskCurrencySlide.jsx';
import KioskAgroSlide from './KioskAgroSlide.jsx';
import KioskCalendarSlide from './KioskCalendarSlide.jsx';
import KioskYoutubeSlide from './KioskYoutubeSlide.jsx';
import { getSportsPages } from '../sportsPages.js';

// Cada tela recebe só a fatia do snapshot que já existe pro modo normal —
// nenhum dado novo, nenhum poller novo.
const SLIDES = {
  radioNews: { Component: KioskPortalNewsSlide, props: ['radioNews'] },
  externalNews: { Component: KioskNationalNewsSlide, props: ['externalNews'] },
  regionalNews: { Component: KioskRegionalNewsSlide, props: ['regionalNews'] },
  weather: { Component: KioskWeatherSlide, props: ['weather'] },
  // `pages`: quantas páginas internas a tela tem com os dados de agora — o
  // rodízio mostra cada uma antes de passar pra próxima tela.
  football: { Component: KioskSportsSlide, props: ['football'], pages: (p) => getSportsPages(p.football).length },
  footballWorld: { Component: KioskSportsWorldSlide, props: ['football'] },
  dailyInfo: { Component: KioskDailyInfoSlide, props: ['lottery', 'holidays', 'saint', 'today'] },
  currency: { Component: KioskCurrencySlide, props: ['currency'] },
  agro: { Component: KioskAgroSlide, props: ['agro'] },
  calendar: { Component: KioskCalendarSlide, props: ['calendar'] },
  youtube: { Component: KioskYoutubeSlide, props: ['youtube'] },
};

export const KIOSK_SLIDE_LABELS = {
  radioNews: 'Portal da rádio',
  externalNews: 'Notícias nacionais',
  regionalNews: 'Notícias regionais',
  weather: 'Clima',
  football: 'Esporte',
  footballWorld: 'Esporte: seleções e outros campeonatos',
  dailyInfo: 'Painel do dia (santo, loterias, feriados, efemérides)',
  currency: 'Cotações',
  agro: 'Mercado agrícola (RS)',
  calendar: 'Flashs agendados',
  youtube: 'Vídeos do YouTube',
};

export default function KioskView({ snapshot, kiosk }) {
  const enabledKeys = (kiosk.kioskEnabledSlides || []).filter((key) => SLIDES[key]);
  const { index: activeIndex, page, next, prev, goToPage } = useSlideRotation(
    enabledKeys,
    kiosk.kioskSecondsPerSlide || 20,
    (slideKey) => SLIDES[slideKey]?.pages?.(snapshot) ?? 1
  );

  if (enabledKeys.length === 0) {
    return (
      <div className="kiosk-view kiosk-view--empty">
        <p>Nenhuma tela habilitada — escolha pelo menos uma em Configurações → Modo TV.</p>
      </div>
    );
  }

  const key = enabledKeys[activeIndex];
  const { Component, props } = SLIDES[key];
  const slideProps = Object.fromEntries(props.map((p) => [p, snapshot[p]]));

  return (
    <div className="kiosk-view">
      <Component key={key} {...slideProps} page={page} onSelectPage={goToPage} />
      {enabledKeys.length > 1 && (
        <>
          <button className="kiosk-nav kiosk-nav--prev" title="Tela anterior" onClick={prev}>
            ‹
          </button>
          <button className="kiosk-nav kiosk-nav--next" title="Próxima tela" onClick={next}>
            ›
          </button>
        </>
      )}
    </div>
  );
}
