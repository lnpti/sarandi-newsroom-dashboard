import { useEffect, useState } from 'react';

export function useDashboardSnapshot() {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    window.dashboard.getSnapshot().then((initial) => {
      if (!cancelled) setSnapshot(initial);
    });
    const unsubscribe = window.dashboard.onUpdate((next) => setSnapshot(next));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return snapshot;
}
