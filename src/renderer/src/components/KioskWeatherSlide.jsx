import { iconForCode, weekdayLabel } from '../weatherIcons.js';
import { CITY_LABEL } from '@station-assets/info.js';

// Os horários já vêm no fuso da estação (parâmetro `timezone` da chamada à
// API) como string local sem offset — pega só o "HH:MM" em vez de passar
// pelo Date (que reinterpretaria pelo fuso da máquina rodando o app).
function formatTime(iso) {
  return iso?.split('T')[1]?.slice(0, 5) || '';
}

export default function KioskWeatherSlide({ weather }) {
  const data = weather?.data;
  const daily = data?.daily || [];
  const hourly = data?.hourly || [];

  return (
    <div className="kiosk-slide kiosk-slide--weather">
      <div className="kiosk-slide__header">🌤️ Previsão do Tempo · {data?.cityLabel || CITY_LABEL}</div>
      <div className="kiosk-slide__body kiosk-weather">
        {data && data.temp != null && !Number.isNaN(data.temp) && (
          <div className="kiosk-weather__now">
            <span className="kiosk-weather__now-icon">{iconForCode(data.code)}</span>
            <span className="kiosk-weather__now-temp">{data.temp}°C</span>
          </div>
        )}
        {data && (
          <div className="kiosk-weather__extra">
            {data.windSpeed != null && (
              <div className="kiosk-weather__extra-item">
                <span className="kiosk-weather__extra-icon">💨</span>
                <span className="kiosk-weather__extra-value">{data.windSpeed} km/h</span>
                <span className="kiosk-weather__extra-label">Vento</span>
              </div>
            )}
            {data.uvIndex != null && (
              <div className="kiosk-weather__extra-item">
                <span className="kiosk-weather__extra-icon">☀️</span>
                <span className="kiosk-weather__extra-value">{Math.round(data.uvIndex)}</span>
                <span className="kiosk-weather__extra-label">Índice UV</span>
              </div>
            )}
            {data.sunrise && (
              <div className="kiosk-weather__extra-item">
                <span className="kiosk-weather__extra-icon">🌅</span>
                <span className="kiosk-weather__extra-value">{formatTime(data.sunrise)}</span>
                <span className="kiosk-weather__extra-label">Nascer do sol</span>
              </div>
            )}
            {data.sunset && (
              <div className="kiosk-weather__extra-item">
                <span className="kiosk-weather__extra-icon">🌇</span>
                <span className="kiosk-weather__extra-value">{formatTime(data.sunset)}</span>
                <span className="kiosk-weather__extra-label">Pôr do sol</span>
              </div>
            )}
          </div>
        )}
        {hourly.length > 0 && (
          <div className="kiosk-weather__hourly">
            {hourly.map((h) => (
              <div className="kiosk-weather__hour" key={h.time}>
                <span className="kiosk-weather__hour-time">{formatTime(h.time)}</span>
                <span className="kiosk-weather__hour-icon">{iconForCode(h.code)}</span>
                <span className="kiosk-weather__hour-temp">{h.temp}°</span>
                {h.precipProb > 0 && <span className="kiosk-weather__hour-rain">💧{h.precipProb}%</span>}
              </div>
            ))}
          </div>
        )}
        <div className="kiosk-weather__forecast">
          {daily.map((d, i) => (
            <div className="kiosk-weather__day" key={d.date}>
              <span className="kiosk-weather__day-label">{weekdayLabel(d.date, i)}</span>
              <span className="kiosk-weather__day-icon">{iconForCode(d.code)}</span>
              <span className="kiosk-weather__day-max">{d.max}°</span>
              <span className="kiosk-weather__day-min">{d.min}°</span>
            </div>
          ))}
        </div>
        {data?.extraCities?.length > 0 && (
          <div className="kiosk-weather__cities">
            {data.extraCities.map((c) => (
              <div className="kiosk-weather__city" key={c.label}>
                <span className="kiosk-weather__city-icon">{iconForCode(c.code)}</span>
                <span className="kiosk-weather__city-temp">{c.temp}°</span>
                <span className="kiosk-weather__city-label">{c.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
