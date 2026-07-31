import { LISTENER_STATS_URL } from '../config.js';

// Apesar do `?json=1`, esse servidor Shoutcast sempre responde XML
// (`<SHOUTCASTSERVER><CURRENTLISTENERS>...`) — extrai os 3 campos com regex
// em vez de puxar uma lib de XML só pra isso.
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? Number(match[1]) : 0;
}

export async function fetchListeners() {
  const response = await fetch(LISTENER_STATS_URL);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ouvintes (HTTP ${response.status})`);
  }
  const xml = await response.text();
  return {
    current: extractTag(xml, 'CURRENTLISTENERS'),
    peak: extractTag(xml, 'PEAKLISTENERS'),
    max: extractTag(xml, 'MAXLISTENERS'),
  };
}
