import FeaturedStoriesRow from './FeaturedStoriesRow.jsx';
import TopStoriesRow from './TopStoriesRow.jsx';
import { RADIO_NAME } from '@station-assets/info.js';

function toStory(item) {
  return {
    id: item.id,
    image: item.img,
    title: item.titulo,
    link: item.url,
    badge: <span className="news-card__category">{item.categoria}</span>,
  };
}

export default function KioskPortalNewsSlide({ radioNews }) {
  const items = radioNews?.data || [];
  const featured = items.slice(0, 2).map(toStory);
  // 6 cards fixos por vez em vez dos 3 do modo normal — tela cheia tem espaço
  // de sobra. Sem rodízio interno: só troca quando a própria tela rodar de novo.
  const rest = items.slice(2, 8).map(toStory);

  return (
    <div className="kiosk-slide kiosk-slide--news">
      <div className="kiosk-slide__header">{RADIO_NAME}</div>
      <div className="kiosk-slide__body">
        <FeaturedStoriesRow items={featured} />
        <TopStoriesRow items={rest} pageSize={6} autoRotate={false} />
      </div>
    </div>
  );
}
