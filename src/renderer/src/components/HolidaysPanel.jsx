function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} · ${weekday}`;
}

function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  return `em ${diff} dias`;
}

export default function HolidaysPanel({ holidays }) {
  const list = holidays?.data;
  if (!list || list.length === 0) return null;

  return (
    <div className="side-panel">
      <div className="side-panel__header">📅 Próximo feriado</div>
      {list.map((h, i) => (
        <div className={`holiday-row ${i === 0 ? 'holiday-row--next' : ''}`} key={h.date}>
          <div className="holiday-row__main">
            <span className="holiday-row__name">{h.name}</span>
            <span className="holiday-row__date">{formatDate(h.date)}</span>
          </div>
          <span className="holiday-row__until">{daysUntil(h.date)}</span>
        </div>
      ))}
    </div>
  );
}
