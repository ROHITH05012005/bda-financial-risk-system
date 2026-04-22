import { useState } from 'react';
import { predictCreditRisk } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import MetricCard from '../components/MetricCard';
import { CreditCard, Loader2 } from 'lucide-react';

const defaultForm = {
  age: 35, income: 60000, employment_years: 5, loan_amount: 25000,
  loan_term: 60, interest_rate: 8.0, debt_to_income: 25.0, credit_score: 680,
  num_credit_lines: 5, num_late_payments: 0, years_credit_history: 10,
  num_accounts: 8, credit_utilization: 30.0, total_debt: 15000, monthly_payment: 500,
};

export default function CreditRisk() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await predictCreditRisk(form);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
    setLoading(false);
  };

  const fields = [
    { key: 'age', label: 'Age', min: 18, max: 80, step: 1 },
    { key: 'income', label: 'Annual Income ($)', min: 15000, max: 500000, step: 5000 },
    { key: 'employment_years', label: 'Employment Years', min: 0, max: 40, step: 0.5 },
    { key: 'loan_amount', label: 'Loan Amount ($)', min: 1000, max: 500000, step: 1000 },
    { key: 'loan_term', label: 'Loan Term (months)', min: 12, max: 84, step: 12 },
    { key: 'interest_rate', label: 'Interest Rate (%)', min: 2, max: 25, step: 0.5 },
    { key: 'debt_to_income', label: 'Debt-to-Income Ratio', min: 0, max: 80, step: 1 },
    { key: 'credit_score', label: 'Credit Score', min: 300, max: 850, step: 1 },
    { key: 'num_credit_lines', label: 'Credit Lines', min: 0, max: 30, step: 1 },
    { key: 'num_late_payments', label: 'Late Payments', min: 0, max: 20, step: 1 },
    { key: 'years_credit_history', label: 'Credit History (yrs)', min: 0, max: 40, step: 0.5 },
    { key: 'num_accounts', label: 'Total Accounts', min: 0, max: 25, step: 1 },
    { key: 'credit_utilization', label: 'Credit Utilization (%)', min: 0, max: 100, step: 1 },
    { key: 'total_debt', label: 'Total Debt ($)', min: 0, max: 500000, step: 1000 },
    { key: 'monthly_payment', label: 'Monthly Payment ($)', min: 0, max: 10000, step: 50 },
  ];

  return (
    <div className="animate-fade-in delay-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <CreditCard className="color-blue" style={{ width: '2rem', height: '2rem' }} />
          Credit Risk Analysis
        </h2>
        <p className="text-secondary mt-1">Predict loan default probability using Gradient Boosting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="card lg-col-span-2" style={{ gridColumn: 'span 2' }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fields.map(({ key, label, min, max, step }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input
                    type="number"
                    min={min} max={max} step={step}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="input-field"
                  />
                </div>
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
                style={{ padding: '0.875rem' }}
              >
                {loading && <Loader2 className="animate-spin" style={{ width: '1rem', height: '1rem' }} />}
                Predict Credit Risk
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div className="card flex flex-col items-center justify-center">
          {result ? (
            <div className="animate-fade-in flex flex-col items-center w-full">
              <h3 className="text-sm font-semibold text-secondary mb-4 tracking-wide">RISK ASSESSMENT</h3>
              <RiskGauge value={result.default_probability} riskLevel={result.risk_level} size={180} />
              <div className="mt-6 flex flex-col gap-3 w-full">
                <MetricCard
                  title="Default Probability"
                  value={`${(result.default_probability * 100).toFixed(1)}%`}
                  color={result.risk_level === 'LOW' ? 'green' : result.risk_level === 'MEDIUM' ? 'yellow' : 'red'}
                />
                <MetricCard
                  title="Prediction"
                  value={result.prediction ? 'DEFAULT' : 'NO DEFAULT'}
                  color={result.prediction ? 'red' : 'green'}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-secondary h-full py-12">
              <CreditCard style={{ width: '4rem', height: '4rem', opacity: 0.3, marginBottom: '1rem' }} />
              <p className="text-sm">Enter applicant details and click predict</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
