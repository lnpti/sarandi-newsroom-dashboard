import FeaturedStoriesRow from './FeaturedStoriesRow.jsx';
import TopStoriesRow from './TopStoriesRow.jsx';
import PortalBadge from './PortalBadge.jsx';
import { FEED_SOURCES } from '../feedSourcesMeta.js';
import { dedupeSimilarTitles } from '../newsDedup.js';

export default function KioskNationalNewsSlide({ externalNews }) {
  const merged = [];
  for (const source of FEED_SOURCES) {
    for (const item of externalNews?.[source.key]?.data || []) merged.push(item);
  }
  merged.sort((a, b) => new Date(b.isoDate || 0) - new Date(a.isoDate || 0));
  // Mesma notícia de agência aparece em vários portais com título reescrito —
  // numa TV cheia isso ficaria muito repetitivo lado a lado.
  const deduped = dedupeSimilarTitles(merged);

  const withImage = deduped.filter((item) => item.image).slice(0, 8);
  const toStory = (item) => ({
    id: `${item.portal}-${item.id}`,
    image: item.image,
    title: item.title,
    link: item.link,
    badge: <PortalBadge portal={item.portal} />,
  });

  const featured = withImage.slice(0, 2).map(toStory);
  // 6 cards fixos por vez em vez dos 3 do modo normal — tela cheia tem espaço
  // de sobra. Sem rodízio interno: só troca quando a própria tela rodar de novo.
  const rest = withImage.slice(2, 8).map(toStory);

  return (
    <div className="kiosk-slide kiosk-slide--news">
      <div className="kiosk-slide__header">Notícias Nacionais</div>
      <div className="kiosk-slide__body">
        <FeaturedStoriesRow items={featured} />
        <TopStoriesRow items={rest} pageSize={6} autoRotate={false} />
      </div>
    </div>
  );
}
