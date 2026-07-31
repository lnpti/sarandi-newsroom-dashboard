export default function StatusBadge({ status }) {
  return <span className={`status-dot status-dot--${status}`} title={status} />;
}
