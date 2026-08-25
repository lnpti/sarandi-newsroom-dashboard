import ical from 'node-ical';

const WINDOW_DAYS = 7;

// A partir de agora (não da meia-noite de hoje) até 7 dias à frente — assim
// um flash de hoje de manhã some da lista sozinho depois que o horário passa,
// em vez de continuar aparecendo o dia inteiro.
function windowBounds() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + WINDOW_DAYS); // exclusivo
  return { start, end };
}

function toEvent(comp, start, end) {
  return {
    id: `${comp.uid}-${start.getTime()}`,
    title: comp.summary || 'Sem título',
    location: comp.location || null,
    allDay: comp.datetype === 'date',
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

// Expande um VEVENT recorrente pra suas ocorrências dentro da janela,
// respeitando exceções (EXDATE) e instâncias modificadas (RECURRENCE-ID).
function expandRecurring(comp, windowStart, windowEnd) {
  const durationMs = comp.end.getTime() - comp.start.getTime();
  const occurrences = comp.rrule.between(windowStart, windowEnd, true);
  const events = [];

  for (const occStart of occurrences) {
    const dateKey = occStart.toISOString().slice(0, 10);
    const isExcluded = Object.values(comp.exdate || {}).some(
      (d) => d.toISOString().slice(0, 10) === dateKey
    );
    if (isExcluded) continue;

    const override = Object.values(comp.recurrences || {}).find(
      (r) => r.recurrenceid && r.recurrenceid.toISOString().slice(0, 10) === dateKey
    );

    if (override) {
      events.push(toEvent(override, override.start, override.end));
    } else {
      events.push(toEvent(comp, occStart, new Date(occStart.getTime() + durationMs)));
    }
  }

  return events;
}

export async function fetchCalendar(icsUrl) {
  if (!icsUrl) {
    return [];
  }

  const response = await fetch(icsUrl);
  if (!response.ok) {
    throw new Error(`Falha ao buscar calendário (HTTP ${response.status})`);
  }
  const text = await response.text();
  const parsed = ical.parseICS(text);

  const { start: windowStart, end: windowEnd } = windowBounds();
  const events = [];

  for (const comp of Object.values(parsed)) {
    if (comp.type !== 'VEVENT' || !comp.start) continue;

    if (comp.rrule) {
      events.push(...expandRecurring(comp, windowStart, windowEnd));
      continue;
    }

    if (comp.start < windowEnd && comp.end > windowStart) {
      events.push(toEvent(comp, comp.start, comp.end));
    }
  }

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
}
