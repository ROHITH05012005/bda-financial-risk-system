import { useState } from 'react';
import { predictFraud } from '../services/api';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    const v = field.startsWith('is_') ? parseInt(value) : (parseFloat(value) || 0);
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await predictFraud(form);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
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
    <div className="animate-fade-in delay-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Search className="color-red" style={{ width: '2rem', height: '2rem' }} />
          Fraud Detection
        </h2>
        <p className="text-secondary mt-1">Dual-model scoring: Gradient Boosting + Isolation Forest anomaly detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fields.map(({ key, label, min, max, step }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input
                    type="number" min={min} max={max} step={step}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="input-field"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              {toggleFields.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key] === 1}
                    onChange={(e) => handleChange(key, e.target.checked ? '1' : '0')}
                    style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--accent-red)' }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {error && (
              <p className="mt-4 text-sm bg-red-transparent color-red p-4 rounded-lg">
                {error}
              </p>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ background: 'linear-gradient(135deg, var(--accent-red), #dc2626)', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)', padding: '0.875rem' }}
              >
                {loading && <Loader2 className="animate-spin" style={{ width: '1rem', height: '1rem' }} />}
                Detect Fraud
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div className="card flex flex-col items-center justify-center">
          {result ? (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <h3 className="text-sm font-semibold text-secondary mb-4 tracking-wide">FRAUD ASSESSMENT</h3>
              <RiskGauge value={result.combined_risk_score} riskLevel={result.risk_level} size={180} />
              <div className="mt-6 flex flex-col gap-3 w-full">
                <MetricCard title="Fraud Probability" value={`${(result.fraud_probability * 100).toFixed(1)}%`} color="red" />
                <MetricCard title="Combined Risk" value={`${(result.combined_risk_score * 100).toFixed(1)}%`} color={result.risk_level === 'LOW' ? 'green' : 'yellow'} />
                
                <div className={`flex items-center justify-center gap-2 p-3 mt-2 rounded-lg ${result.is_anomaly ? 'bg-red-transparent color-red' : 'bg-green-transparent color-green'}`}>
                  {result.is_anomaly
                    ? <AlertTriangle style={{ width: '1.25rem', height: '1.25rem' }} />
                    : <CheckCircle style={{ width: '1.25rem', height: '1.25rem' }} />}
                  <span className="text-sm font-medium">
                    {result.is_anomaly ? 'ANOMALY DETECTED' : 'Normal Pattern'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-secondary h-full py-12">
              <Search style={{ width: '4rem', height: '4rem', opacity: 0.3, marginBottom: '1rem' }} />
              <p className="text-sm text-center">Enter transaction details<br/>and click detect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
