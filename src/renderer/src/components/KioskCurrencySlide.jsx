import TopStoriesRow from './TopStoriesRow.jsx';

// pt-BR usa vírgula decimal e ponto de milhar (ex.: "R$ 430.559,34"), ao
// contrário do toFixed()/toString() padrão do JS (ponto decimal, sem milhar).
function formatNumber(value, decimals = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function toNewsStory(item) {
  return {
    id: item.id,
    image: item.image,
    title: item.title,
    link: item.link,
    badge: <span className="news-card__category">InfoMoney</span>,
  };
}

function Rate({ label, data }) {
  if (!data || Number.isNaN(data.bid)) return null;
  const up = data.pctChange >= 0;
  return (
    <div className="kiosk-currency__item">
      <span className="kiosk-currency__label">{label}</span>
      <span className="kiosk-currency__value">R$ {formatNumber(data.bid)}</span>
      <span className={`kiosk-currency__change ${up ? 'currency__change--up' : 'currency__change--down'}`}>
        {up ? '▲' : '▼'} {formatNumber(Math.abs(data.pctChange))}%
      </span>
    </div>
  );
}

function IndexRate({ label, data }) {
  if (!data || Number.isNaN(data.points)) return null;
  const up = data.pctChange >= 0;
  return (
    <div className="kiosk-currency__item">
      <span className="kiosk-currency__label">{label}</span>
      <span className="kiosk-currency__value">{formatNumber(data.points, 0)}</span>
      <span className={`kiosk-currency__change ${up ? 'currency__change--up' : 'currency__change--down'}`}>
        {up ? '▲' : '▼'} {formatNumber(Math.abs(data.pctChange))}%
      </span>
    </div>
  );
}

function MoverRow({ item }) {
  const up = item.change >= 0;
  return (
    <div className="kiosk-mover-row">
      <span className="kiosk-mover-row__main">
        <span className="kiosk-mover-row__symbol">{item.symbol}</span>
        {item.name && <span className="kiosk-mover-row__name">{item.name}</span>}
      </span>
      <span className={`kiosk-mover-row__change ${up ? 'currency__change--up' : 'currency__change--down'}`}>
        {up ? '▲' : '▼'} {formatNumber(Math.abs(item.change))}%
      </span>
    </div>
  );
}

export default function KioskCurrencySlide({ currency }) {
  const data = currency?.data;
  const gainers = data?.gainers || [];
  const losers = data?.losers || [];
  const news = (data?.news || []).map(toNewsStory);

  return (
    <div className="kiosk-slide kiosk-slide--currency">
      <div className="kiosk-slide__header">💱 Mercado Financeiro</div>
      <div className="kiosk-slide__body kiosk-market">
        <div className="kiosk-market__top">
          <div className="kiosk-market__group">
            <div className="kiosk-sports__group-title">Câmbio</div>
            <div className="kiosk-currency">
              <Rate label="Dólar" data={data?.usd} />
              <Rate label="Euro" data={data?.eur} />
              <Rate label="Bitcoin" data={data?.btc} />
            </div>
          </div>
          <div className="kiosk-market__group">
            <div className="kiosk-sports__group-title">Bolsas</div>
            <div className="kiosk-currency">
              <IndexRate label="Ibovespa" data={data?.ibovespa} />
              <IndexRate label="Dow Jones" data={data?.dowjones} />
              <IndexRate label="Nasdaq" data={data?.nasdaq} />
            </div>
          </div>
        </div>

        {(gainers.length > 0 || losers.length > 0) && (
          <div className="kiosk-market__movers">
            <div className="kiosk-market__movers-col">
              <div className="kiosk-sports__group-title">📈 Maiores altas do dia (B3)</div>
              {gainers.map((g) => (
                <MoverRow key={g.symbol} item={g} />
              ))}
            </div>
            <div className="kiosk-market__movers-col">
              <div className="kiosk-sports__group-title">📉 Maiores baixas do dia (B3)</div>
              {losers.map((l) => (
                <MoverRow key={l.symbol} item={l} />
              ))}
            </div>
          </div>
        )}

        {news.length > 0 && (
          <div className="kiosk-market__news">
            <div className="kiosk-sports__group-title">📰 Notícias do Mercado</div>
            <TopStoriesRow items={news} pageSize={6} autoRotate={false} />
          </div>
        )}
      </div>
    </div>
  );
}
