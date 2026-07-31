import KeywordBadge from './KeywordBadge.jsx';

export default function RadioNewsCard({ item }) {
  return (
    <a className="news-card" href={item.url} target="_blank" rel="noreferrer">
      {item.img && <img className="news-card__img" src={item.img} alt="" />}
      <div>
        <p className="news-card__title">{item.titulo}</p>
        <div className="news-card__meta">
          <span className="news-card__category">{item.categoria}</span>
          <span>{item.data}</span>
          <KeywordBadge title={item.titulo} />
        </div>
      </div>
    </a>
  );
}
