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

// Fonte vem do título do Alertas ("Manchete - Fonte") quando existe; senão
// cai pro domínio do link, que quase sempre identifica o portal.
function sourceLabel(item) {
  if (item.source) return item.source;
  try {
    return new URL(item.link).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function RegionalCard({ item, span = 1 }) {
  const source = sourceLabel(item);
  return (
    <a
      className="rg-card"
      href={item.link}
      target="_blank"
      rel="noreferrer"
      style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
    >
      <div className="rg-card__media">
        <span className="rg-card__placeholder">📍</span>
        {item.image && (
          <img
            className="rg-card__img"
            src={item.image}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
      <div className="rg-card__body">
        <p className="rg-card__title">
          {item.title}
          <KeywordBadge title={item.title} />
        </p>
        <div className="rg-card__meta">
          {source && <span className="rg-card__source">{source}</span>}
          <span className="rg-card__when">{formatWhen(item.isoDate)}</span>
        </div>
      </div>
    </a>
  );
}

// Colunas conforme a quantidade de notícias, pra a grade sempre ocupar a tela
// inteira (12 = 4×3; menos que isso reparte em menos colunas/linhas em vez de
// deixar um canto vazio).
function gridColumns(count) {
  if (count <= 3) return Math.max(1, count);
  if (count === 4) return 2;
  if (count <= 6) return 3;
  if (count <= 8) return 4;
  if (count === 9) return 3;
  if (count === 10) return 5;
  return 4;
}

export default function KioskRegionalNewsSlide({ regionalNews }) {
  const items = (regionalNews?.data || []).slice(0, 12);
  const cols = gridColumns(items.length);
  // Última linha incompleta: o último cartão se estica pelas colunas que sobram.
  const holes = (cols - (items.length % cols)) % cols;

  return (
    <div className="kiosk-slide kiosk-slide--regional">
      <div className="kiosk-slide__header">📍 Notícias da Região</div>
      {items.length === 0 ? (
        <p className="kiosk-slide__empty">Nenhuma notícia recente.</p>
      ) : (
        <div className="rg-grid" style={{ '--rg-cols': cols }}>
          {items.map((item, i) => (
            <RegionalCard key={item.id} item={item} span={i === items.length - 1 ? holes + 1 : 1} />
          ))}
        </div>
      )}
    </div>
  );
}
