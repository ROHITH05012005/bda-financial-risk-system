import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const riskColors = {
  LOW: 'var(--accent-green)',
  MEDIUM: 'var(--accent-yellow)',
  HIGH: 'var(--accent-red)',
  CRITICAL: 'var(--accent-purple)',
};

export default function RiskGauge({ value, riskLevel, size = 200 }) {
  const pct = Math.round(value * 100);
  const color = riskColors[riskLevel] || 'var(--accent-blue)';
  
  // Recharts needs actual color hexes, so CSS variables might not map seamlessly in all browsers depending on Recharts version,
  // but standard recharts handles CSS var parsing via getComputedStyle occasionally or we can pass raw hexes. 
  // For safety, let's pass hex variables explicitly, or depend on SVG's native css var support. Recharts usually handles it.
  const data = [
    { value: pct, color },
    { value: 100 - pct, color: 'var(--bg-surface-hover)' },
  ];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size, position: 'relative' }}>
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
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="text-3xl font-bold text-primary">{pct}%</span>
          <span
            className="text-xs font-semibold"
            style={{ 
              backgroundColor: `rgba(255,255,255,0.1)`, 
              color: color,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              marginTop: '0.25rem'
            }}
          >
            {riskLevel}
          </span>
        </div>
      </div>
    </div>
  );
}
