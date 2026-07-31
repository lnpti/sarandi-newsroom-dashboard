export default function SaintPanel({ saint }) {
  const data = saint?.data;
  if (!data || !data.nome) return null;

  return (
    <div className="side-panel">
      <div className="side-panel__header">✝️ Santo do dia</div>
      <div className="saint-row">
        <span className="saint-row__name">{data.nome}</span>
        {data.cor && <span className="saint-row__cor">Cor litúrgica: {data.cor}</span>}
      </div>
    </div>
  );
}
