import TopStoriesRow from './TopStoriesRow.jsx';

// pt-BR: vírgula decimal e ponto de milhar ("R$ 1.450,60").
function formatNumber(value, decimals = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function toNewsStory(item) {
  return {
    id: item.id,
    image: item.image,
    title: item.title,
    link: item.link,
    badge: <span className="news-card__category">Canal Rural</span>,
  };
}

// Variação como "pílula": verde sobe, vermelho cai, cinza estável. Sem variação
// informada pela fonte (null) não mostra nada, em vez de inventar 0%.
function Change({ value, big = false }) {
  if (value == null || Number.isNaN(value)) return null;
  const flat = Math.abs(value) < 0.005;
  const kind = flat ? 'flat' : value > 0 ? 'up' : 'down';
  return (
    <span className={`market-pill market-pill--${kind} ${big ? 'market-pill--big' : ''}`}>
      {flat ? '●' : value > 0 ? '▲' : '▼'} {formatNumber(Math.abs(value))}%
    </span>
  );
}

function CommodityCard({ item }) {
  const { headline, rows, chicago } = item;
  return (
    <section className="ag-card">
      <div className="ag-card__head">
        <span className="ag-card__icon">{item.icon}</span>
        <div className="ag-card__title">
          <span className="ag-card__name">{item.name}</span>
          <span className="ag-card__source">{headline.label}</span>
        </div>
        <Change value={headline.pct} big />
      </div>

      <div className="ag-card__price">
        <span className="ag-card__value">
          {headline.approx ? '≈ ' : ''}R$ {formatNumber(headline.value, headline.decimals ?? 2)}
        </span>
        <span className="ag-card__unit">{headline.unit.replace('R$', '').trim()}</span>
      </div>

      <div className="ag-card__rows">
        {rows.map((r) => (
          <div className="ag-row" key={r.label}>
            <span className="ag-row__label">{r.label}</span>
            <span className="ag-row__value">
              R$ {formatNumber(r.value, r.decimals ?? 2)}
              <span className="ag-row__unit">{r.unit.replace('R$', '').trim()}</span>
            </span>
            <Change value={r.pct} />
          </div>
        ))}
        {chicago && (
          <div className="ag-row ag-row--ref">
            <span className="ag-row__label">🌎 Chicago</span>
            <span className="ag-row__value">
              US$ {formatNumber(chicago.value)}
              <span className="ag-row__unit">/bu</span>
            </span>
            <Change value={chicago.pct} />
          </div>
        )}
      </div>
    </section>
  );
}

export default function KioskAgroSlide({ agro }) {
  const data = agro?.data;
  const items = data?.items || [];
  const news = (data?.news || []).slice(0, 6).map(toNewsStory);

  return (
    <div className="kiosk-slide kiosk-slide--agro">
      <div className="kiosk-slide__header ag-header">
        <span>🌾 Mercado Agrícola · Rio Grande do Sul</span>
        <div className="ag-header__meta">
          {data?.fx && (
            <span className="ag-fx">
              Dólar <strong>R$ {formatNumber(data.fx.price)}</strong>
              <Change value={data.fx.pct} />
            </span>
          )}
          {data?.quotesDate && <span className="ag-date">Cotações de {data.quotesDate}</span>}
        </div>
      </div>

      <div className="kiosk-slide__body ag">
        {items.length === 0 ? (
          <p className="kiosk-slide__empty">Carregando cotações agrícolas…</p>
        ) : (
          <div className={`ag-grid ag-grid--${items.length > 4 ? 'six' : 'few'}`}>
            {items.map((item) => (
              <CommodityCard key={item.key} item={item} />
            ))}
          </div>
        )}

        {news.length > 0 && (
          <div className="ag-news">
            <h3 className="market-panel__title">📰 Notícias do campo</h3>
            <TopStoriesRow items={news} pageSize={6} autoRotate={false} />
          </div>
        )}

        <p className="ag-foot">
          Praças do RS: Notícias Agrícolas · Cepea/Esalq · Chicago (CBOT) via Yahoo Finance · valores de referência
        </p>
      </div>
    </div>
  );
}
