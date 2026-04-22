import { useState, useEffect } from 'react';
import { getModelInfo } from '../services/api';
import MetricCard from '../components/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, Target, CheckCircle } from 'lucide-react';

export default function ModelPerformance() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    getModelInfo().then(setInfo).catch(() => {});
  }, []);

  if (!info) {
    return (
      <div className="flex flex-col items-center justify-center text-secondary py-12">
        <BarChart3 style={{ width: '4rem', height: '4rem', opacity: 0.3, marginBottom: '1rem' }} />
        <p>Loading model metrics...</p>
      </div>
    );
  }

  const creditMetrics = info.credit_risk?.metrics || {};
  const fraudMetrics = info.fraud_detection?.metrics || {};
  const fraudIsoMetrics = info.fraud_detection?.metrics?.isolation_forest || {};

  const comparisonData = [
    { metric: 'ROC-AUC', Credit: creditMetrics.roc_auc || 0, Fraud: fraudMetrics.roc_auc || 0 },
    { metric: 'F1 Score', Credit: creditMetrics.f1 || 0, Fraud: fraudMetrics.f1 || 0 },
    { metric: 'Recall', Credit: creditMetrics.recall || 0, Fraud: fraudMetrics.recall || 0 },
    { metric: 'Avg Precision', Credit: creditMetrics.avg_precision || 0, Fraud: fraudMetrics.avg_precision || 0 },
  ];

  return (
    <div className="animate-fade-in delay-100">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <BarChart3 className="color-purple" style={{ width: '2rem', height: '2rem' }} />
          Model Performance
        </h2>
        <p className="text-secondary mt-1">Evaluation metrics for Gradient Boosting and Isolation Forest models</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Credit Risk Model */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
              <Target className="color-blue" style={{ width: '1.25rem', height: '1.25rem' }} />
              Credit Risk Model
            </h3>
            <span className="text-sm text-secondary bg-primary" style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'var(--bg-primary)' }}>
              {info.credit_risk?.model_type}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard title="ROC-AUC" value={creditMetrics.roc_auc?.toFixed(4) || 'N/A'} color="blue" />
            <MetricCard title="F1 Score" value={creditMetrics.f1?.toFixed(4) || 'N/A'} color="green" />
            <MetricCard title="Recall" value={creditMetrics.recall?.toFixed(4) || 'N/A'} color="yellow" />
            <MetricCard title="Avg Precision" value={creditMetrics.avg_precision?.toFixed(4) || 'N/A'} color="purple" />
          </div>

          <div className="glass-panel p-4">
            <h4 className="text-sm font-semibold text-secondary mb-3">Confusion Matrix</h4>
            {creditMetrics.confusion_matrix ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-green-transparent rounded-lg">
                  <p className="text-xs text-secondary">True Negative</p>
                  <p className="text-2xl font-bold color-green">{creditMetrics.confusion_matrix[0][0]}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-red-transparent rounded-lg">
                  <p className="text-xs text-secondary">False Positive</p>
                  <p className="text-2xl font-bold color-red">{creditMetrics.confusion_matrix[0][1]}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-yellow-transparent rounded-lg">
                  <p className="text-xs text-secondary">False Negative</p>
                  <p className="text-2xl font-bold color-yellow">{creditMetrics.confusion_matrix[1][0]}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-green-transparent rounded-lg">
                  <p className="text-xs text-secondary">True Positive</p>
                  <p className="text-2xl font-bold color-green">{creditMetrics.confusion_matrix[1][1]}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted">Confusion matrix not available</p>
            )}
          </div>
        </div>

        {/* Fraud Detection Model */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
              <CheckCircle className="color-red" style={{ width: '1.25rem', height: '1.25rem' }} />
              Fraud Detection Model
            </h3>
            <span className="text-sm text-secondary bg-primary" style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'var(--bg-primary)' }}>
              {info.fraud_detection?.model_type}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard title="ROC-AUC" value={fraudMetrics.roc_auc?.toFixed(4) || 'N/A'} color="blue" />
            <MetricCard title="F1 Score" value={fraudMetrics.f1?.toFixed(4) || 'N/A'} color="green" />
            <MetricCard title="Recall" value={fraudMetrics.recall?.toFixed(4) || 'N/A'} color="yellow" />
            <MetricCard title="Avg Precision" value={fraudMetrics.avg_precision?.toFixed(4) || 'N/A'} color="purple" />
          </div>

          <div className="glass-panel p-4 mb-6">
            <h4 className="text-sm font-semibold text-secondary mb-3">Confusion Matrix</h4>
            {fraudMetrics.confusion_matrix ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-green-transparent rounded-lg">
                  <p className="text-xs text-secondary">True Negative</p>
                  <p className="text-2xl font-bold color-green">{fraudMetrics.confusion_matrix[0][0]}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-red-transparent rounded-lg">
                  <p className="text-xs text-secondary">False Positive</p>
                  <p className="text-2xl font-bold color-red">{fraudMetrics.confusion_matrix[0][1]}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-yellow-transparent rounded-lg">
                  <p className="text-xs text-secondary">False Negative</p>
                  <p className="text-2xl font-bold color-yellow">{fraudMetrics.confusion_matrix[1][0]}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-green-transparent rounded-lg">
                  <p className="text-xs text-secondary">True Positive</p>
                  <p className="text-2xl font-bold color-green">{fraudMetrics.confusion_matrix[1][1]}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted">Confusion matrix not available</p>
            )}
          </div>

          <div className="glass-panel p-4">
            <h4 className="text-sm font-semibold text-secondary mb-3">Isolation Forest (Anomaly Detection)</h4>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard title="F1 Score" value={fraudIsoMetrics.f1?.toFixed(4) || 'N/A'} color="green" />
              <MetricCard title="Recall" value={fraudIsoMetrics.recall?.toFixed(4) || 'N/A'} color="yellow" />
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="card">
          <h3 className="text-xl font-semibold text-primary mb-6">Model Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="metric" stroke="var(--text-secondary)" />
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
              <Bar dataKey="Credit" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} name="Credit Risk" />
              <Bar dataKey="Fraud" fill="var(--accent-red)" radius={[4, 4, 0, 0]} name="Fraud Detection" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
