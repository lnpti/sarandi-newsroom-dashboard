const WIDTH = 130;
const HEIGHT = 34;

export default function ListenerSparkline({ history }) {
  if (!history || history.length < 2) return null;

  const values = history.map((h) => h.current);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * WIDTH;
    const y = HEIGHT - ((h.current - min) / range) * HEIGHT;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = points[points.length - 1].split(',');

  return (
    <svg className="sparkline" width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <polyline points={points.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--accent)" />
    </svg>
  );
}
