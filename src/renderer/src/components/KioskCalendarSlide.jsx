// Quantos eventos mostrar no total — é uma TV sem ninguém pra rolar a tela,
// então corta em vez de listar os 7 dias inteiros se tiver muita coisa.
const EVENT_LIMIT = 12;

function dayLabel(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(target, today)) return 'Hoje';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameDay(target, tomorrow)) return 'Amanhã';
  return target.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'long' });
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

export default function KioskCalendarSlide({ calendar }) {
  const events = (calendar?.data || []).slice(0, EVENT_LIMIT);
  const groups = groupByDay(events);

  return (
    <div className="kiosk-slide kiosk-slide--calendar">
      <div className="kiosk-slide__header">🗓️ Flashs Agendados</div>
      <div className="kiosk-slide__body kiosk-calendar">
        {groups.length === 0 && <p className="kiosk-calendar__empty">Nenhum compromisso agendado.</p>}
        {groups.map((group) => (
          <div className="kiosk-calendar__day" key={group.key}>
            <div className="kiosk-calendar__day-label">{dayLabel(group.key)}</div>
            {group.events.map((ev) => (
              <div className="kiosk-calendar__row" key={ev.id}>
                <span className="kiosk-calendar__time">{ev.allDay ? 'Dia inteiro' : formatTime(ev.start)}</span>
                <div className="kiosk-calendar__main">
                  <span className="kiosk-calendar__title">{ev.title}</span>
                  {ev.location && <span className="kiosk-calendar__location">{ev.location}</span>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
