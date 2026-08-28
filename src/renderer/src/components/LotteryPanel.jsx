function formatMoney(v) {
  if (!v) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function FederalResult({ game }) {
  return (
    <div className="lottery-row">
      <div className="lottery-row__head">
        <span className="lottery-row__label">{game.label}</span>
        <span className="lottery-row__concurso">#{game.concurso} · {game.data}</span>
      </div>
      <div className="lottery-federal">
        {game.tickets.map((t) => (
          <div className="lottery-federal__ticket" key={t.posicao}>
            <span className="lottery-federal__pos">{t.posicao}º</span>
            <span className="lottery-federal__num">{t.numero}</span>
            <span className="lottery-federal__premio">{formatMoney(t.premio)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameResult({ game }) {
  return (
    <div className="lottery-row">
      <div className="lottery-row__head">
        <span className="lottery-row__label">{game.label}</span>
        <span className="lottery-row__concurso">#{game.concurso} · {game.data}</span>
      </div>
      <div className="lottery-row__dezenas">
        {game.dezenas.map((n) => (
          <span className="lottery-ball" key={n}>
            {n}
          </span>
        ))}
      </div>
      <div className="lottery-row__foot">
        {game.acumulou ? (
          <span>
            Acumulou! Próximo: <strong>{formatMoney(game.estimativaProximo) || '—'}</strong>
          </span>
        ) : (
          <span>
            {game.ganhadores === 1 ? '1 ganhador' : `${game.ganhadores} ganhadores`}
          </span>
        )}
      </div>
    </div>
  );
}

export default function LotteryPanel({ lottery }) {
  const games = lottery?.data;
  if (!games || games.length === 0) return null;

  return (
    <div className="side-panel">
      <div className="side-panel__header">🎰 Loterias</div>
      {games.map((g) =>
        g.key === 'federal' ? <FederalResult key={g.key} game={g} /> : <GameResult key={g.key} game={g} />
      )}
    </div>
  );
}
