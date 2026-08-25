function formatMoney(v) {
  if (!v) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function LotteryCard({ game }) {
  return (
    <div className="kiosk-lottery-card">
      <div className="kiosk-lottery-card__head">
        <span className="kiosk-lottery-card__label">{game.label}</span>
        <span className="kiosk-lottery-card__concurso">#{game.concurso} · {game.data}</span>
      </div>
      <div className="kiosk-lottery-card__dezenas">
        {game.dezenas.map((n) => (
          <span className="lottery-ball" key={n}>
            {n}
          </span>
        ))}
      </div>
      <div className="kiosk-lottery-card__foot">
        {game.acumulou ? (
          <span>
            Acumulou! Próximo: <strong>{formatMoney(game.estimativaProximo) || '—'}</strong>
          </span>
        ) : (
          <span>{game.ganhadores === 1 ? '1 ganhador' : `${game.ganhadores} ganhadores`}</span>
        )}
      </div>
    </div>
  );
}

function formatHolidayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} · ${weekday}`;
}

function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  return `em ${diff} dias`;
}

export default function KioskDailyInfoSlide({ lottery, holidays, saint }) {
  const games = lottery?.data || [];
  const holidayList = (holidays?.data || []).slice(0, 3);
  const saintData = saint?.data;

  return (
    <div className="kiosk-slide kiosk-slide--daily">
      <div className="kiosk-slide__header">Loterias · Feriados · Santo do Dia</div>
      <div className="kiosk-slide__body kiosk-daily">
        {saintData?.nome && (
          <div className="kiosk-daily__saint">
            <span className="kiosk-daily__saint-label">✝️ Santo do dia:</span>
            <span className="kiosk-daily__saint-name">{saintData.nome}</span>
            {saintData.cor && <span className="kiosk-daily__saint-cor">Cor litúrgica: {saintData.cor}</span>}
          </div>
        )}
        <div className="kiosk-daily__columns">
          <div className="kiosk-daily__col">
            <div className="kiosk-sports__group-title">📅 Próximos feriados</div>
            {holidayList.map((h, i) => (
              <div className={`kiosk-holiday-row ${i === 0 ? 'kiosk-holiday-row--next' : ''}`} key={h.date}>
                <div className="kiosk-holiday-row__main">
                  <span className="kiosk-holiday-row__name">{h.name}</span>
                  <span className="kiosk-holiday-row__date">{formatHolidayDate(h.date)}</span>
                </div>
                <span className="kiosk-holiday-row__until">{daysUntil(h.date)}</span>
              </div>
            ))}
          </div>
          <div className="kiosk-daily__col">
            <div className="kiosk-sports__group-title">🎰 Loterias</div>
            <div className="kiosk-lottery-grid">
              {games.map((g) => (
                <LotteryCard key={g.key} game={g} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
