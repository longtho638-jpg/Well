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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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
  <div className="flex items-center justify-center h-screen bg-zinc-950" role="status">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    <span className="sr-only">Loading page...</span>
  </div>
);

const SectionSpinner = (
  <div className="flex items-center justify-center h-96" role="status">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]" />
    <span className="sr-only">Loading content...</span>
  </div>
);

const AdminSpinner = (
  <div className="flex items-center justify-center h-screen" role="status">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]" />
    <span className="sr-only">Loading admin panel...</span>
  </div>
);

// Wraps lazy components with ErrorBoundary + Suspense for chunk-load crash protection
const SafePage: React.FC<{ fallback?: React.ReactNode; children: React.ReactNode }> = ({ fallback = PageSpinner, children }) => (
  <ErrorBoundary>
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const App: React.FC = () => {
  const { t } = useTranslation();
  useAuth(); // Initialize authentication check
  useAutoLogout(); // Auto-logout after 30 min inactivity
  const { isAuthenticated, isInitialized } = useStore();

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <span className="sr-only">Initializing application...</span>
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
          <Route path="/" element={<SafePage><LandingPage /></SafePage>} />
          <Route path="/login" element={<SafePage><Login /></SafePage>} />
          <Route path="/signup" element={<SafePage><Signup /></SafePage>} />
          <Route path="/confirm-email" element={<SafePage><ConfirmEmail /></SafePage>} />
          <Route path="/forgot-password" element={<SafePage><ForgotPasswordPage /></SafePage>} />
          <Route path="/reset-password" element={<SafePage><ResetPasswordPage /></SafePage>} />
          <Route path="/ref/:referralId" element={<SafePage><ReferralRedirect /></SafePage>} />
          <Route path="/venture" element={<SafePage><VenturePage /></SafePage>} />

          {/* ============================================================ */}
          {/* CHECKOUT ROUTES */}
          {/* ============================================================ */}
          <Route path="/checkout" element={<SafePage fallback={AdminSpinner}><CheckoutPage /></SafePage>} />
          <Route path="/checkout/success" element={<SafePage><OrderSuccess /></SafePage>} />

          {/* ============================================================ */}
          {/* ADMIN ROUTES: Mission Control with Nested Routes (Protected) */}
          {/* ============================================================ */}
          <Route path="/admin" element={<ErrorBoundary><AdminRoute><SafePage><Admin /></SafePage></AdminRoute></ErrorBoundary>}>
            <Route index element={<SafePage fallback={AdminSpinner}><Overview /></SafePage>} />
            <Route path="cms" element={<SafePage fallback={AdminSpinner}><CMS /></SafePage>} />
            <Route path="partners" element={<SafePage fallback={AdminSpinner}><Partners /></SafePage>} />
            <Route path="finance" element={<SafePage fallback={AdminSpinner}><Finance /></SafePage>} />
            <Route path="policy-engine" element={<SafePage fallback={AdminSpinner}><PolicyEngine /></SafePage>} />
            <Route path="orders" element={<SafePage fallback={AdminSpinner}><OrderManagement /></SafePage>} />
            <Route path="products" element={<SafePage fallback={AdminSpinner}><AdminProducts /></SafePage>} />
            <Route path="audit-log" element={<SafePage fallback={AdminSpinner}><AuditLog /></SafePage>} />
          </Route>

          {/* ============================================================ */}
          {/* PROTECTED ROUTES: Dashboard with AppLayout wrapper */}
          {/* If authenticated -> Show AppLayout. If not -> Redirect to Landing */}
          {/* ============================================================ */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <SafePage fallback={AdminSpinner}>
                  <AppLayout />
                </SafePage>
              ) : (
                <Navigate to="/" replace />
              )
            }
          >
            {/* Dashboard Home */}
            <Route index element={<SafePage fallback={SectionSpinner}><Dashboard /></SafePage>} />

            {/* Marketplace & Products */}
            <Route path="marketplace" element={<SafePage fallback={SectionSpinner}><Marketplace /></SafePage>} />
            <Route path="product/:id" element={<SafePage fallback={SectionSpinner}><ProductDetail /></SafePage>} />

            {/* Commission Wallet */}
            <Route
              path="wallet"
              element={
                <SafePage fallback={SectionSpinner}>
                  <div className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-[#1F2937]">{t('app.commission_wallet')}</h2>
                    <CommissionWallet />
                  </div>
                </SafePage>
              }
            />

            {/* Phase 2: Growth Features */}
            <Route path="copilot" element={<SafePage fallback={SectionSpinner}><CopilotPage /></SafePage>} />
            <Route path="team" element={<SafePage fallback={SectionSpinner}><LeaderDashboard /></SafePage>} />
            <Route path="referral" element={<SafePage fallback={SectionSpinner}><ReferralPage /></SafePage>} />
            <Route path="network" element={<SafePage fallback={SectionSpinner}><NetworkPage /></SafePage>} />
            <Route path="withdrawal" element={<SafePage fallback={SectionSpinner}><WithdrawalPage /></SafePage>} />
            <Route path="health-coach" element={<SafePage fallback={SectionSpinner}><HealthCoach /></SafePage>} />
            <Route path="health-check" element={<SafePage fallback={SectionSpinner}><HealthCheck /></SafePage>} />
            <Route path="leaderboard" element={<SafePage fallback={SectionSpinner}><Leaderboard /></SafePage>} />
            <Route path="marketing-tools" element={<SafePage fallback={SectionSpinner}><MarketingTools /></SafePage>} />
            <Route path="agents" element={<SafePage fallback={SectionSpinner}><AgentDashboard /></SafePage>} />
            <Route path="settings" element={<SafePage fallback={SectionSpinner}><SettingsPage /></SafePage>} />
            <Route path="profile" element={<SafePage fallback={SectionSpinner}><ProfilePage /></SafePage>} />
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
          <Route path="/test" element={<ErrorBoundary><TestPage /></ErrorBoundary>} />
          <Route path="/debugger" element={<ErrorBoundary><DebuggerPage /></ErrorBoundary>} />
          <Route path="/system-status" element={<SafePage><SystemStatus /></SafePage>} />

          {/* ============================================================ */}
          {/* CATCH-ALL: Unknown routes show 404 page */}
          {/* ============================================================ */}
          <Route path="*" element={<SafePage><NotFoundPage /></SafePage>} />
        </Routes>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
