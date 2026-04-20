import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreditRisk from './pages/CreditRisk';
import FraudDetection from './pages/FraudDetection';
import StressTesting from './pages/StressTesting';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="credit" element={<CreditRisk />} />
          <Route path="fraud" element={<FraudDetection />} />
          <Route path="stress" element={<StressTesting />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
