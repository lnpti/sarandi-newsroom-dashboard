import { useEffect, useState } from 'react';

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

export default function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="clock">
      <span className="clock__time">{time}</span>
      <span className="clock__date">{DATE_FORMAT.format(now)}</span>
    </div>
  );
}
