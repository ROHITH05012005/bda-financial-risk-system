import { useState } from 'react';
import { predictFraud, explainFraud } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import MetricCard from '../components/MetricCard';
import { Search, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const defaultForm = {
  amount: 100, hour_of_day: 14, day_of_week: 2, is_weekend: 0,
  merchant_category: 3, distance_from_home: 5, distance_from_last_transaction: 2,
  ratio_to_median_amount: 1.0, is_online: 0, is_international: 0,
  txn_count_1h: 1, txn_count_24h: 5, avg_amount_7d: 100, std_amount_7d: 200,
};

export default function FraudDetection() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const handleChange = (field, value) => {
    const v = field.startsWith('is_') ? parseInt(value) : (parseFloat(value) || 0);
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictFraud(form);
      setResult(res);
      if (showExplain) {
        const exp = await explainFraud(form);
        setExplanation(exp.explanation);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const fields = [
    { key: 'amount', label: 'Transaction Amount ($)', min: 1, max: 50000, step: 10 },
    { key: 'hour_of_day', label: 'Hour of Day', min: 0, max: 23, step: 1 },
    { key: 'day_of_week', label: 'Day of Week (0=Mon)', min: 0, max: 6, step: 1 },
    { key: 'merchant_category', label: 'Merchant Category (0-9)', min: 0, max: 9, step: 1 },
    { key: 'distance_from_home', label: 'Distance from Home (km)', min: 0, max: 500, step: 1 },
    { key: 'distance_from_last_transaction', label: 'Dist from Last Txn (km)', min: 0, max: 300, step: 1 },
    { key: 'ratio_to_median_amount', label: 'Ratio to Median Amount', min: 0.01, max: 20, step: 0.1 },
    { key: 'txn_count_1h', label: 'Txn Count (1h)', min: 0, max: 30, step: 1 },
    { key: 'txn_count_24h', label: 'Txn Count (24h)', min: 0, max: 80, step: 1 },
    { key: 'avg_amount_7d', label: 'Avg Amount (7d)', min: 1, max: 10000, step: 10 },
    { key: 'std_amount_7d', label: 'Std Amount (7d)', min: 0, max: 15000, step: 10 },
  ];

  const toggleFields = [
    { key: 'is_online', label: 'Online Transaction' },
    { key: 'is_international', label: 'International Transaction' },
    { key: 'is_weekend', label: 'Weekend Transaction' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Search className="w-8 h-8 text-red-400" />
          Fraud Detection
        </h2>
        <p className="text-slate-400 mt-1">Dual-model scoring: Gradient Boosting classifier + Isolation Forest anomaly detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fields.map(({ key, label, min, max, step }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {toggleFields.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key] === 1}
                    onChange={(e) => handleChange(key, e.target.checked ? '1' : '0')}
                    className="rounded border-slate-600"
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Detect Fraud
              </button>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showExplain}
                  onChange={(e) => setShowExplain(e.target.checked)}
                  className="rounded border-slate-600"
                />
                Include feature explanation
              </label>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
          {result ? (
            <>
              <h3 className="text-sm font-semibold text-slate-400 mb-4">FRAUD ASSESSMENT</h3>
              <RiskGauge value={result.combined_risk_score} riskLevel={result.risk_level} size={180} />
              <div className="mt-4 space-y-2 w-full">
                <MetricCard title="Fraud Probability" value={`${(result.fraud_probability * 100).toFixed(1)}%`} color="red" />
                <MetricCard title="Combined Risk" value={`${(result.combined_risk_score * 100).toFixed(1)}%`} color={result.risk_level === 'LOW' ? 'green' : 'yellow'} />
                <div className={`flex items-center gap-2 p-3 rounded-lg ${result.is_anomaly ? 'bg-red-900/30 border border-red-700/30' : 'bg-green-900/30 border border-green-700/30'}`}>
                  {result.is_anomaly ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  <span className={`text-sm font-medium ${result.is_anomaly ? 'text-red-400' : 'text-green-400'}`}>
                    {result.is_anomaly ? 'ANOMALY DETECTED' : 'Normal Pattern'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 mt-8">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter transaction details and click detect</p>
            </div>
          )}
        </div>
      </div>

      {explanation && (
        <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Explanation</h3>
          <div className="space-y-2">
            {explanation.top_features?.map((feat, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  feat.impact === 'increases_risk'
                    ? 'bg-red-900/20 border border-red-800/30'
                    : 'bg-green-900/20 border border-green-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={feat.impact === 'increases_risk' ? 'text-red-400' : 'text-green-400'}>
                    {feat.impact === 'increases_risk' ? '↑' : '↓'}
                  </span>
                  <span className="text-white font-medium">{feat.feature}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-sm">Value: {feat.value}</span>
                  <span className={`text-sm font-mono ${feat.impact === 'increases_risk' ? 'text-red-400' : 'text-green-400'}`}>
                    {feat.contribution > 0 ? '+' : ''}{feat.contribution.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
