import { iconForCode, weekdayLabel } from '../weatherIcons.js';
import { CITY_LABEL } from '@station-assets/info.js';

export default function WeatherForecast({ weather }) {
  const daily = weather?.data?.daily;
  if (!daily || daily.length === 0) return null;

  return (
    <div className="forecast-panel">
      <div className="forecast-panel__header">🌤️ Previsão · {weather?.data?.cityLabel || CITY_LABEL}</div>
      {daily.map((d, i) => (
        <div className="forecast-row" key={d.date}>
          <span className="forecast-row__day">{weekdayLabel(d.date, i)}</span>
          <span className="forecast-row__icon">{iconForCode(d.code)}</span>
          <span className="forecast-row__temps">
            <span className="forecast-row__max">{d.max}°</span>
            <span className="forecast-row__min">{d.min}°</span>
          </span>
        </div>
      ))}
    </div>
  );
}
