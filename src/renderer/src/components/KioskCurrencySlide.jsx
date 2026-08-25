// pt-BR usa vírgula decimal e ponto de milhar (ex.: "R$ 430.559,34"), ao
// contrário do toFixed()/toString() padrão do JS (ponto decimal, sem milhar).
function formatNumber(value, decimals = 2) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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

export default function KioskCurrencySlide({ currency }) {
  const data = currency?.data;

  return (
    <div className="kiosk-slide kiosk-slide--currency">
      <div className="kiosk-slide__header">💱 Mercado Financeiro</div>
      <div className="kiosk-slide__body kiosk-market">
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
    </div>
  );
}
