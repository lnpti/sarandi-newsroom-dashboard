import KeywordBadge from './KeywordBadge.jsx';

function timeOf(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                {timeOf(item.isoDate)}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
