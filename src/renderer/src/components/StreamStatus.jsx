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

  return (
    <div className={`stream-status stream-status--${dot}`} title={`Stream: ${label}`}>
      <span className={`status-dot status-dot--${dot}`} />
      <span className="stream-status__label">{label}</span>
    </div>
  );
}
