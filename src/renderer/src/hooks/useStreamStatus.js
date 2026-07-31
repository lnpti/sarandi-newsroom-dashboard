import { useEffect, useState } from 'react';

const STREAM_URL = 'https://vp090.voope.com.br/8052/;';
const SILENCE_THRESHOLD = 0.01;
const SILENCE_GRACE_MS = 5_000;

// streamStatus: undefined (carregando) | 0 (offline) | 1 (online)
export function useStreamStatus(streamStatus) {
  const [status, setStatus] = useState('conectando');

  useEffect(() => {
    let active = true;
    let audio = null;
    let ctx = null;
    let analyser = null;
    let rafId = null;
    let silentSince = null;

    function stopAudio() {
      cancelAnimationFrame(rafId);
      rafId = null;
      silentSince = null;
      if (audio) { audio.pause(); audio.src = ''; audio = null; }
      if (ctx) { ctx.close().catch(() => {}); ctx = null; analyser = null; }
    }

    function runAnalysis() {
      if (!active || !analyser) return;
      const buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      if (rms > SILENCE_THRESHOLD) {
        silentSince = null;
        setStatus('ao-vivo');
      } else {
        if (!silentSince) silentSince = Date.now();
        else if (Date.now() - silentSince >= SILENCE_GRACE_MS) setStatus('silencio');
      }
      rafId = requestAnimationFrame(runAnalysis);
    }

    // snapshot ainda carregando
    if (streamStatus === undefined || streamStatus === null) {
      return () => { active = false; };
    }

    // offline segundo o servidor
    if (streamStatus !== 1) {
      setStatus('offline');
      return () => { active = false; stopAudio(); };
    }

    // online — mostra ao-vivo de imediato e tenta análise de silêncio
    setStatus((prev) => (prev === 'conectando' || prev === 'offline' ? 'ao-vivo' : prev));

    try {
      audio = new Audio();
      audio.muted = true;

      ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      ctx.createMediaElementSource(audio).connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      audio.addEventListener('playing', () => {
        if (!active) return;
        ctx.resume().then(runAnalysis).catch(() => { if (active) setStatus('ao-vivo'); });
      });
      audio.addEventListener('error', () => { if (active) setStatus('ao-vivo'); });

      audio.src = STREAM_URL;
      audio.play().catch(() => { if (active) setStatus('ao-vivo'); });
    } catch {
      // Web Audio API indisponível — permanece ao-vivo
    }

    return () => { active = false; stopAudio(); };
  }, [streamStatus]);

  return status;
}
