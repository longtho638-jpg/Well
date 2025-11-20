
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import ProductCard from './components/ProductCard';
import CommissionWallet from './components/CommissionWallet';
import { Menu } from 'lucide-react';
import { useStore } from './store';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Access Global State
  const { products } = useStore();

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'marketplace':
         return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-brand-dark">Marketplace</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            </div>
         );
      case 'wallet':
        return (
            <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold text-brand-dark">Commission Wallet</h2>
                <CommissionWallet />
            </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-bg font-sans text-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-72 flex-shrink-0">
        <Sidebar 
            activeView={currentView} 
            onChangeView={setCurrentView} 
        />
      </div>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden fixed top-0 w-full bg-white z-40 border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="font-bold text-brand-primary text-lg tracking-tight">WellNexus</div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 active:bg-gray-100 rounded-full">
            <Menu className="text-gray-600" />
         </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-72 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-200">
                 <Sidebar 
                    activeView={currentView} 
                    onChangeView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} 
                />
            </div>
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen pt-20 md:pt-8 scroll-smooth">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
