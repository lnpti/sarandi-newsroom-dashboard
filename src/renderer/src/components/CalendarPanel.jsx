import { dayLabel, formatTime, groupByDay } from '../calendarUtils.js';

// Coluna própria (não um painel dentro da coluna de widgets) — some por
// completo quando não há nenhum compromisso, em vez de reservar espaço vazio.
// O dado cobre mais dias (o Modo TV precisa de 8 dias úteis), mas o painel
// normal sempre mostrou só os próximos 8 dias corridos.
const PANEL_DAYS = 8;

export default function CalendarPanel({ calendar }) {
  const cutoff = Date.now() + PANEL_DAYS * 24 * 60 * 60 * 1000;
  const events = calendar?.data?.filter((ev) => new Date(ev.start) < cutoff);
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
