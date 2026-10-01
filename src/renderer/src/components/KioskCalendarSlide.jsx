import { useEffect, useState } from 'react';
import { dayKey, dayLabel, formatTime, groupByDay } from '../calendarUtils.js';

// Quantos flashs mostrar além do destaque — é uma TV sem ninguém pra rolar.
const EVENT_LIMIT = 12;
const MAX_DAY_COLUMNS = 4;

// Re-renderiza de tempos em tempos pra a contagem regressiva e o corte dos
// flashs que já passaram não dependerem do próximo ciclo de busca (15 min).
function useNow(intervalMs) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function describeStart(ev, now) {
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  if (ev.allDay) return { tag: 'Dia inteiro', countdown: dayLabel(dayKey(ev), { long: true }) };
  if (start <= now && end > now) return { tag: 'Acontecendo agora', countdown: `até ${formatTime(ev.end)}`, live: true };
  const mins = Math.round((start - now) / 60000);
  if (mins < 60) return { tag: 'Próximo flash', countdown: mins <= 1 ? 'em instantes' : `em ${mins} min` };
  if (mins < 24 * 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { tag: 'Próximo flash', countdown: m === 0 ? `em ${h}h` : `em ${h}h ${m}min` };
  }
  return { tag: 'Próximo flash', countdown: dayLabel(dayKey(ev), { long: true }) };
}

function Hero({ ev, now }) {
  const { tag, countdown, live } = describeStart(ev, now);
  return (
    <section className={`fl-hero ${live ? 'fl-hero--live' : ''}`}>
      <div className="fl-hero__left">
        <span className="fl-hero__tag">
          {live && <span className="fl-hero__dot" />}
          {tag}
        </span>
        <span className="fl-hero__time">{ev.allDay ? 'Dia inteiro' : formatTime(ev.start)}</span>
        <span className="fl-hero__countdown">{countdown}</span>
      </div>
      <div className="fl-hero__right">
        <h2 className="fl-hero__title">{ev.title}</h2>
        {ev.location && <p className="fl-hero__location">📍 {ev.location}</p>}
      </div>
    </section>
  );
}

function DayCard({ group }) {
  return (
    <section className="fl-day">
      <h3 className="fl-day__label">{dayLabel(group.key, { long: true })}</h3>
      <div className="fl-day__events">
        {group.events.map((ev) => (
          <div className="fl-event" key={ev.id}>
            <span className="fl-event__time">{ev.allDay ? 'Dia todo' : formatTime(ev.start)}</span>
            <div className="fl-event__main">
              <span className="fl-event__title">{ev.title}</span>
              {ev.location && <span className="fl-event__location">{ev.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function KioskCalendarSlide({ calendar }) {
  const now = useNow(30000);
  // O dado só é recalculado a cada 15 min — corta aqui o que já acabou.
  const events = (calendar?.data || []).filter((ev) => new Date(ev.end) > now);
  const next = events[0];
  const groups = groupByDay(events.slice(1, 1 + EVENT_LIMIT));

  return (
    <div className="kiosk-slide kiosk-slide--calendar">
      <div className="kiosk-slide__header">🗓️ Flashs Agendados</div>
      {!next ? (
        <p className="fl-empty">Nenhum compromisso agendado.</p>
      ) : (
        <div className="fl">
          <Hero ev={next} now={now} />
          {groups.length > 0 && (
            <div
              className="fl-days"
              style={{ '--fl-cols': Math.min(groups.length, MAX_DAY_COLUMNS) }}
            >
              {groups.map((group) => (
                <DayCard key={group.key} group={group} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
