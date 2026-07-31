import { useEffect, useState } from 'react';

const STREAM_URL = 'https://vp090.voope.com.br/8052/;';
const STALL_GRACE_MS = 15000; // aguarda 15s de stall antes de declarar offline
const RETRY_DELAY_MS = 15000; // intervalo entre tentativas após erro

export function useStreamStatus() {
  const [status, setStatus] = useState('conectando');

  useEffect(() => {
    let active = true;
    let audio = null;
    let retryTimer = null;
    let stallTimer = null;
    let gen = 0;

    function teardown() {
      clearTimeout(retryTimer);
      clearTimeout(stallTimer);
      if (audio) {
        const a = audio;
        audio = null;
        a.pause();
        a.src = '';
      }
    }

    function setup() {
      teardown();
      if (!active) return;

      const myGen = ++gen;
      setStatus('conectando');

      const a = new Audio();
      a.muted = true;
      audio = a;

      function onPlaying() {
        if (!active || gen !== myGen) return;
        clearTimeout(stallTimer);
        setStatus('ao-vivo');
      }

      function onHardError() {
        if (!active || gen !== myGen) return;
        setStatus('offline');
        teardown();
        retryTimer = setTimeout(setup, RETRY_DELAY_MS);
      }

      // stalled/waiting: só declara offline se o problema persistir
      function startStallTimer() {
        if (!active || gen !== myGen) return;
        clearTimeout(stallTimer);
        stallTimer = setTimeout(onHardError, STALL_GRACE_MS);
      }

      // se estava ao vivo e parar de receber dados, inicia timer de stall
      function onPause() {
        if (!active || gen !== myGen) return;
        startStallTimer();
      }

      a.addEventListener('playing', onPlaying);
      a.addEventListener('error', onHardError);
      a.addEventListener('stalled', startStallTimer);
      a.addEventListener('waiting', startStallTimer);
      a.addEventListener('pause', onPause);

      a.src = STREAM_URL;
      a.play().catch(onHardError);
    }

    setup();

    return () => {
      active = false;
      teardown();
    };
  }, []);

  return status;
}
