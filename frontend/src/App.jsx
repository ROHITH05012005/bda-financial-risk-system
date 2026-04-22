import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreditRisk from './pages/CreditRisk';
import FraudDetection from './pages/FraudDetection';
import StressTesting from './pages/StressTesting';
import ModelPerformance from './pages/ModelPerformance';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/credit" element={<CreditRisk />} />
          <Route path="/fraud" element={<FraudDetection />} />
          <Route path="/stress" element={<StressTesting />} />
          <Route path="/performance" element={<ModelPerformance />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
