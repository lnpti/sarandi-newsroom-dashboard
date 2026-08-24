// Apesar do `?json=1`, esse servidor Shoutcast sempre responde XML
// (`<SHOUTCASTSERVER><CURRENTLISTENERS>...`) — extrai os campos com regex
// em vez de puxar uma lib de XML só pra isso.
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? Number(match[1]) : 0;
}

export async function fetchStreamStatus(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar ouvintes (HTTP ${response.status})`);
  }
  const xml = await response.text();
  return {
    current: extractTag(xml, 'CURRENTLISTENERS'),
    peak: extractTag(xml, 'PEAKLISTENERS'),
    max: extractTag(xml, 'MAXLISTENERS'),
    streamStatus: extractTag(xml, 'STREAMSTATUS'), // 1 = online, 0 = offline
  };
}
