import { iconForCode } from '../weatherIcons.js';

export default function WeatherWidget({ weather }) {
  const data = weather.data;
  if (!data || data.temp == null || Number.isNaN(data.temp)) return null;
  return (
    <div className="weather">
      <span className="weather__icon">{iconForCode(data.code)}</span>
      <span className="weather__temp">{data.temp}°C</span>
      <span className="weather__label">Sarandi</span>
    </div>
  );
}
