import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Search,
  FlaskConical,
  BarChart3,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/credit', icon: CreditCard, label: 'Credit Risk' },
  { to: '/fraud', icon: Search, label: 'Fraud Detection' },
  { to: '/stress', icon: FlaskConical, label: 'Stress Testing' },
  { to: '/performance', icon: BarChart3, label: 'Model Performance' },
];

export default function Layout({ children }) {
  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="flex items-center gap-3 p-6 border-b">
          <Shield style={{ width: '2rem', height: '2rem', color: 'var(--accent-blue)' }} />
          <div>
            <h1 className="text-lg font-bold text-primary">Risk Navigator</h1>
            <p className="text-xs text-muted">Financial Risk Analysis</p>
          </div>
        </div>
        
        <nav className="flex-1 flex col p-4 gap-1 nav-menu">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
              {label}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t">
          <p className="text-xs text-muted" style={{ textAlign: 'center' }}>
            v1.0.0 &middot; Gradient Boosting + Isolation Forest
          </p>
        </div>
      </aside>
      
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
