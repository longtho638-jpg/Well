import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AdminRoute } from './components/AdminRoute';

// Code splitting: Lazy load pages for better performance
// Named exports need special handling
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Marketplace = lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const CommissionWallet = lazy(() => import('./components/CommissionWallet'));
const VenturePage = lazy(() => import('./pages/VenturePage'));
const CopilotPage = lazy(() => import('./pages/CopilotPage'));
const LeaderDashboard = lazy(() => import('./pages/LeaderDashboard'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const HealthCoach = lazy(() => import('./pages/HealthCoach'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const MarketingTools = lazy(() => import('./pages/MarketingTools'));
const Admin = lazy(() => import('./pages/Admin'));
const TestPage = lazy(() => import('./pages/TestPage'));
const DebuggerPage = lazy(() => import('./pages/DebuggerPage'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
// Code splitting: Lazy load Admin pages for better performance
const Overview = lazy(() => import('./pages/Admin/Overview'));
const CMS = lazy(() => import('./pages/Admin/CMS'));
const Partners = lazy(() => import('./pages/Admin/Partners'));
const Finance = lazy(() => import('./pages/Admin/Finance'));
const PolicyEngine = lazy(() => import('./pages/Admin/PolicyEngine'));
const OrderManagement = lazy(() => import('./pages/Admin/OrderManagement'));
const AdminProducts = lazy(() => import('./pages/Admin/Products'));

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
        <Routes>
          {/* ============================================================ */}
          {/* PUBLIC ROUTES: Landing, Auth & Venture Vision */}
          {/* ============================================================ */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/venture" element={<VenturePage />} />

          {/* ============================================================ */}
          {/* ADMIN ROUTES: Mission Control with Nested Routes (Protected) */}
          {/* ============================================================ */}
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<div className="flex items-center justify-center h-screen bg-zinc-950"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}><Admin /></Suspense></AdminRoute>}>
            <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><Overview /></Suspense>} />
            <Route path="cms" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><CMS /></Suspense>} />
            <Route path="partners" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><Partners /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><Finance /></Suspense>} />
            <Route path="policy-engine" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><PolicyEngine /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><OrderManagement /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><AdminProducts /></Suspense>} />
          </Route>

          {/* ============================================================ */}
          {/* PROTECTED ROUTES: Dashboard with AppLayout wrapper */}
          {/* If authenticated -> Show AppLayout. If not -> Redirect to Landing */}
          {/* ============================================================ */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}>
                  <AppLayout />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            {/* Dashboard Home */}
            <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><Dashboard /></Suspense>} />

            {/* Marketplace & Products */}
            <Route path="marketplace" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><Marketplace /></Suspense>} />
            <Route path="product/:id" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><ProductDetail /></Suspense>} />

            {/* Commission Wallet */}
            <Route
              path="wallet"
              element={
                <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}>
                  <div className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1F2937]">Commission Wallet</h2>
                    <CommissionWallet />
                  </div>
                </Suspense>
              }
            />

            {/* Phase 2: Growth Features */}
            <Route path="copilot" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><CopilotPage /></Suspense>} />
            <Route path="team" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><LeaderDashboard /></Suspense>} />
            <Route path="referral" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><ReferralPage /></Suspense>} />
            <Route path="health-coach" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><HealthCoach /></Suspense>} />
            <Route path="health-check" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><HealthCheck /></Suspense>} />
            <Route path="leaderboard" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><Leaderboard /></Suspense>} />
            <Route path="marketing-tools" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><MarketingTools /></Suspense>} />
            <Route path="agents" element={<Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div></div>}><AgentDashboard /></Suspense>} />
          </Route>

          {/* ============================================================ */}
          {/* LEGACY REDIRECTS: Old paths redirect to new structure */}
          {/* ============================================================ */}
          <Route path="/marketplace" element={<Navigate to="/dashboard/marketplace" replace />} />
          <Route path="/wallet" element={<Navigate to="/dashboard/wallet" replace />} />
          <Route path="/product/:id" element={<Navigate to="/dashboard/product/:id" replace />} />

          {/* ============================================================ */}
          {/* DIAGNOSTIC ROUTES */}
          {/* ============================================================ */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/debugger" element={<DebuggerPage />} />

          {/* ============================================================ */}
          {/* CATCH-ALL: Unknown routes redirect to home */}
          {/* ============================================================ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;