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

// Variação do dia como "pílula" colorida — verde sobe, vermelho cai.
function ChangePill({ value, className = '' }) {
  const up = value >= 0;
  return (
    <span className={`market-pill ${up ? 'market-pill--up' : 'market-pill--down'} ${className}`}>
      {up ? '▲' : '▼'} {formatNumber(Math.abs(value))}%
    </span>
  );
}

function Tile({ label, value, change }) {
  return (
    <div className="market-tile">
      <span className="market-tile__label">{label}</span>
      <span className="market-tile__value">{value}</span>
      <ChangePill value={change} />
    </div>
  );
}

function Rate({ label, data }) {
  if (!data || Number.isNaN(data.bid)) return null;
  return <Tile label={label} value={`R$ ${formatNumber(data.bid)}`} change={data.pctChange} />;
}

function IndexRate({ label, data }) {
  if (!data || Number.isNaN(data.points)) return null;
  return <Tile label={label} value={formatNumber(data.points, 0)} change={data.pctChange} />;
}

function MoverCard({ item, rank }) {
  const up = item.change >= 0;
  return (
    <div className={`market-mover ${up ? 'market-mover--up' : 'market-mover--down'}`}>
      <span className="market-mover__rank">{rank}</span>
      <div className="market-mover__main">
        <span className="market-mover__symbol">{item.symbol}</span>
        {item.name && <span className="market-mover__name">{item.name}</span>}
      </div>
      <ChangePill value={item.change} className="market-pill--big" />
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
          <section className="market-panel">
            <h3 className="market-panel__title">Câmbio</h3>
            <div className="market-panel__tiles">
              <Rate label="Dólar" data={data?.usd} />
              <Rate label="Euro" data={data?.eur} />
              <Rate label="Bitcoin" data={data?.btc} />
            </div>
          </section>
          <section className="market-panel">
            <h3 className="market-panel__title">Bolsas</h3>
            <div className="market-panel__tiles">
              <IndexRate label="Ibovespa" data={data?.ibovespa} />
              <IndexRate label="Dow Jones" data={data?.dowjones} />
              <IndexRate label="Nasdaq" data={data?.nasdaq} />
            </div>
          </section>
        </div>

        {(gainers.length > 0 || losers.length > 0) && (
          <div className="kiosk-market__movers">
            <section className="kiosk-market__movers-col">
              <h3 className="market-panel__title market-panel__title--up">📈 Maiores altas da B3 hoje</h3>
              {gainers.map((g, i) => (
                <MoverCard key={g.symbol} item={g} rank={i + 1} />
              ))}
            </section>
            <section className="kiosk-market__movers-col">
              <h3 className="market-panel__title market-panel__title--down">📉 Maiores baixas da B3 hoje</h3>
              {losers.map((l, i) => (
                <MoverCard key={l.symbol} item={l} rank={i + 1} />
              ))}
            </section>
          </div>
        )}

        {news.length > 0 && (
          <div className="kiosk-market__news">
            <h3 className="market-panel__title">📰 Notícias do mercado</h3>
            <TopStoriesRow items={news} pageSize={6} autoRotate={false} />
          </div>
        )}
      </div>
    </div>
  );
}
