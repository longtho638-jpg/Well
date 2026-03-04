/**
 * Route configuration — lazy-loaded page components and Suspense fallbacks.
 * Extracted from App.tsx to keep router file under 200 LOC.
 */

import React, { lazy } from 'react';

// ============================================================
// LAZY PAGE IMPORTS
// ============================================================

export const LandingPage = lazy(() => import('../pages/LandingPage'));
export const Login = lazy(() => import('../pages/Login'));
export const Signup = lazy(() => import('../pages/Signup'));
export const ConfirmEmail = lazy(() => import('../pages/confirm-email'));
export const ReferralRedirect = lazy(() => import('../pages/referral-redirect'));
export const ForgotPasswordPage = lazy(() => import('../pages/forgot-password-page'));
export const ResetPasswordPage = lazy(() => import('../pages/reset-password-page'));
export const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
export const Marketplace = lazy(() => import('../pages/Marketplace').then(m => ({ default: m.Marketplace })));
export const ProductDetail = lazy(() => import('../pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
export const CommissionWallet = lazy(() => import('../components/CommissionWallet'));
export const VenturePage = lazy(() => import('../pages/VenturePage'));
export const CopilotPage = lazy(() => import('../pages/CopilotPage'));
export const LeaderDashboard = lazy(() => import('../pages/LeaderDashboard'));
export const ReferralPage = lazy(() => import('../pages/ReferralPage'));
export const HealthCoach = lazy(() => import('../pages/HealthCoach'));
export const HealthCheck = lazy(() => import('../pages/HealthCheck'));
export const NetworkPage = lazy(() => import('../pages/NetworkPage'));
export const WithdrawalPage = lazy(() => import('../pages/WithdrawalPage'));
export const Leaderboard = lazy(() => import('../pages/Leaderboard'));
export const MarketingTools = lazy(() => import('../pages/MarketingTools'));
export const Admin = lazy(() => import('../pages/Admin'));
export const TestPage = lazy(() => import('../pages/TestPage'));
export const DebuggerPage = lazy(() => import('../pages/DebuggerPage'));
export const SystemStatus = lazy(() => import('../pages/SystemStatus'));
export const AgentDashboard = lazy(() => import('../pages/AgentDashboard'));
export const CheckoutPage = lazy(() => import('../pages/Checkout/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
export const OrderSuccess = lazy(() => import('../components/checkout/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
export const SettingsPage = lazy(() => import('../pages/SettingsPage'));
export const ProfilePage = lazy(() => import('../pages/ProfilePage'));
export const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
export const VendorDashboard = lazy(() => import('../components/marketplace/VendorDashboard').then(m => ({ default: m.VendorDashboard })));

// Admin sub-pages
export const Overview = lazy(() => import('../pages/Admin/Overview'));
export const CMS = lazy(() => import('../pages/Admin/CMS'));
export const Partners = lazy(() => import('../pages/Admin/Partners'));
export const Finance = lazy(() => import('../pages/Admin/Finance'));
export const PolicyEngine = lazy(() => import('../pages/Admin/PolicyEngine'));
export const OrderManagement = lazy(() => import('../pages/Admin/OrderManagement'));
export const AdminProducts = lazy(() => import('../pages/Admin/Products'));
export const AuditLog = lazy(() => import('../pages/Admin/AuditLog'));

// ============================================================
// SUSPENSE FALLBACK ELEMENTS
// ============================================================

export const PageSpinner = React.createElement(
  'div',
  { className: 'flex items-center justify-center h-screen bg-zinc-950', role: 'status' },
  React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500' }),
  React.createElement('span', { className: 'sr-only' }, 'Loading page...')
);

export const SectionSpinner = React.createElement(
  'div',
  { className: 'flex items-center justify-center h-96', role: 'status' },
  React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]' }),
  React.createElement('span', { className: 'sr-only' }, 'Loading content...')
);

export const AdminSpinner = React.createElement(
  'div',
  { className: 'flex items-center justify-center h-screen', role: 'status' },
  React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]' }),
  React.createElement('span', { className: 'sr-only' }, 'Loading admin panel...')
);
