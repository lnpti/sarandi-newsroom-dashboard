function dayLabel(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(target, today)) return 'Hoje';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(target, tomorrow)) return 'Amanhã';
  return target.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(events) {
  const groups = [];
  for (const ev of events) {
    const key = ev.start.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.events.push(ev);
    } else {
      groups.push({ key, events: [ev] });
    }
  }
  return groups;
}

// Coluna própria (não um painel dentro da coluna de widgets) — some por
// completo quando não há nenhum compromisso, em vez de reservar espaço vazio.
export default function CalendarPanel({ calendar }) {
  const events = calendar?.data;
  if (!events || events.length === 0) return null;

  return (
    <div className="column column--flashs">
      <div className="column__header">
        <span>Flashs</span>
      </div>
      {groupByDay(events).map((group) => (
        <div key={group.key} className="calendar-day">
          <div className="calendar-day__label">{dayLabel(group.key)}</div>
          {group.events.map((ev) => (
            <div className="calendar-row" key={ev.id}>
              <span className="calendar-row__time">{ev.allDay ? 'Dia inteiro' : formatTime(ev.start)}</span>
              <div className="calendar-row__main">
                <span className="calendar-row__title">{ev.title}</span>
                {ev.location && <span className="calendar-row__location">{ev.location}</span>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
