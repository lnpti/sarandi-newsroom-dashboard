import { useEffect, useState } from 'react';

const STREAM_URL = 'https://vp090.voope.com.br/8052/;';
const SILENCE_THRESHOLD = 0.003;
const SILENCE_GRACE_MS = 8000;
const STALL_GRACE_MS = 12000;  // stall/waiting precisa persistir 12s para virar offline
const RETRY_DELAY_MS = 15000;

export function useStreamStatus() {
  const [status, setStatus] = useState('conectando');

  useEffect(() => {
    let active = true;
    let audio = null;
    let ctx = null;
    let rafId = null;
    let retryTimer = null;
    let stallTimer = null;
    let gen = 0; // geração: garante que callbacks de conexões antigas não interfiram

    function teardown() {
      cancelAnimationFrame(rafId);
      clearTimeout(retryTimer);
      clearTimeout(stallTimer);
      rafId = null;
      if (audio) {
        const a = audio;
        audio = null;
        a.pause();
        a.src = '';
      }
      if (ctx) {
        const c = ctx;
        ctx = null;
        c.close().catch(() => {});
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

      const c = new AudioContext();
      ctx = c;

      const analyser = c.createAnalyser();
      analyser.fftSize = 1024;

      const gain = c.createGain();
      gain.gain.value = 0;

      c.createMediaElementSource(a).connect(analyser);
      analyser.connect(gain);
      gain.connect(c.destination);

      const buffer = new Float32Array(analyser.fftSize);
      let silentSince = null;

      function analyze() {
        if (!active || gen !== myGen) return;
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        const rms = Math.sqrt(sum / buffer.length);

        if (rms > SILENCE_THRESHOLD) {
          silentSince = null;
          setStatus('ao-vivo');
        } else {
          if (silentSince === null) silentSince = Date.now();
          else if (Date.now() - silentSince >= SILENCE_GRACE_MS) setStatus('silencio');
        }
        rafId = requestAnimationFrame(analyze);
      }

      // Erro de rede: retry imediato após grace period
      function onHardError() {
        if (!active || gen !== myGen) return;
        setStatus('offline');
        teardown();
        retryTimer = setTimeout(setup, RETRY_DELAY_MS);
      }

      // Stall / waiting: só declara offline se persistir além de STALL_GRACE_MS
      function startStallTimer() {
        if (!active || gen !== myGen) return;
        clearTimeout(stallTimer);
        stallTimer = setTimeout(onHardError, STALL_GRACE_MS);
      }

      function onPlaying() {
        if (!active || gen !== myGen) return;
        clearTimeout(stallTimer);
        c.resume().then(analyze).catch(() => {});
      }

      a.addEventListener('playing', onPlaying);
      a.addEventListener('error', onHardError);
      a.addEventListener('stalled', startStallTimer);
      a.addEventListener('waiting', startStallTimer);

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
