function formatMoney(v) {
  if (!v) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatYear(y) {
  if (y == null) return '';
  return y < 0 ? `${Math.abs(y)} a.C.` : String(y);
}

// ---- Fase da Lua (cálculo local, sem API) ----
const SYNODIC_DAYS = 29.530588853;
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14); // lua nova conhecida
const MOON_PHASES = [
  { name: 'Lua nova', icon: '🌑' },
  { name: 'Crescente', icon: '🌒' },
  { name: 'Quarto crescente', icon: '🌓' },
  { name: 'Crescente gibosa', icon: '🌔' },
  { name: 'Lua cheia', icon: '🌕' },
  { name: 'Minguante gibosa', icon: '🌖' },
  { name: 'Quarto minguante', icon: '🌗' },
  { name: 'Minguante', icon: '🌘' },
];

function moonPhase(date) {
  const cycle = (((date.getTime() - NEW_MOON_REF) / 86400000 / SYNODIC_DAYS) % 1 + 1) % 1;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * cycle)) / 2) * 100);
  return { ...MOON_PHASES[Math.round(cycle * 8) % 8], illumination };
}

// ---- Santo do dia ----
const LITURGICAL_COLORS = {
  branco: '#f4f4f0',
  verde: '#2e9d57',
  vermelho: '#d63a3a',
  roxo: '#7a4bd0',
  rosa: '#ee8fb5',
  azul: '#3b82f6',
  dourado: '#d4a017',
  preto: '#222',
};
const RANKS = /^(Memória|Memória facultativa|Solenidade|Festa|Domingo|Dia de semana)/i;

function splitSaint(nome) {
  const parts = (nome || '').split(', ');
  const last = parts[parts.length - 1];
  if (parts.length > 1 && RANKS.test(last)) {
    return { title: parts.slice(0, -1).join(', '), rank: last };
  }
  return { title: nome, rank: null };
}

function SaintHero({ saint }) {
  if (!saint?.nome) return null;
  const { title, rank } = splitSaint(saint.nome);
  const color = LITURGICAL_COLORS[(saint.cor || '').toLowerCase()] || 'var(--muted)';
  const readings = [
    ['Evangelho', saint.leituras?.evangelho],
    ['1ª leitura', saint.leituras?.primeira],
    ['Salmo', saint.leituras?.salmo],
    ['2ª leitura', saint.leituras?.segunda],
  ].filter(([, ref]) => ref);

  return (
    <section className="di-saint">
      <span className="di-saint__color" style={{ background: color }} title={saint.cor ? `Cor litúrgica: ${saint.cor}` : ''} />
      <div className="di-saint__main">
        <span className="di-saint__label">
          ✝️ Santo do dia{rank ? ` · ${rank}` : ''}
          {saint.cor ? ` · cor litúrgica ${saint.cor.toLowerCase()}` : ''}
        </span>
        <h2 className="di-saint__name">{title}</h2>
      </div>
      {readings.length > 0 && (
        <div className="di-saint__readings">
          {readings.map(([label, ref]) => (
            <span className="di-reading" key={label}>
              <span className="di-reading__label">{label}</span>
              <span className="di-reading__ref">{ref}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

// ---- Loterias ----
function LotteryCard({ game }) {
  return (
    <div className="di-lot">
      <div className="di-lot__head">
        <span className="di-lot__label">{game.label}</span>
        <span className="di-lot__concurso">#{game.concurso} · {game.data}</span>
      </div>
      <div className="di-lot__body">
        {game.dezenas.map((n) => (
          <span className="lottery-ball di-ball" key={n}>{n}</span>
        ))}
      </div>
      <div className="di-lot__foot">
        {game.acumulou ? (
          <span className="di-pill di-pill--warn">Acumulou!</span>
        ) : (
          <span className="di-pill">
            {game.ganhadores === 1 ? '1 ganhador' : `${game.ganhadores ?? 0} ganhadores`}
          </span>
        )}
        {game.estimativaProximo ? (
          <span className="di-lot__next">
            Próximo{game.dataProximo ? ` · ${game.dataProximo}` : ''}: <strong>{formatMoney(game.estimativaProximo)}</strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FederalCard({ game }) {
  return (
    <div className="di-lot">
      <div className="di-lot__head">
        <span className="di-lot__label">{game.label}</span>
        <span className="di-lot__concurso">#{game.concurso} · {game.data}</span>
      </div>
      <div className="di-fed">
        {game.tickets.map((t) => (
          <div className="di-fed__row" key={t.posicao}>
            <span className="di-fed__pos">{t.posicao}º</span>
            <span className="di-fed__num">{t.numero}</span>
            <span className="di-fed__premio">{formatMoney(t.premio)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Feriados ----
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

// Poucos itens e letra grande, pra ler de longe — o corte também vale pra
// dados antigos em cache, de quando o serviço mandava mais.
const HISTORY_ITEMS = 3;

function HistoryList({ title, icon, items: allItems }) {
  const items = (allItems || []).slice(0, HISTORY_ITEMS);
  if (!items.length) return null;
  return (
    <section className="di-panel">
      <h3 className="di-panel__title">{icon} {title}</h3>
      <div className="di-history">
        {items.map((it, i) => (
          <div className="di-history__item" key={`${it.year}-${i}`}>
            <span className="di-history__year">{formatYear(it.year)}</span>
            <span className="di-history__text">{it.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function KioskDailyInfoSlide({ lottery, holidays, saint, today }) {
  const games = lottery?.data || [];
  const holidayList = (holidays?.data || []).slice(0, 2);
  const info = today?.data;
  const now = new Date();
  const moon = moonPhase(now);
  // Sem efemérides/aniversariantes (ainda carregando ou fonte fora do ar), a coluna
  // do meio some e as outras ocupam o espaço — em vez de um buraco no layout.
  const hasHistory = Boolean(info?.events?.length || info?.births?.length);
  const dateTitle = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="kiosk-slide kiosk-slide--daily">
      <div className="kiosk-slide__header">📆 Hoje · {dateTitle}</div>
      <div className="di">
        <SaintHero saint={saint?.data} />

        <div className={`di-cols ${hasHistory ? '' : 'di-cols--two'}`}>
          <section className="di-panel di-panel--lottery">
            <h3 className="di-panel__title">🎰 Loterias</h3>
            <div className="di-lottery-grid">
              {games.map((g) =>
                g.key === 'federal' ? <FederalCard key={g.key} game={g} /> : <LotteryCard key={g.key} game={g} />
              )}
            </div>
          </section>

          {hasHistory && (
            <div className="di-stack">
              <HistoryList title="Hoje na história" icon="📜" items={info?.events} />
              <HistoryList title="Nasceram hoje" icon="🎂" items={info?.births} />
            </div>
          )}

          <div className="di-stack">
            {holidayList.length > 0 && (
              <section className="di-panel">
                <h3 className="di-panel__title">📅 Próximos feriados</h3>
                {holidayList.map((h, i) => (
                  <div className={`di-holiday ${i === 0 ? 'di-holiday--next' : ''}`} key={h.date}>
                    <div className="di-holiday__main">
                      <span className="di-holiday__name">{h.name}</span>
                      <span className="di-holiday__date">{formatHolidayDate(h.date)}</span>
                    </div>
                    <span className="di-pill di-pill--accent">{daysUntil(h.date)}</span>
                  </div>
                ))}
              </section>
            )}

            {info?.commemorative?.length > 0 && (
              <section className="di-panel">
                <h3 className="di-panel__title">🗓️ Datas de hoje</h3>
                <div className="di-tags">
                  {info.commemorative.map((c) => (
                    <span className="di-tag" key={c}>{c}</span>
                  ))}
                </div>
              </section>
            )}

            <section className="di-panel di-moon">
              <span className="di-moon__icon">{moon.icon}</span>
              <div className="di-moon__text">
                <span className="di-moon__name">{moon.name}</span>
                <span className="di-moon__sub">{moon.illumination}% iluminada</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
