import { FEED_SOURCES } from '../feedSourcesMeta.js';

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PortalFilterChips({ active, onToggle }) {
  return (
    <div className="portal-chips">
      {FEED_SOURCES.map((source) => {
        const isActive = active.has(source.key);
        return (
          <button
            key={source.key}
            className={`portal-chip ${isActive ? 'portal-chip--active' : ''}`}
            style={
              isActive
                ? { '--chip-bg': hexToRgba(source.color, 0.16), '--chip-border': source.color }
                : undefined
            }
            onClick={() => onToggle(source.key)}
          >
            {source.label}
          </button>
        );
      })}
    </div>
  );
}
