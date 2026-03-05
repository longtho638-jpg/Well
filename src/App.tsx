import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AdminRoute } from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  LandingPage, Login, Signup, ConfirmEmail, ReferralRedirect,
  ForgotPasswordPage, ResetPasswordPage, Dashboard, Marketplace,
  ProductDetail, CommissionWallet, VenturePage, CopilotPage,
  LeaderDashboard, ReferralPage, HealthCoach, HealthCheck,
  NetworkPage, WithdrawalPage, Leaderboard, MarketingTools,
  Admin, TestPage, DebuggerPage, SystemStatus, AgentDashboard,
  CheckoutPage, OrderSuccess, SettingsPage, ProfilePage,
  SubscriptionPage, NotFoundPage,
  Overview, CMS, Partners, Finance, PolicyEngine,
  OrderManagement, AdminProducts, AuditLog,
  PageSpinner, SectionSpinner, AdminSpinner,
} from './config/app-lazy-routes-and-suspense-fallbacks';

import { useStore } from './store';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { CursorGlow } from './components/CursorGlow';
import { useTranslation } from '@/hooks';
import { useAuth } from './hooks/useAuth';
import { useAutoLogout } from './hooks/useAutoLogout';
import { PWAInstallPrompt } from './components/pwa-install-prompt';

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
        <span className="sr-only">{t('common.loading')}</span>
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
          <Route path="/admin" element={<AdminRoute><SafePage><Admin /></SafePage></AdminRoute>}>
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
                <Navigate to="/login" replace />
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
            <Route path="subscription" element={<SafePage fallback={SectionSpinner}><SubscriptionPage /></SafePage>} />
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
          {/* DIAGNOSTIC ROUTES: Yêu cầu đăng nhập — không expose public */}
          {/* ============================================================ */}
          <Route
            path="/test"
            element={
              isAuthenticated ? (
                <ErrorBoundary><TestPage /></ErrorBoundary>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/debugger"
            element={
              isAuthenticated ? (
                <ErrorBoundary><DebuggerPage /></ErrorBoundary>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
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
