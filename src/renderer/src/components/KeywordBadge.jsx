import { matchKeyword } from '../keywordBadge.js';

export default function KeywordBadge({ title }) {
  const keyword = matchKeyword(title);
  if (!keyword) return null;
  return <span className="keyword-badge">{keyword}</span>;
}
