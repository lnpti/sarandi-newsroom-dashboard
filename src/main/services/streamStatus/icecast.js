// Icecast status-json.xsl: icestats.source existe (objeto ou array não-vazio)
// quando há uma fonte conectada e transmitindo; ausente/vazio = offline.
export async function fetchStreamStatus(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar status do stream (HTTP ${response.status})`);
  }
  const json = await response.json();
  const source = json?.icestats?.source;
  const active = Array.isArray(source) ? source[0] : source;

  if (!active) {
    return { current: 0, peak: 0, max: 0, streamStatus: 0 };
  }

  return {
    current: Number(active.listeners) || 0,
    peak: Number(active.listener_peak) || 0,
    max: 0, // Icecast não define um teto fixo de ouvintes como o Shoutcast
    streamStatus: 1,
  };
}
