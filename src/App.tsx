import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Overview from './pages/Admin/Overview';
import CMS from './pages/Admin/CMS';
import Partners from './pages/Admin/Partners';
import Finance from './pages/Admin/Finance';
import PolicyEngine from './pages/Admin/PolicyEngine';
import OrderManagement from './pages/Admin/OrderManagement';
import AgentDashboard from './pages/AgentDashboard';
import AgencyOSDemo from './pages/AgencyOSDemo';
import { AgentDashboard as NewAgentDashboard } from './components/AgentDashboard';
import { useStore } from './store';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { CursorGlow } from './components/CursorGlow';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { isAuthenticated } = useStore();
  const location = useLocation();

  return (
    <ThemeProvider>
      <ToastProvider>
        <CursorGlow />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
              {/* ============================================================ */}
              {/* PUBLIC ROUTES: Landing & Venture Vision */}
              {/* ============================================================ */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/venture" element={<VenturePage />} />
              <Route path="/agencyos-demo" element={<AgencyOSDemo />} />

              {/* ============================================================ */}
              {/* ADMIN ROUTES: Mission Control with Nested Routes */}
              {/* ============================================================ */}
              <Route path="/admin" element={<Admin />}>
                <Route index element={<Overview />} />
                <Route path="cms" element={<CMS />} />
                <Route path="partners" element={<Partners />} />
                <Route path="finance" element={<Finance />} />
                <Route path="policy-engine" element={<PolicyEngine />} />
                <Route path="orders" element={<OrderManagement />} />
              </Route>

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
                <Route path="agents" element={<AgentDashboard />} />
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
          </motion.div>
        </AnimatePresence>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;