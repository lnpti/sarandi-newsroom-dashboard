import PortalBadge from './PortalBadge.jsx';
import KeywordBadge from './KeywordBadge.jsx';
import { FEED_SOURCES } from '../feedSourcesMeta.js';

export default function HeadlineRow({ item }) {
  const source = FEED_SOURCES.find((s) => s.key === item.portal);
  return (
    <a
      className="headline-row"
      style={{ borderLeftColor: source?.color }}
      href={item.link}
      target="_blank"
      rel="noreferrer"
    >
      <PortalBadge portal={item.portal} />
      <span className="headline-row__title">{item.title}</span>
      <KeywordBadge title={item.title} />
      <span className="headline-row__time">
        {item.isoDate ? new Date(item.isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
      </span>
    </a>
  );
}
