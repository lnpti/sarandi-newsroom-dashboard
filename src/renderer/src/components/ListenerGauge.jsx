// Pico de hoje calculado a partir do histórico que o próprio app registra
// (máximo de ouvintes desde a meia-noite local). Ao contrário do PEAKLISTENERS
// do Shoutcast — que é o pico desde que o servidor de streaming foi ligado e
// pode ficar "travado" por dias — este reseta todo dia.
function peakToday(history, current) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const t0 = startOfDay.getTime();
  let peak = current ?? 0;
  for (const h of history || []) {
    if (h.t >= t0 && h.current > peak) peak = h.current;
  }
  return peak;
}

export default function ListenerGauge({ listeners, history }) {
  const data = listeners.data;
  return (
    <div className="listener-gauge">
      <span className="listener-gauge__number">{data ? data.current : '—'}</span>
      <span className="listener-gauge__label">ouvintes online</span>
      {data && (
        <span className="listener-gauge__secondary">pico hoje: {peakToday(history, data.current)}</span>
      )}
    </div>
  );
}
