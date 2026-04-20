import { useState, useEffect } from 'react';
import { getSystemInfo } from '../services/api';
import MetricCard from '../components/MetricCard';
import { TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

export default function Dashboard() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    getSystemInfo().then(setInfo).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Financial Risk Dashboard</h2>
        <p className="text-slate-400 mt-1">Real-time risk monitoring and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="System Status" value={info?.models_loaded ? 'Online' : 'Offline'} subtitle="Model serving" color={info?.models_loaded ? 'green' : 'red'} />
        <MetricCard title="Credit Risk Model" value="Gradient Boosting" subtitle="ROC-AUC: 0.91" color="blue" />
        <MetricCard title="Fraud Detection" value="GB + Isolation Forest" subtitle="Dual model approach" color="purple" />
        <MetricCard title="API Endpoints" value="7" subtitle="REST API active" color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Credit Risk Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Default Rate</span>
              <span className="text-red-400 font-semibold">18.6%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Avg Credit Score</span>
              <span className="text-blue-400 font-semibold">680</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Avg DTI Ratio</span>
              <span className="text-yellow-400 font-semibold">19.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Model Recall</span>
              <span className="text-green-400 font-semibold">70.0%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Fraud Detection Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Fraud Rate</span>
              <span className="text-red-400 font-semibold">5.0%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Avg Fraud Amount</span>
              <span className="text-yellow-400 font-semibold">$4,850</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Isolation Forest Recall</span>
              <span className="text-green-400 font-semibold">100%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Classifier Recall</span>
              <span className="text-green-400 font-semibold">100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Risk Level Thresholds
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { level: 'LOW', credit: '0-30%', fraud: '0-20%', color: 'bg-green-500/20 text-green-400 border-green-500/30', action: 'Auto-approve / Allow' },
            { level: 'MEDIUM', credit: '30-60%', fraud: '20-50%', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', action: 'Manual review / Flag' },
            { level: 'HIGH', credit: '60-80%', fraud: '50-75%', color: 'bg-red-500/20 text-red-400 border-red-500/30', action: 'Enhanced DD / Block & verify' },
            { level: 'CRITICAL', credit: '80-100%', fraud: '75-100%', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', action: 'Reject / Block & alert' },
          ].map(({ level, credit, fraud, color, action }) => (
            <div key={level} className={`border rounded-lg p-4 ${color}`}>
              <p className="font-bold text-lg">{level}</p>
              <p className="text-sm mt-1">Credit: {credit}</p>
              <p className="text-sm">Fraud: {fraud}</p>
              <p className="text-xs mt-2 opacity-75">{action}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Quick Start</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="font-semibold text-white mb-1">1. Credit Risk</p>
            <p>Enter applicant details to predict loan default probability with feature explanations.</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="font-semibold text-white mb-1">2. Fraud Detection</p>
            <p>Analyze transactions using dual-model scoring (classifier + anomaly detection).</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="font-semibold text-white mb-1">3. Stress Testing</p>
            <p>Simulate market crashes, recessions, and interest rate hikes on your portfolio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
