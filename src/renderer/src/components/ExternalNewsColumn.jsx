import { useMemo, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import HeadlineRow from './HeadlineRow.jsx';
import HeadlineCarousel from './HeadlineCarousel.jsx';
import PortalBadge from './PortalBadge.jsx';
import PortalFilterChips from './PortalFilterChips.jsx';
import { FEED_SOURCES } from '../feedSourcesMeta.js';

const CAROUSEL_SIZE = 6;

export default function ExternalNewsColumn({ externalNews }) {
  const [active, setActive] = useState(() => new Set(FEED_SOURCES.map((s) => s.key)));

  function toggle(key) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const merged = useMemo(() => {
    const items = [];
    for (const key of Object.keys(externalNews)) {
      if (!active.has(key)) continue;
      for (const item of externalNews[key].data || []) items.push(item);
    }
    return items.sort((a, b) => new Date(b.isoDate || 0) - new Date(a.isoDate || 0));
  }, [externalNews, active]);

  const pool = useMemo(() => merged.filter((item) => item.image).slice(0, CAROUSEL_SIZE), [merged]);

  const carouselItems = useMemo(
    () => pool.map((item) => ({ ...item, badge: <PortalBadge portal={item.portal} /> })),
    [pool]
  );

  const rest = useMemo(() => {
    const poolKeys = new Set(pool.map((item) => `${item.portal}-${item.id}`));
    return merged.filter((item) => !poolKeys.has(`${item.portal}-${item.id}`));
  }, [merged, pool]);

  return (
    <div className="column column--external-news">
      <div className="column__header">
        <span>Portais de Notícias</span>
        {FEED_SOURCES.map((s) => (
          <StatusBadge key={s.key} status={externalNews[s.key]?.status || 'loading'} />
        ))}
      </div>
      <HeadlineCarousel items={carouselItems} />
      <PortalFilterChips active={active} onToggle={toggle} />
      {rest.map((item) => (
        <HeadlineRow key={`${item.portal}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
