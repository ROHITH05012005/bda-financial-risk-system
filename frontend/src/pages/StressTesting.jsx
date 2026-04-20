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
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-yellow-400" />
          Stress Testing Simulator
        </h2>
        <p className="text-slate-400 mt-1">What-If scenario analysis for portfolio resilience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Risk Type</label>
              <select
                value={riskType}
                onChange={(e) => setRiskType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
              >
                <option value="credit">Credit Risk</option>
                <option value="fraud">Fraud Detection</option>
              </select>
            </div>

            {riskType === 'credit' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Scenario</label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
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

            <div>
              <label className="block text-xs text-slate-400 mb-1">Sample Size: {sampleSize}</label>
              <input
                type="range"
                min={50}
                max={500}
                value={sampleSize}
                onChange={(e) => setSampleSize(parseInt(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={loading || (riskType === 'credit' && !selectedScenario)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Run Stress Test
            </button>
          </div>

          {riskType === 'credit' && scenarios.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-400 mb-3">Available Scenarios</h4>
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <div
                    key={s.name}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedScenario === s.name
                        ? 'bg-yellow-900/20 border-yellow-700/30'
                        : 'bg-slate-800/50 border-slate-700/30 hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedScenario(s.name)}
                  >
                    <p className="text-sm font-medium text-white">
                      {s.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {Object.entries(s.adjustments).map(([k, v]) => (
                        <span key={k} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
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

        <div className="lg:col-span-2 space-y-6">
          {result && riskType === 'credit' ? (
            <>
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={riskDistData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="level" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Original" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Stressed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Scenario Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-slate-300">Max individual increase: <span className="text-red-400 font-semibold">{(result.max_individual_increase * 100).toFixed(1)}%</span></span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                    <TrendingDown className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Scenario: <span className="text-yellow-400 font-semibold">{result.scenario}</span></span>
                  </div>
                </div>
              </div>
            </>
          ) : result && riskType === 'fraud' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Fraud Spike Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <MetricCard title="Original Avg Fraud Prob" value={`${(result.original_avg_fraud_prob * 100).toFixed(1)}%`} color="blue" />
                <MetricCard title="Stressed Avg Fraud Prob" value={`${(result.stressed_avg_fraud_prob * 100).toFixed(1)}%`} color="red" />
                <MetricCard title="Newly Flagged" value={result.flagged_increase.toString()} color="yellow" />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Select a scenario and run the stress test</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
