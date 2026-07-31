import { useEffect, useState } from 'react';
import KeywordBadge from './KeywordBadge.jsx';

const PAGE_SIZE = 3;
const INTERVAL_MS = 7000;

// items: [{ id, image, title, link, badge: ReactNode }] — pagina em grupos de 3
// e vai trocando o grupo visível sozinho, como um fluxo contínuo.
export default function TopStoriesRow({ items }) {
  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [pageCount, page]);

  useEffect(() => {
    if (pageCount < 2) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pageCount), INTERVAL_MS);
    return () => clearInterval(id);
  }, [pageCount]);

  if (items.length === 0) return null;

  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="top-stories-row" key={page}>
      {visible.map((item) => (
        <a key={item.id} className="top-story" href={item.link} target="_blank" rel="noreferrer">
          {item.image && <img className="top-story__img" src={item.image} alt="" />}
          <div className="top-story__overlay">
            {item.badge}
            <KeywordBadge title={item.title} />
            <p className="top-story__title">{item.title}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
