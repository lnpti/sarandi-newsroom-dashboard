import { useEffect, useState } from 'react';
import { dateFromKey, dayKey, dayLabel, formatTime, groupByDay } from '../calendarUtils.js';

// Os próximos 8 dias de segunda a sábado (domingo não entra) viram cartões em
// grade 4×2 até preencher a tela; dia sem flash aparece vazio, pra agenda ficar
// visível de relance. 8 dias sem domingo cabem sempre dentro da janela de busca
// (WINDOW_DAYS em calendarService.js). É uma TV sem ninguém pra rolar, então cada
// cartão mostra no máximo alguns flashs e avisa quantos ficaram de fora.
const DAYS_SHOWN = 8;
const DAY_COLUMNS = 4;
const EVENTS_PER_DAY = 2;
const SUNDAY = 0;

const isSunday = (key) => dateFromKey(key).getDay() === SUNDAY;

function dayKeys(now, count) {
  const p = (n) => String(n).padStart(2, '0');
  const keys = [];
  for (let i = 0; keys.length < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (d.getDay() === SUNDAY) continue;
    keys.push(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
  }
  return keys;
}

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
  const shown = group.events.slice(0, EVENTS_PER_DAY);
  const hidden = group.events.length - shown.length;
  return (
    <section className={`fl-day ${group.events.length === 0 ? 'fl-day--empty' : ''}`}>
      <h3 className="fl-day__label">{dayLabel(group.key, { long: true })}</h3>
      <div className="fl-day__events">
        {group.events.length === 0 && <span className="fl-day__none">Sem flashs</span>}
        {shown.map((ev) => (
          <div className="fl-event" key={ev.id}>
            <span className="fl-event__time">{ev.allDay ? 'Dia todo' : formatTime(ev.start)}</span>
            <div className="fl-event__main">
              <span className="fl-event__title">{ev.title}</span>
              {ev.location && <span className="fl-event__location">{ev.location}</span>}
            </div>
          </div>
        ))}
        {hidden > 0 && <span className="fl-day__more">+{hidden} {hidden === 1 ? 'flash' : 'flashs'}</span>}
      </div>
    </section>
  );
}

export default function KioskCalendarSlide({ calendar }) {
  const now = useNow(30000);
  // O dado só é recalculado a cada 15 min — corta aqui o que já acabou.
  // Flash de domingo não aparece (nem no destaque) — a tela é de segunda a sábado.
  const events = (calendar?.data || []).filter((ev) => new Date(ev.end) > now && !isSunday(dayKey(ev)));
  const next = events[0];
  const byDay = new Map(groupByDay(events).map((g) => [g.key, g]));
  const groups = dayKeys(now, DAYS_SHOWN).map((key) => byDay.get(key) || { key, events: [] });

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
              style={{ '--fl-cols': DAY_COLUMNS }}
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
