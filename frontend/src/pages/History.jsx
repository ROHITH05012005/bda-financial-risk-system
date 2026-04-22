import { useState, useEffect, useCallback } from 'react';
import { getHistory, getDbStats } from '../services/api';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const riskColor = (score) => {
  if (score < 0.3) return 'var(--accent-green)';
  if (score < 0.6) return 'var(--accent-yellow, #f59e0b)';
  if (score < 0.8) return 'var(--accent-orange, #f97316)';
  return 'var(--accent-red)';
};

const riskLabel = (score) => {
  if (score < 0.3) return 'LOW';
  if (score < 0.6) return 'MEDIUM';
  if (score < 0.8) return 'HIGH';
  return 'CRITICAL';
};

function DbStatusBadge({ stats }) {
  if (!stats) return null;
  return (
    <div className="db-status-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: stats.connected ? 'var(--accent-green)' : 'var(--accent-red)' }}>
      {stats.connected ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
      {stats.connected
        ? `DB Connected · ${stats.credit_count} credit · ${stats.fraud_count} fraud`
        : 'DB Disconnected'}
    </div>
  );
}

function HistoryTable({ records, type }) {
  if (!records.length) {
    return (
      <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Database size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
        <p>No {type} prediction records yet.</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Run a prediction to start logging.</p>
      </div>
    );
  }

  const riskKey = type === 'credit' ? 'default_probability' : 'fraud_probability';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Risk Score</th>
            <th style={thStyle}>Level</th>
            {type === 'credit' && <th style={thStyle}>Loan Amount</th>}
            {type === 'credit' && <th style={thStyle}>Credit Score</th>}
            {type === 'fraud' && <th style={thStyle}>Amount</th>}
            {type === 'fraud' && <th style={thStyle}>Online?</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => {
            const score = rec.result?.[riskKey] ?? 0;
            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={tdStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={12} />
                    {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : '—'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 60, height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${score * 100}%`, height: '100%', background: riskColor(score), borderRadius: 3 }} />
                    </div>
                    <span style={{ color: riskColor(score), fontWeight: 600 }}>{(score * 100).toFixed(1)}%</span>
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ background: riskColor(score) + '22', color: riskColor(score), padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem' }}>
                    {riskLabel(score)}
                  </span>
                </td>
                {type === 'credit' && <td style={tdStyle}>${rec.input?.loan_amount?.toLocaleString() ?? '—'}</td>}
                {type === 'credit' && <td style={tdStyle}>{rec.input?.credit_score ?? '—'}</td>}
                {type === 'fraud' && <td style={tdStyle}>${rec.input?.amount?.toLocaleString() ?? '—'}</td>}
                {type === 'fraud' && <td style={tdStyle}>{rec.input?.is_online ? 'Yes' : 'No'}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' };
const tdStyle = { padding: '0.75rem 1rem', color: 'var(--text-primary)' };

export default function History() {
  const [activeTab, setActiveTab] = useState('credit');
  const [creditRecords, setCreditRecords] = useState([]);
  const [fraudRecords, setFraudRecords] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [credit, fraud, stats] = await Promise.all([
        getHistory('credit'),
        getHistory('fraud'),
        getDbStats(),
      ]);
      setCreditRecords(credit.records || []);
      setFraudRecords(fraud.records || []);
      setDbStats(stats);
    } catch (e) {
      setError('Could not connect to the database. Make sure MONGO_URI is configured.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Prediction History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            All predictions logged to MongoDB in real-time
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <DbStatusBadge stats={dbStats} />
          <button
            onClick={fetchData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {dbStats?.connected && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Credit Predictions', value: dbStats.credit_count, color: 'var(--accent-blue)' },
            { label: 'Fraud Predictions', value: dbStats.fraud_count, color: 'var(--accent-purple, #a855f7)' },
            { label: 'Total Logged', value: dbStats.credit_count + dbStats.fraud_count, color: 'var(--accent-green)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="metric-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{label}</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'var(--accent-red)22', border: '1px solid var(--accent-red)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', color: 'var(--accent-red)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Tabs + Table */}
      <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {['credit', 'fraud'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '1rem', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                textTransform: 'capitalize', fontSize: '0.9rem', transition: 'all 0.2s',
              }}
            >
              {tab} Risk
            </button>
          ))}
        </div>
        <div style={{ padding: '1rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={32} style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite', display: 'block' }} />
              Loading records...
            </div>
          ) : (
            <HistoryTable records={activeTab === 'credit' ? creditRecords : fraudRecords} type={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}
