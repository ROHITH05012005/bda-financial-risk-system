export default function MetricCard({ title, value, subtitle, color = 'blue' }) {
  return (
    <div className={`card glass-panel metric-card bg-${color}-transparent`}>
      <p className="text-sm text-secondary mb-1">{title}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
