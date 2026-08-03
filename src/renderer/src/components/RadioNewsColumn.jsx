import { useMemo } from 'react';
import StatusBadge from './StatusBadge.jsx';
import RadioNewsCard from './RadioNewsCard.jsx';
import TopStoriesRow from './TopStoriesRow.jsx';
import FeaturedStoriesRow from './FeaturedStoriesRow.jsx';

// 1º carrossel: destaque grande + 1 normal ao lado (2 notícias).
const FEATURED_SIZE = 2;
// 2º carrossel: 3 notícias, como antes.
const SECOND_ROW_SIZE = 3;

function toStory(item) {
  return {
    id: item.id,
    image: item.img,
    title: item.titulo,
    link: item.url,
    badge: <span className="news-card__category">{item.categoria}</span>,
  };
}

export default function RadioNewsColumn({ radioNews }) {
  const featured = useMemo(
    () => (radioNews.data || []).slice(0, FEATURED_SIZE).map(toStory),
    [radioNews.data]
  );

  const secondStories = useMemo(
    () =>
      (radioNews.data || [])
        .slice(FEATURED_SIZE, FEATURED_SIZE + SECOND_ROW_SIZE)
        .map(toStory),
    [radioNews.data]
  );

  const rest = useMemo(
    () => (radioNews.data || []).slice(FEATURED_SIZE + SECOND_ROW_SIZE),
    [radioNews.data]
  );

  return (
    <div className="column column--radio-news">
      <div className="column__header">
        <StatusBadge status={radioNews.status} />
        <span>Portal Rádio Sarandi</span>
      </div>
      <FeaturedStoriesRow items={featured} />
      <TopStoriesRow items={secondStories} />
      {rest.map((item) => (
        <RadioNewsCard key={item.id} item={item} />
      ))}
      {radioNews.status === 'error' && !radioNews.data && (
        <p style={{ color: 'var(--muted)' }}>Não foi possível carregar as notícias.</p>
      )}
    </div>
  );
}
