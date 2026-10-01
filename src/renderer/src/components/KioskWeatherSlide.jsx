import { descriptionForCode, iconForCode, moodForCode, weekdayLabel } from '../weatherIcons.js';
import { CITY_LABEL } from '@station-assets/info.js';

// Os horários já vêm no fuso da estação (parâmetro `timezone` da chamada à
// API) como string local sem offset — pega só o "HH:MM" em vez de passar
// pelo Date (que reinterpretaria pelo fuso da máquina rodando o app).
function formatTime(iso) {
  return iso?.split('T')[1]?.slice(0, 5) || '';
}

function Stat({ icon, value, label }) {
  return (
    <div className="wx-stat">
      <span className="wx-stat__icon">{icon}</span>
      <span className="wx-stat__value">{value}</span>
      <span className="wx-stat__label">{label}</span>
    </div>
  );
}

export default function KioskWeatherSlide({ weather }) {
  const data = weather?.data;
  const daily = data?.daily || [];
  const hourly = data?.hourly || [];
  const extraCities = data?.extraCities || [];
  const hasNow = data && data.temp != null && !Number.isNaN(data.temp);

  // Faixa de temperatura da semana inteira — cada dia desenha sua barra de
  // mínima→máxima dentro dela, pra dar pra comparar os dias de relance.
  const weekMin = daily.length ? Math.min(...daily.map((d) => d.min)) : 0;
  const weekMax = daily.length ? Math.max(...daily.map((d) => d.max)) : 0;
  const weekRange = Math.max(weekMax - weekMin, 1);

  return (
    <div className="kiosk-slide kiosk-slide--weather">
      <div className="kiosk-slide__header">🌤️ Previsão do Tempo · {data?.cityLabel || CITY_LABEL}</div>
      <div className={`wx ${extraCities.length > 0 ? 'wx--with-cities' : ''}`}>
        <div className="wx__main">
          <div className="wx__top">
            {hasNow && (
              <section className={`wx-hero wx-hero--${moodForCode(data.code)}`}>
                <div className="wx-hero__where">Agora em {data?.cityLabel || CITY_LABEL}</div>
                <div className="wx-hero__row">
                  <span className="wx-hero__icon">{iconForCode(data.code)}</span>
                  <span className="wx-hero__temp">{data.temp}°</span>
                </div>
                <div className="wx-hero__desc">{descriptionForCode(data.code)}</div>
                {daily[0] && (
                  <div className="wx-hero__range">
                    Máx <strong>{daily[0].max}°</strong> · Mín <strong>{daily[0].min}°</strong>
                  </div>
                )}
              </section>
            )}
            {data && (
              <section className="wx-stats">
                {data.windSpeed != null && <Stat icon="💨" value={`${data.windSpeed} km/h`} label="Vento" />}
                {data.uvIndex != null && <Stat icon="🕶️" value={Math.round(data.uvIndex)} label="Índice UV" />}
                {data.sunrise && <Stat icon="🌅" value={formatTime(data.sunrise)} label="Nascer do sol" />}
                {data.sunset && <Stat icon="🌇" value={formatTime(data.sunset)} label="Pôr do sol" />}
              </section>
            )}
          </div>

          {hourly.length > 0 && (
            <section className="wx-card wx-hourly">
              <h3 className="wx-card__title">Próximas horas</h3>
              <div className="wx-hourly__grid">
                {hourly.map((h, i) => (
                  <div className="wx-hour" key={h.time}>
                    <span className="wx-hour__time">{i === 0 ? 'Agora' : formatTime(h.time)}</span>
                    <span className="wx-hour__icon">{iconForCode(h.code)}</span>
                    <span className="wx-hour__temp">{h.temp}°</span>
                    <span className="wx-hour__rain">{h.precipProb > 0 ? `💧 ${h.precipProb}%` : ' '}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {daily.length > 0 && (
            <section className="wx-card wx-daily">
              <h3 className="wx-card__title">Próximos dias</h3>
              <div className="wx-daily__grid">
                {daily.map((d, i) => {
                  const left = ((d.min - weekMin) / weekRange) * 100;
                  const width = Math.max(((d.max - d.min) / weekRange) * 100, 8);
                  return (
                    <div className="wx-day" key={d.date}>
                      <span className="wx-day__label">{weekdayLabel(d.date, i)}</span>
                      <span className="wx-day__icon">{iconForCode(d.code)}</span>
                      <span className="wx-day__max">{d.max}°</span>
                      <div className="wx-day__bar">
                        <span className="wx-day__bar-fill" style={{ left: `${left}%`, width: `${width}%` }} />
                      </div>
                      <span className="wx-day__min">{d.min}°</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {extraCities.length > 0 && (
          <aside className="wx-card wx-cities">
            <h3 className="wx-card__title">Outras cidades</h3>
            <div className="wx-cities__list">
              {extraCities.map((c) => (
                <div className="wx-city" key={c.label}>
                  <span className="wx-city__icon">{iconForCode(c.code)}</span>
                  <span className="wx-city__label">{c.label}</span>
                  <span className="wx-city__temp">{c.temp}°</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
