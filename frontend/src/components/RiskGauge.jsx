import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const riskColors = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#ef4444',
  CRITICAL: '#a855f7',
};

export default function RiskGauge({ value, riskLevel, size = 200 }) {
  const pct = Math.round(value * 100);
  const color = riskColors[riskLevel] || '#3b82f6';
  const data = [
    { value: pct, color },
    { value: 100 - pct, color: '#1e293b' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{pct}%</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
            style={{ backgroundColor: color + '30', color }}
          >
            {riskLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
