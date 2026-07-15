import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import StockSelection from './pages/StockSelection';
import Backtest from './pages/Backtest';
import Strategy from './pages/Strategy';
import { checkBackendHealth } from './api/config';

export default function App() {
  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stock-selection" element={<StockSelection />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/strategy" element={<Strategy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}