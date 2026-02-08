import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AdminRoute } from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Code splitting: Lazy load pages for better performance
// Named exports need special handling
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ConfirmEmail = lazy(() => import('./pages/confirm-email'));
const ReferralRedirect = lazy(() => import('./pages/referral-redirect'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password-page'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password-page'));
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
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const WithdrawalPage = lazy(() => import('./pages/WithdrawalPage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const MarketingTools = lazy(() => import('./pages/MarketingTools'));
const Admin = lazy(() => import('./pages/Admin'));
const TestPage = lazy(() => import('./pages/TestPage'));
const DebuggerPage = lazy(() => import('./pages/DebuggerPage'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccess = lazy(() => import('./components/checkout/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Code splitting: Lazy load Admin pages for better performance
const Overview = lazy(() => import('./pages/Admin/Overview'));
const CMS = lazy(() => import('./pages/Admin/CMS'));
const Partners = lazy(() => import('./pages/Admin/Partners'));
const Finance = lazy(() => import('./pages/Admin/Finance'));
const PolicyEngine = lazy(() => import('./pages/Admin/PolicyEngine'));
const OrderManagement = lazy(() => import('./pages/Admin/OrderManagement'));
const AdminProducts = lazy(() => import('./pages/Admin/Products'));
const AuditLog = lazy(() => import('./pages/Admin/AuditLog'));

import { useStore } from './store';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { CursorGlow } from './components/CursorGlow';
import { useTranslation } from '@/hooks';
import { useAuth } from './hooks/useAuth';
import { useAutoLogout } from './hooks/useAutoLogout';
import { PWAInstallPrompt } from './components/pwa-install-prompt';

// Reusable Suspense fallbacks — eliminates 25+ duplicate inline spinners
const PageSpinner = (
  <div className="flex items-center justify-center h-screen bg-zinc-950">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
  </div>
);

const SectionSpinner = (
  <div className="flex items-center justify-center h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]" />
  </div>
);

const AdminSpinner = (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]" />
  </div>
);

const App: React.FC = () => {
  const { t } = useTranslation();
  useAuth(); // Initialize authentication check
  useAutoLogout(); // Auto-logout after 30 min inactivity
  const { isAuthenticated, isInitialized } = useStore();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <CursorGlow />
        <PWAInstallPrompt />
        <Routes>
          {/* ============================================================ */}
          {/* PUBLIC ROUTES: Landing, Auth & Venture Vision */}
          {/* ============================================================ */}
          <Route path="/" element={<Suspense fallback={PageSpinner}><LandingPage /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={PageSpinner}><Login /></Suspense>} />
          <Route path="/signup" element={<Suspense fallback={PageSpinner}><Signup /></Suspense>} />
          <Route path="/confirm-email" element={<Suspense fallback={PageSpinner}><ConfirmEmail /></Suspense>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/ref/:referralId" element={<Suspense fallback={PageSpinner}><ReferralRedirect /></Suspense>} />
          <Route path="/venture" element={<Suspense fallback={PageSpinner}><VenturePage /></Suspense>} />

          {/* ============================================================ */}
          {/* CHECKOUT ROUTES */}
          {/* ============================================================ */}
          <Route path="/checkout" element={<Suspense fallback={AdminSpinner}><CheckoutPage /></Suspense>} />
          <Route path="/checkout/success" element={<OrderSuccess />} />

          {/* ============================================================ */}
          {/* ADMIN ROUTES: Mission Control with Nested Routes (Protected) */}
          {/* ============================================================ */}
          <Route path="/admin" element={<AdminRoute><ErrorBoundary><Suspense fallback={PageSpinner}><Admin /></Suspense></ErrorBoundary></AdminRoute>}>
            <Route index element={<Suspense fallback={AdminSpinner}><Overview /></Suspense>} />
            <Route path="cms" element={<Suspense fallback={AdminSpinner}><CMS /></Suspense>} />
            <Route path="partners" element={<Suspense fallback={AdminSpinner}><Partners /></Suspense>} />
            <Route path="finance" element={<Suspense fallback={AdminSpinner}><Finance /></Suspense>} />
            <Route path="policy-engine" element={<Suspense fallback={AdminSpinner}><PolicyEngine /></Suspense>} />
            <Route path="orders" element={<Suspense fallback={AdminSpinner}><OrderManagement /></Suspense>} />
            <Route path="products" element={<Suspense fallback={AdminSpinner}><AdminProducts /></Suspense>} />
            <Route path="audit-log" element={<Suspense fallback={AdminSpinner}><AuditLog /></Suspense>} />
          </Route>

          {/* ============================================================ */}
          {/* PROTECTED ROUTES: Dashboard with AppLayout wrapper */}
          {/* If authenticated -> Show AppLayout. If not -> Redirect to Landing */}
          {/* ============================================================ */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <ErrorBoundary>
                  <Suspense fallback={AdminSpinner}>
                    <AppLayout />
                  </Suspense>
                </ErrorBoundary>
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            {/* Dashboard Home */}
            <Route index element={<Suspense fallback={SectionSpinner}><Dashboard /></Suspense>} />

            {/* Marketplace & Products */}
            <Route path="marketplace" element={<Suspense fallback={SectionSpinner}><Marketplace /></Suspense>} />
            <Route path="product/:id" element={<Suspense fallback={SectionSpinner}><ProductDetail /></Suspense>} />

            {/* Commission Wallet */}
            <Route
              path="wallet"
              element={
                <Suspense fallback={SectionSpinner}>
                  <div className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1F2937]">{t('app.commission_wallet')}</h2>
                    <CommissionWallet />
                  </div>
                </Suspense>
              }
            />

            {/* Phase 2: Growth Features */}
            <Route path="copilot" element={<Suspense fallback={SectionSpinner}><CopilotPage /></Suspense>} />
            <Route path="team" element={<Suspense fallback={SectionSpinner}><LeaderDashboard /></Suspense>} />
            <Route path="referral" element={<Suspense fallback={SectionSpinner}><ReferralPage /></Suspense>} />
            <Route path="network" element={<Suspense fallback={SectionSpinner}><NetworkPage /></Suspense>} />
            <Route path="withdrawal" element={<Suspense fallback={SectionSpinner}><WithdrawalPage /></Suspense>} />
            <Route path="health-coach" element={<Suspense fallback={SectionSpinner}><HealthCoach /></Suspense>} />
            <Route path="health-check" element={<Suspense fallback={SectionSpinner}><HealthCheck /></Suspense>} />
            <Route path="leaderboard" element={<Suspense fallback={SectionSpinner}><Leaderboard /></Suspense>} />
            <Route path="marketing-tools" element={<Suspense fallback={SectionSpinner}><MarketingTools /></Suspense>} />
            <Route path="agents" element={<Suspense fallback={SectionSpinner}><AgentDashboard /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={SectionSpinner}><SettingsPage /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={SectionSpinner}><ProfilePage /></Suspense>} />
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
          <Route path="/system-status" element={<Suspense fallback={PageSpinner}><SystemStatus /></Suspense>} />

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
