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

export default function KioskRegionalNewsSlide({ regionalNews }) {
  const items = (regionalNews?.data || []).slice(0, 8);

  return (
    <div className="kiosk-slide kiosk-slide--regional">
      <div className="kiosk-slide__header">📍 Notícias da Região</div>
      <div className="kiosk-slide__body">
        {items.length === 0 && <p className="kiosk-slide__empty">Nenhuma notícia recente.</p>}
        <div className="kiosk-regional-grid">
          {items.map((item) => (
            <a className="regional-card" key={item.id} href={item.link} target="_blank" rel="noreferrer">
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
      </div>
    </div>
  );
}
