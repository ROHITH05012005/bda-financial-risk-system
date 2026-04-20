export default function MetricCard({ title, value, subtitle, color = 'blue' }) {
  const colorMap = {
    blue: 'from-blue-600/20 to-blue-800/10 border-blue-500/20',
    green: 'from-green-600/20 to-green-800/10 border-green-500/20',
    red: 'from-red-600/20 to-red-800/10 border-red-500/20',
    yellow: 'from-yellow-600/20 to-yellow-800/10 border-yellow-500/20',
    purple: 'from-purple-600/20 to-purple-800/10 border-purple-500/20',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color] || colorMap.blue} border rounded-xl p-5`}
    >
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
