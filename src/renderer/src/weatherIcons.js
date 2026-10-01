// Códigos WMO da Open-Meteo — https://open-meteo.com/en/docs
export function iconForCode(code) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

export function descriptionForCode(code) {
  if (code === 0) return 'Céu limpo';
  if (code === 1) return 'Predomínio de sol';
  if (code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code === 45 || code === 48) return 'Neblina';
  if (code >= 51 && code <= 57) return 'Garoa';
  if (code >= 61 && code <= 67) return 'Chuva';
  if (code >= 71 && code <= 77) return 'Neve';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 95) return 'Tempestade';
  return 'Tempo variável';
}

// Agrupa o código WMO numa "atmosfera" pro fundo do cartão principal.
export function moodForCode(code) {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 95) return 'storm';
  if (code >= 51) return 'rain';
  return 'cloudy';
}

const WEEKDAYS =['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function weekdayLabel(dateStr, index) {
  if (index === 0) return 'Hoje';
  // dateStr é "YYYY-MM-DD" (data local); monta como local pra não deslocar o dia
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}
