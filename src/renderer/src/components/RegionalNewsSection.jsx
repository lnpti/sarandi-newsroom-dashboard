import KeywordBadge from './KeywordBadge.jsx';

function formatWhen(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoje ${time}`;
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${day} · ${time}`;
}

export default function RegionalNewsSection({ regional }) {
  const items = regional?.data;
  if (!items || items.length === 0) return null;

  return (
    <>
      <div className="column__header">
        <span>📍 Notícias da Região</span>
      </div>
      <div className="regional-grid">
        {items.map((item) => (
          <a
            className="regional-card"
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noreferrer"
          >
            {item.image && <img className="regional-card__img" src={item.image} alt="" />}
            <div className="regional-card__body">
              <p className="regional-card__title">
                {item.title}
                <KeywordBadge title={item.title} />
              </p>
              <div className="regional-card__meta">
                {item.source || ''}
                {item.source && item.isoDate ? ' · ' : ''}
                {formatWhen(item.isoDate)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
