export default function MetricCard({ label, value, hint }) {
  return (
    <div className="metric-card">
      <p>{label}</p>
      <h3>{value}</h3>
      {hint && <span>{hint}</span>}
    </div>
  );
}