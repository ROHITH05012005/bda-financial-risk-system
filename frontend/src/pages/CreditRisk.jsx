import { useState } from 'react';
import { predictCreditRisk, explainCreditRisk } from '../services/api';
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
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const handleChange = (field, value) => {
    const v = parseFloat(value) || 0;
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await predictCreditRisk(form);
      setResult(res);
      if (showExplain) {
        const exp = await explainCreditRisk(form);
        setExplanation(exp.explanation);
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
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
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-blue-400" />
          Credit Risk Analysis
        </h2>
        <p className="text-slate-400 mt-1">Predict loan default probability with explainable AI</p>
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Predict Credit Risk
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          {result ? (
            <>
              <h3 className="text-sm font-semibold text-slate-400 mb-4">RISK ASSESSMENT</h3>
              <RiskGauge value={result.default_probability} riskLevel={result.risk_level} size={180} />
              <div className="mt-4 space-y-2 w-full">
                <MetricCard title="Default Probability" value={`${(result.default_probability * 100).toFixed(1)}%`} color={result.risk_level === 'LOW' ? 'green' : result.risk_level === 'MEDIUM' ? 'yellow' : 'red'} />
                <MetricCard title="Prediction" value={result.prediction ? 'DEFAULT' : 'NO DEFAULT'} color={result.prediction ? 'red' : 'green'} />
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter applicant details and click predict</p>
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
