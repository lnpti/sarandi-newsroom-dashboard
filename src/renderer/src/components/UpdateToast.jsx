import { useEffect, useState } from 'react';

export default function UpdateToast() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const unsub = window.dashboard.onUpdaterStatus?.((payload) => setState(payload));
    return () => unsub && unsub();
  }, []);

  if (!state) return null;

  let text = null;
  if (state.status === 'available') text = `Nova versão ${state.version || ''} disponível — baixando…`;
  else if (state.status === 'downloading') text = `Baixando atualização… ${state.percent ?? 0}%`;
  else if (state.status === 'downloaded') text = `Atualização pronta — reiniciando…`;
  // 'checking', 'idle' e 'error' ficam silenciosos pra não incomodar

  if (!text) return null;

  return (
    <div className="update-toast">
      <span className="update-toast__spinner" />
      {text}
    </div>
  );
}
