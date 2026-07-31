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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function weekdayLabel(dateStr, index) {
  if (index === 0) return 'Hoje';
  // dateStr é "YYYY-MM-DD" (data local); monta como local pra não deslocar o dia
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}
