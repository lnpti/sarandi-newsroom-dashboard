import { useEffect, useState } from 'react';

function formatRelative(timestamp) {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `há ${hours}h`;
}

export default function RelativeTime({ timestamp }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, []);

  return <span>{formatRelative(timestamp)}</span>;
}
