function Rate({ label, data }) {
  if (!data || Number.isNaN(data.bid)) return null;
  const up = data.pctChange >= 0;
  return (
    <span className="currency__item">
      <span className="currency__label">{label}</span>
      <span className="currency__value">R$ {data.bid.toFixed(2)}</span>
      <span className={`currency__change ${up ? 'currency__change--up' : 'currency__change--down'}`}>
        {up ? '▲' : '▼'} {Math.abs(data.pctChange).toFixed(2)}%
      </span>
    </span>
  );
}

export default function CurrencyWidget({ currency }) {
  const data = currency.data;
  if (!data) return null;
  return (
    <div className="currency">
      <Rate label="Dólar" data={data.usd} />
      <Rate label="Euro" data={data.eur} />
    </div>
  );
}
