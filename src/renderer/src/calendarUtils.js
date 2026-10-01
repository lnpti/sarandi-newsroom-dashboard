// Chave "AAAA-MM-DD" do dia de um evento. Evento de dia inteiro vem como data
// pura (meia-noite UTC = a própria data); evento com horário vem como instante
// UTC e precisa virar a data LOCAL — senão um flash às 22h cai no dia seguinte
// (22h no Brasil já é o dia seguinte em UTC).
export function dayKey(ev) {
  if (ev.allDay) return ev.start.slice(0, 10);
  const d = new Date(ev.start);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Monta a data a partir dos componentes — new Date("AAAA-MM-DD") é meia-noite
// UTC e "volta" um dia ao exibir no fuso do Brasil.
export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayLabel(key, { long = false } = {}) {
  const target = dateFromKey(key);
  const today = new Date();
  const same = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(target, today)) return 'Hoje';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (same(target, tomorrow)) return 'Amanhã';
  return target.toLocaleDateString('pt-BR', long ? { weekday: 'long', day: '2-digit', month: '2-digit' } : { day: '2-digit', month: '2-digit' });
}

export function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function groupByDay(events) {
  const groups = [];
  for (const ev of events) {
    const key = dayKey(ev);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.events.push(ev);
    else groups.push({ key, events: [ev] });
  }
  return groups;
}
