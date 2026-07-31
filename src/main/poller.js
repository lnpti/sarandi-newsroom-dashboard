// Roda fetchFn imediatamente e depois a cada intervalMs, isolando erros por fonte:
// uma falha nunca apaga o último `data` bom, só marca status:'error'.
export function createPoller({ key, intervalMs, fetchFn, onResult }) {
  let timer = null;
  let stopped = false;
  let currentIntervalMs = intervalMs;

  async function tick() {
    onResult(key, { status: 'loading' });
    try {
      const data = await fetchFn();
      if (stopped) return;
      onResult(key, { status: 'ok', data, lastUpdated: Date.now(), error: null });
    } catch (err) {
      if (stopped) return;
      onResult(key, { status: 'error', error: err.message || String(err) });
    }
  }

  function start({ delayMs = 0 } = {}) {
    setTimeout(() => {
      if (stopped) return;
      tick();
      timer = setInterval(tick, currentIntervalMs);
    }, delayMs);
  }

  function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
  }

  function refreshNow() {
    return tick();
  }

  // Troca o intervalo em tempo real (usado pela tela de configurações),
  // sem precisar reiniciar o app.
  function setIntervalMs(newIntervalMs) {
    currentIntervalMs = newIntervalMs;
    if (timer) {
      clearInterval(timer);
      timer = setInterval(tick, currentIntervalMs);
    }
  }

  return { start, stop, refreshNow, setIntervalMs };
}
