// streamStatus vem do snapshot (listeners.data.streamStatus): 0=offline, 1=online
export function useStreamStatus(streamStatus) {
  if (streamStatus === 1) return 'ao-vivo';
  if (streamStatus === 0) return 'offline';
  return 'conectando'; // ainda carregando snapshot
}
