import KeywordBadge from './KeywordBadge.jsx';

function Story({ item, featured }) {
  return (
    <a
      className={`top-story ${featured ? 'top-story--featured' : ''}`}
      href={item.link}
      target="_blank"
      rel="noreferrer"
    >
      {item.image && <img className="top-story__img" src={item.image} alt="" />}
      <div className="top-story__overlay">
        {item.badge}
        <KeywordBadge title={item.title} />
        <p className="top-story__title">{item.title}</p>
      </div>
    </a>
  );
}

// items[0] = destaque grande (ocupa o espaço das duas primeiras),
// items[1] = notícia normal ao lado.
export default function FeaturedStoriesRow({ items }) {
  if (!items || items.length === 0) return null;
  const [first, second] = items;
  return (
    <div className="featured-row">
      {first && <Story item={first} featured />}
      {second && <Story item={second} />}
    </div>
  );
}
