
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Marketplace } from './pages/Marketplace';
import { ProductDetail } from './pages/ProductDetail';
import CommissionWallet from './components/CommissionWallet';
import LandingPage from './pages/LandingPage';
import VenturePage from './pages/VenturePage';
import CopilotPage from './pages/CopilotPage';
import LeaderDashboard from './pages/LeaderDashboard';
import ReferralPage from './pages/ReferralPage';
import HealthCoach from './pages/HealthCoach';
import HealthCheck from './pages/HealthCheck';
import Leaderboard from './pages/Leaderboard';
import MarketingTools from './pages/MarketingTools';
import Admin from './pages/Admin';
import PolicyEngine from './pages/Admin/PolicyEngine';
import { useStore } from './store';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  const { isAuthenticated } = useStore();

  return (
    <ThemeProvider>
      <Routes>
      {/* ============================================================ */}
      {/* PUBLIC ROUTES: Landing & Venture Vision */}
      {/* ============================================================ */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/venture" element={<VenturePage />} />

      {/* ============================================================ */}
      {/* ADMIN ROUTES: Mission Control */}
      {/* ============================================================ */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/policy-engine" element={<PolicyEngine />} />

      {/* ============================================================ */}
      {/* PROTECTED ROUTES: Dashboard with AppLayout wrapper */}
      {/* If authenticated -> Show AppLayout. If not -> Redirect to Landing */}
      {/* ============================================================ */}
      <Route
        path="/dashboard"
        element={isAuthenticated ? <AppLayout /> : <Navigate to="/" replace />}
      >
        {/* Dashboard Home */}
        <Route index element={<Dashboard />} />

        {/* Marketplace & Products */}
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="product/:id" element={<ProductDetail />} />

        {/* Commission Wallet */}
        <Route
          path="wallet"
          element={
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1F2937]">Commission Wallet</h2>
              <CommissionWallet />
            </div>
          }
        />

        {/* Phase 2: Growth Features */}
        <Route path="copilot" element={<CopilotPage />} />
        <Route path="team" element={<LeaderDashboard />} />
        <Route path="referral" element={<ReferralPage />} />
        <Route path="health-coach" element={<HealthCoach />} />
        <Route path="health-check" element={<HealthCheck />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="marketing-tools" element={<MarketingTools />} />
      </Route>

      {/* ============================================================ */}
      {/* LEGACY REDIRECTS: Old paths redirect to new structure */}
      {/* ============================================================ */}
      <Route path="/marketplace" element={<Navigate to="/dashboard/marketplace" replace />} />
      <Route path="/wallet" element={<Navigate to="/dashboard/wallet" replace />} />
      <Route path="/product/:id" element={<Navigate to="/dashboard/product/:id" replace />} />

      {/* ============================================================ */}
      {/* CATCH-ALL: Unknown routes redirect to home */}
      {/* ============================================================ */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
