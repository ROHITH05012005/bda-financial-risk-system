import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Search,
  FlaskConical,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/credit', icon: CreditCard, label: 'Credit Risk' },
  { to: '/fraud', icon: Search, label: 'Fraud Detection' },
  { to: '/stress', icon: FlaskConical, label: 'Stress Testing' },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-lg font-bold text-white">Risk Navigator</h1>
            <p className="text-xs text-slate-400">Financial Risk Analysis</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">v1.0.0 &middot; Gradient Boosting + Isolation Forest</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-950">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
