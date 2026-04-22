import { useState, useEffect } from 'react';
import { getSystemInfo } from '../services/api';
import MetricCard from '../components/MetricCard';
import { TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

export default function Dashboard() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemInfo()
      .then((data) => {
        setInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-primary p-8">Loading...</div>;
  if (error) return <div className="color-red p-8">Error: {error}</div>;

  return (
    <div className="animate-fade-in delay-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary">Financial Risk Dashboard</h2>
        <p className="text-secondary mt-1">Real-time risk monitoring and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="System Status"
          value={info?.models_loaded ? 'Online' : 'Offline'}
          subtitle="ML models serving"
          color={info?.models_loaded ? 'green' : 'red'}
        />
        <MetricCard title="Credit Risk Model" value="Gradient Boosting" subtitle="ROC-AUC: 0.91" color="blue" />
        <MetricCard title="Fraud Detection" value="GB + Isolation Forest" subtitle="Dual-model approach" color="purple" />
        <MetricCard title="API Endpoints" value="7" subtitle="REST API active" color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="color-blue" style={{ width: '1.25rem', height: '1.25rem' }} />
            Credit Risk Overview
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Default Rate in Dataset', value: '18.6%', color: 'color-red' },
              { label: 'Average Credit Score', value: '680', color: 'color-blue' },
              { label: 'Average DTI Ratio', value: '19.8%', color: 'color-yellow' },
              { label: 'Model Recall (Defaults)', value: '70.0%', color: 'color-green' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center p-4 glass-panel border-light">
                <span className="text-secondary text-sm">{label}</span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="color-red" style={{ width: '1.25rem', height: '1.25rem' }} />
            Fraud Detection Overview
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Fraud Rate in Dataset', value: '5.0%', color: 'color-red' },
              { label: 'Average Fraud Amount', value: '$4,850', color: 'color-yellow' },
              { label: 'Isolation Forest Recall', value: '100%', color: 'color-green' },
              { label: 'Classifier ROC-AUC', value: '1.00', color: 'color-green' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center p-4 glass-panel border-light">
                <span className="text-secondary text-sm">{label}</span>
                <span className={`font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Shield className="color-purple" style={{ width: '1.25rem', height: '1.25rem' }} />
          Risk Level Thresholds
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { level: 'LOW', credit: '0–30%', fraud: '0–20%', color: 'bg-green-transparent color-green', action: 'Auto-approve / Allow' },
            { level: 'MEDIUM', credit: '30–60%', fraud: '20–50%', color: 'bg-yellow-transparent color-yellow', action: 'Manual review / Flag' },
            { level: 'HIGH', credit: '60–80%', fraud: '50–75%', color: 'bg-red-transparent color-red', action: 'Enhanced DD / Block' },
            { level: 'CRITICAL', credit: '80–100%', fraud: '75–100%', color: 'bg-purple-transparent color-purple', action: 'Reject / Alert' },
          ].map(({ level, credit, fraud, color, action }) => (
            <div key={level} className={`card ${color}`} style={{ padding: '1rem', border: 'none' }}>
              <p className="font-bold text-lg">{level}</p>
              <p className="text-sm mt-1">Credit: {credit}</p>
              <p className="text-sm">Fraud: {fraud}</p>
              <p className="text-xs mt-2 text-muted">{action}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 card bg-blue-transparent" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Activity className="color-blue" style={{ width: '1.25rem', height: '1.25rem' }} />
          <h3 className="text-lg font-semibold text-primary">Quick Start</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary">
          <div className="glass-panel p-4">
            <p className="font-semibold text-primary mb-1">1. Credit Risk</p>
            <p>Enter applicant details to predict loan default probability with feature explanations.</p>
          </div>
          <div className="glass-panel p-4">
            <p className="font-semibold text-primary mb-1">2. Fraud Detection</p>
            <p>Analyze transactions using dual-model scoring (classifier + anomaly detection).</p>
          </div>
          <div className="glass-panel p-4">
            <p className="font-semibold text-primary mb-1">3. Stress Testing</p>
            <p>Simulate market crashes, recessions, and interest rate hikes on your portfolio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
