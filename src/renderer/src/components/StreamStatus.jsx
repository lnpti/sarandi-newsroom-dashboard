import { useEffect, useRef } from 'react';
import { useStreamStatus } from '../hooks/useStreamStatus.js';

const CONFIG = {
  'conectando': { dot: 'loading', label: 'stream…' },
  'ao-vivo':    { dot: 'ok',      label: 'ao vivo'  },
  'silencio':   { dot: 'warn',    label: 'silêncio' },
  'offline':    { dot: 'error',   label: 'offline'  },
};

// streamStatus vem do snapshot (listeners.data.streamStatus): 0=offline, 1=online
export default function StreamStatus({ streamStatus }) {
  const status = useStreamStatus(streamStatus);
  const { dot, label } = CONFIG[status] ?? CONFIG['conectando'];

  const prevRef = useRef(streamStatus);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = streamStatus;
    // transição online ↔ offline: verifica ouvintes em 5s para refletir a mudança
    if ((prev === 1 && streamStatus === 0) || (prev === 0 && streamStatus === 1)) {
      const t = setTimeout(() => window.dashboard.refreshNow('listeners'), 5000);
      return () => clearTimeout(t);
    }
  }, [streamStatus]);

  return (
    <div className={`stream-status stream-status--${dot}`} title={`Stream: ${label}`}>
      <span className={`status-dot status-dot--${dot}`} />
      <span className="stream-status__label">{label}</span>
    </div>
  );
}
