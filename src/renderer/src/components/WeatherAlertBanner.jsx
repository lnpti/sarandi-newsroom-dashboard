// Ticker rolante na base do app (estilo plantão de TV). Junta todos os alertas
// ativos numa faixa contínua; a cor vem da severidade do alerta mais grave.
export default function WeatherAlertBanner({ weatherAlerts }) {
  const alerts = weatherAlerts?.data;
  if (!alerts || alerts.length === 0) return null;

  const top = alerts[0];
  const text = alerts
    .map((a) => {
      const risco = a.riscos?.[0] ? ` — ${a.riscos[0]}` : '';
      return `${a.severidade}: ${a.descricao}${risco}`;
    })
    .join('      •      ');

  // duplica o texto pra rolagem contínua sem "buraco"; velocidade proporcional
  // ao tamanho pra manter ritmo de leitura constante.
  const duration = Math.max(20, Math.round(text.length / 6));

  return (
    <div className="alert-ticker">
      <span className="alert-ticker__tag" style={{ background: top.cor }}>
        ⚠ Alerta {alerts.length > 1 ? `(${alerts.length})` : ''}
      </span>
      <div className="alert-ticker__viewport">
        <div className="alert-ticker__track" style={{ animationDuration: `${duration}s` }}>
          <span className="alert-ticker__text">{text}</span>
          <span className="alert-ticker__text" aria-hidden="true">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
