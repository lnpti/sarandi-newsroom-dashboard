import { useEffect, useState } from 'react';
import KeywordBadge from './KeywordBadge.jsx';

const INTERVAL_MS = 6000;

// items: [{ id, image, title, link, badge: ReactNode }]
export default function HeadlineCarousel({ items }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [items.length, index]);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  const item = items[index];

  return (
    <a className="carousel" href={item.link} target="_blank" rel="noreferrer">
      <img className="carousel__img" src={item.image} alt="" />
      <div className="carousel__overlay">
        {item.badge}
        <KeywordBadge title={item.title} />
        <p className="carousel__title">{item.title}</p>
      </div>
      <div className="carousel__dots">
        {items.map((it, i) => (
          <span key={it.id} className={`carousel__dot ${i === index ? 'carousel__dot--active' : ''}`} />
        ))}
      </div>
    </a>
  );
}
