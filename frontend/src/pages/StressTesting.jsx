import { useState, useEffect } from 'react';
import { runStressTest, getScenarios } from '../services/api';
import MetricCard from '../components/MetricCard';
import { FlaskConical, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StressTesting() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [riskType, setRiskType] = useState('credit');
  const [sampleSize, setSampleSize] = useState(200);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => {});
  }, []);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await runStressTest({
        scenario: selectedScenario || null,
        risk_type: riskType,
        sample_size: sampleSize,
        custom_adjustments: null,
      });
      setResult(res);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const riskDistData = result && result.original_risk_distribution && result.stressed_risk_distribution
    ? ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => ({
        level,
        Original: result.original_risk_distribution[level]?.pct || 0,
        Stressed: result.stressed_risk_distribution[level]?.pct || 0,
      }))
    : [];

  return (
    <div className="animate-fade-in delay-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <FlaskConical className="color-yellow" style={{ width: '2rem', height: '2rem' }} />
          Stress Testing Simulator
        </h2>
        <p className="text-secondary mt-1">What-If scenario analysis for portfolio resilience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">Configuration</h3>

          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Risk Type</label>
              <select
                value={riskType}
                onChange={(e) => setRiskType(e.target.value)}
                className="select-field"
              >
                <option value="credit">Credit Risk</option>
                <option value="fraud">Fraud Detection</option>
              </select>
            </div>

            {riskType === 'credit' && (
              <div className="form-group">
                <label className="form-label">Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="select-field"
                >
                  <option value="">Select a scenario...</option>
                  {scenarios.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Sample Size: {sampleSize}</label>
              <input
                type="range"
                min={50}
                max={500}
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--accent-yellow)' }}
              />
            </div>

            <button
              onClick={handleRun}
              disabled={loading || (riskType === 'credit' && !selectedScenario)}
              className="btn w-full"
              style={{
                background: (loading || (riskType === 'credit' && !selectedScenario)) 
                  ? 'var(--bg-surface-hover)' 
                  : 'linear-gradient(135deg, var(--accent-yellow), #ca8a04)',
                color: (loading || (riskType === 'credit' && !selectedScenario)) ? 'var(--text-muted)' : 'black',
                boxShadow: (loading || (riskType === 'credit' && !selectedScenario)) ? 'none' : '0 4px 10px rgba(234, 179, 8, 0.3)',
                padding: '0.875rem'
              }}
            >
              {loading && <Loader2 className="animate-spin" style={{ width: '1rem', height: '1rem' }} />}
              Run Stress Test
            </button>
          </div>

          {riskType === 'credit' && scenarios.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-secondary mb-3">Available Scenarios</h4>
              <div className="flex flex-col gap-2">
                {scenarios.map((s) => (
                  <div
                    key={s.name}
                    className="glass-panel"
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      border: selectedScenario === s.name ? '1px solid var(--accent-yellow)' : '1px solid var(--border-light)',
                      background: selectedScenario === s.name ? 'rgba(234, 179, 8, 0.1)' : 'rgba(30, 37, 53, 0.6)'
                    }}
                    onClick={() => setSelectedScenario(s.name)}
                  >
                    <p className="text-sm font-medium text-primary">
                      {s.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {Object.entries(s.adjustments).map(([k, v]) => (
                        <span key={k} style={{ fontSize: '0.7rem', background: 'var(--bg-primary)', color: 'var(--text-secondary)', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                          {k}: {v > 0 ? '+' : ''}{typeof v === 'number' && v < 1 ? `${((v - 1) * 100).toFixed(0)}%` : v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6" style={{ gridColumn: 'span 2' }}>
          {result && riskType === 'credit' ? (
            <div className="animate-fade-in flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-4">
                <MetricCard title="Original Avg Default" value={`${(result.original_avg_probability * 100).toFixed(1)}%`} color="blue" />
                <MetricCard title="Stressed Avg Default" value={`${(result.stressed_avg_probability * 100).toFixed(1)}%`} color="red" />
                <MetricCard
                  title="Probability Increase"
                  value={`+${result.pct_increase.toFixed(1)}%`}
                  color={result.pct_increase > 50 ? 'red' : 'yellow'}
                />
              </div>

              {riskDistData.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-primary mb-4">Risk Distribution Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={riskDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="level" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Original" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Stressed" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="card">
                <h3 className="text-lg font-semibold text-primary mb-4">Scenario Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-4 glass-panel">
                    <TrendingUp className="color-red" style={{ width: '1rem', height: '1rem' }} />
                    <span className="text-sm text-secondary">
                      Max increase: <span className="color-red font-semibold">{(result.max_individual_increase * 100).toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-4 glass-panel">
                    <TrendingDown className="color-blue" style={{ width: '1rem', height: '1rem' }} />
                    <span className="text-sm text-secondary">
                      Scenario: <span className="color-yellow font-semibold">{result.scenario}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : result && riskType === 'fraud' ? (
            <div className="card animate-fade-in">
              <h3 className="text-lg font-semibold text-primary mb-4">Fraud Spike Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <MetricCard title="Original Avg Fraud Prob" value={`${(result.original_avg_fraud_prob * 100).toFixed(1)}%`} color="blue" />
                <MetricCard title="Stressed Avg Fraud Prob" value={`${(result.stressed_avg_fraud_prob * 100).toFixed(1)}%`} color="red" />
                <MetricCard title="Newly Flagged" value={result.flagged_increase.toString()} color="yellow" />
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center text-secondary py-12 h-full">
              <FlaskConical style={{ width: '4rem', height: '4rem', opacity: 0.3, marginBottom: '1rem' }} />
              <p>Select a scenario and run the stress test</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
