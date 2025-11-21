
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Marketplace } from './pages/Marketplace';
import { ProductDetail } from './pages/ProductDetail';
import CommissionWallet from './components/CommissionWallet';
import Achievements from './components/Achievements';
import Leaderboard from './components/Leaderboard';
import Goals from './components/Goals';
import AICoachPanel from './components/AICoachPanel';
import LandingPage from './pages/LandingPage';
import { Menu } from 'lucide-react';
import { useStore } from './store';

// --- 1. DASHBOARD LAYOUT (KHU VỰC CÓ SIDEBAR) ---
const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = (path: string) => { window.location.hash = path; }; // Helper for hash router if needed

  // Add escape key handler for mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] font-sans text-[#1F2937]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white z-40 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="font-bold text-[#00575A] text-lg tracking-tight">WellNexus</div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 active:bg-gray-100 rounded-full">
            <Menu className="text-gray-600" />
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-72 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                 <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Main Content Area - Render child routes here */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen pt-20 md:pt-0 scroll-smooth">
        <Outlet />
      </main>

      {/* AI Coach Panel - Global */}
      <AICoachPanel />
    </div>
  );
};

// --- 2. MAIN APP ROUTER ---
const App: React.FC = () => {
  const { isAuthenticated } = useStore();

  return (
    <Routes>
      {/* Route 1: Landing Page (Mặc định khi vào /) */}
      <Route path="/" element={<LandingPage />} />

      {/* Route 2: Protected Dashboard Routes */}
      {/* Nếu đã login -> Vào Layout. Nếu chưa -> Đá về Landing */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/" replace />} 
      >
        {/* Các route con bên trong Dashboard Layout */}
        <Route index element={<Dashboard />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="wallet" element={
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-[#1F2937]">Commission Wallet</h2>
                <CommissionWallet />
            </div>
        } />
        <Route path="achievements" element={
            <div className="space-y-6 pb-20">
                <Achievements />
            </div>
        } />
        <Route path="leaderboard" element={
            <div className="space-y-6 pb-20">
                <Leaderboard />
            </div>
        } />
        <Route path="goals" element={
            <div className="space-y-6 pb-20">
                <Goals />
            </div>
        } />
        <Route path="product/:id" element={<ProductDetail />} />
      </Route>
      
      {/* Fallback for legacy paths or redirects */}
      <Route path="/marketplace" element={<Navigate to="/dashboard/marketplace" replace />} />
      <Route path="/wallet" element={<Navigate to="/dashboard/wallet" replace />} />
      <Route path="/product/:id" element={<Navigate to="/dashboard/product/:id" replace />} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
