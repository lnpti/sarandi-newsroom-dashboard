import { FEED_SOURCES } from '../feedSourcesMeta.js';

export default function PortalBadge({ portal }) {
  const source = FEED_SOURCES.find((s) => s.key === portal);
  if (!source) return null;
  return (
    <span className="portal-badge" style={{ background: source.color }}>
      {source.label}
    </span>
  );
}
