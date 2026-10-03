import { useSlideRotation } from '../hooks/useSlideRotation.js';
import { useGoalAlert } from '../hooks/useGoalAlert.js';
import { getLiveGames } from '../liveScores.js';
import KioskLiveGameSlide from './KioskLiveGameSlide.jsx';
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
  // Tela virtual: não está na lista de Configurações — o rodízio a encaixa só
  // enquanto há jogo ao vivo (ver withLiveSlides) e o alerta de gol a abre.
  liveGame: { Component: KioskLiveGameSlide, props: ['liveScores'] },
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

const LIVE_PREFIX = 'liveGame@';
const baseKeyOf = (key) => (key.startsWith(LIVE_PREFIX) ? 'liveGame' : key);

// Encaixa a tela do jogo ao vivo no rodízio. As chaves ficam únicas
// ('liveGame@3') porque ela pode aparecer várias vezes por volta:
//  - normal:   1 vez por volta, no fim;
//  - frequent: depois de cada 2 telas;
//  - national: como 'frequent' enquanto há jogo da seleção; senão, como normal.
function withLiveSlides(keys, frequency, games) {
  const frequent = frequency === 'frequent' || (frequency === 'national' && games.some((g) => g.national));
  const every = frequent ? 2 : keys.length;
  const out = [];
  keys.forEach((key, i) => {
    out.push(key);
    if ((i + 1) % every === 0) out.push(`${LIVE_PREFIX}${i}`);
  });
  if (!out.some((k) => k.startsWith(LIVE_PREFIX))) out.push(`${LIVE_PREFIX}end`);
  return out;
}

export default function KioskView({ snapshot, kiosk }) {
  const enabledKeys = (kiosk.kioskEnabledSlides || []).filter((key) => SLIDES[key]);

  const liveOn = kiosk.liveGameSlideOn !== false;
  const liveGames = liveOn ? getLiveGames(snapshot.liveScores) : [];
  const rotationKeys =
    liveGames.length > 0 && enabledKeys.length > 0
      ? withLiveSlides(enabledKeys, kiosk.liveGameFrequency, liveGames)
      : enabledKeys;

  // Gol: interrompe a tela atual com o jogo por alguns segundos.
  const goal = useGoalAlert(snapshot.liveScores, {
    enabled: liveOn && kiosk.liveGameGoalAlert !== false,
    seconds: kiosk.liveGameGoalSeconds || 15,
  });

  const { index: activeIndex, page, next, prev, goToPage } = useSlideRotation(
    rotationKeys,
    kiosk.kioskSecondsPerSlide || 20,
    (slideKey) => SLIDES[baseKeyOf(slideKey)]?.pages?.(snapshot) ?? 1
  );

  if (enabledKeys.length === 0) {
    return (
      <div className="kiosk-view kiosk-view--empty">
        <p>Nenhuma tela habilitada — escolha pelo menos uma em Configurações → Modo TV.</p>
      </div>
    );
  }

  const key = rotationKeys[activeIndex];
  const { Component, props } = SLIDES[baseKeyOf(key)];
  const slideProps = Object.fromEntries(props.map((p) => [p, snapshot[p]]));

  return (
    <div className="kiosk-view">
      {goal ? (
        <KioskLiveGameSlide
          key={`goal-${goal.key}`}
          liveScores={snapshot.liveScores}
          goal={goal}
          showDetails={kiosk.liveGameDetails !== false}
        />
      ) : (
        <Component
          key={key}
          {...slideProps}
          page={page}
          onSelectPage={goToPage}
          showDetails={kiosk.liveGameDetails !== false}
        />
      )}
      {rotationKeys.length > 1 && (
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
