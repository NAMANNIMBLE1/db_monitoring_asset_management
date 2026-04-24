export default function MetricCard({ label, value, sub, color }) {
  return (
    <div className="metric-card" style={color ? { borderLeftColor: color } : undefined}>
      <span className="metric-card__label">{label}</span>
      <span className="metric-card__value">{value ?? '--'}</span>
      {sub && <span className="metric-card__sub">{sub}</span>}
    </div>
  );
}
