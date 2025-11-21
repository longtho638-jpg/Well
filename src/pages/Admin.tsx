import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Activity,
  Search,
  Save,
  Lock,
  Check,
  X,
  Menu,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatVND } from '@/utils/format';

// ============================================================
// TYPES
// ============================================================

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  status?: 'success' | 'warning' | 'error';
  icon: React.ReactNode;
}

interface PartnerRow {
  id: string;
  name: string;
  rank: string;
  sales: number;
  status: 'Active' | 'Banned';
}

interface WithdrawalRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  gross: number;
  tax: number;
  net: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

type Tab = 'overview' | 'cms' | 'partners' | 'finance';

// ============================================================
// MOCK DATA
// ============================================================

const mockGrowthData = [
  { name: 'T2', revenue: 180000000 },
  { name: 'T3', revenue: 220000000 },
  { name: 'T4', revenue: 280000000 },
  { name: 'T5', revenue: 310000000 },
  { name: 'T6', revenue: 390000000 },
  { name: 'T7', revenue: 450000000 },
  { name: 'CN', revenue: 520000000 },
];

const mockPartners: PartnerRow[] = [
  { id: 'P001', name: 'Lan Nguyen', rank: 'Founder', sales: 125000000, status: 'Active' },
  { id: 'P002', name: 'Minh Tran', rank: 'Partner', sales: 89000000, status: 'Active' },
  { id: 'P003', name: 'Huong Le', rank: 'Member', sales: 32000000, status: 'Active' },
  { id: 'P004', name: 'Tuan Vo', rank: 'Partner', sales: 67000000, status: 'Banned' },
];

const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: 'W001',
    partnerId: 'P001',
    partnerName: 'Lan Nguyen',
    gross: 5000000,
    tax: 500000,
    net: 4500000,
    status: 'Pending',
  },
  {
    id: 'W002',
    partnerId: 'P002',
    partnerName: 'Minh Tran',
    gross: 3200000,
    tax: 320000,
    net: 2880000,
    status: 'Pending',
  },
];

// ============================================================
// METRIC CARD COMPONENT
// ============================================================

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, status, icon }) => {
  const statusColors = {
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
  };

  const trendColor = trend?.startsWith('+') ? 'text-green-600' : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-lg p-6 hover:border-[#00575A] transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-display font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendColor} flex items-center gap-1`}>
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${status ? statusColors[status] : 'bg-slate-100 text-slate-600'}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// MAIN ADMIN COMPONENT
// ============================================================

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // CMS State
  const [headline, setHeadline] = useState('Vững Tin Vươn Tầm');
  const [subheadline, setSubheadline] = useState('Hệ sinh thái kinh doanh sức khỏe 4.0');
  const [ctaText, setCtaText] = useState('Tham gia Founders Club');

  // Finance State
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(mockWithdrawals);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'cms', label: 'CMS', icon: <FileText className="w-5 h-5" /> },
    { id: 'partners', label: 'Partners', icon: <Users className="w-5 h-5" /> },
    { id: 'finance', label: 'Finance', icon: <Wallet className="w-5 h-5" /> },
  ];

  const handleSaveCMS = () => {
    localStorage.setItem('cms_headline', headline);
    localStorage.setItem('cms_subheadline', subheadline);
    localStorage.setItem('cms_cta', ctaText);
    alert('CMS Content saved successfully!');
  };

  const handleApproveWithdrawal = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'Approved' as const } : w))
    );
  };

  const handleRejectWithdrawal = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'Rejected' as const } : w))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ============================================================ */}
      {/* SIDEBAR */}
      {/* ============================================================ */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="bg-white border-r border-slate-200 flex flex-col fixed h-screen z-30 hidden md:flex"
      >
        {/* Logo */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6">
          {!sidebarCollapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display font-bold text-xl text-[#00575A]"
            >
              Mission Control
            </motion.h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00575A] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {!sidebarCollapsed && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00575A] flex items-center justify-center text-white font-bold">
              A
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">Admin</p>
                <p className="text-xs text-slate-500">Super User</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-280 bg-white h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6">
                <h1 className="font-display font-bold text-xl text-[#00575A]">Mission Control</h1>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#00575A] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <div className="flex-1 md:ml-[280px] transition-all" style={{ marginLeft: sidebarCollapsed ? 80 : 280 }}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-900 font-medium capitalize">{activeTab}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <AlertCircle className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            {/* ============================================================ */}
            {/* TAB: OVERVIEW */}
            {/* ============================================================ */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-display font-bold text-slate-900">System Overview</h2>
                  <p className="text-slate-500 mt-1">Real-time platform metrics and health status</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    label="Total Revenue"
                    value="2.450.000.000 ₫"
                    trend="+12%"
                    icon={<Activity className="w-6 h-6" />}
                  />
                  <MetricCard
                    label="Active Partners"
                    value="245"
                    trend="+5"
                    icon={<Users className="w-6 h-6" />}
                  />
                  <MetricCard
                    label="Pending Payouts"
                    value="15"
                    status="warning"
                    icon={<AlertCircle className="w-6 h-6" />}
                  />
                  <MetricCard
                    label="System Health"
                    value="99.9%"
                    status="success"
                    icon={<CheckCircle2 className="w-6 h-6" />}
                  />
                </div>

                {/* Chart */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-display font-bold text-slate-900 mb-6">7-Day Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockGrowthData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00575A" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00575A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatVND(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#00575A"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* TAB: CMS */}
            {/* ============================================================ */}
            {activeTab === 'cms' && (
              <motion.div
                key="cms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-display font-bold text-slate-900">Content Management</h2>
                  <p className="text-slate-500 mt-1">Edit landing page content and marketing copy</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
                  {/* Headline */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hero Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Subheadline */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hero Subheadline</label>
                    <input
                      type="text"
                      value={subheadline}
                      onChange={(e) => setSubheadline(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* CTA Text */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">CTA Button Text</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveCMS}
                    className="w-full md:w-auto px-6 py-3 bg-[#00575A] text-white font-medium rounded-lg hover:bg-[#004447] transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>

                {/* Preview */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-display font-bold text-slate-900 mb-4">Preview</h3>
                  <div className="border border-slate-200 rounded-lg p-8 bg-gradient-to-br from-[#00575A]/5 to-transparent">
                    <h1 className="text-4xl font-display font-bold text-slate-900 mb-3">{headline}</h1>
                    <p className="text-xl text-slate-600 mb-6">{subheadline}</p>
                    <button className="px-6 py-3 bg-[#00575A] text-white font-medium rounded-lg">
                      {ctaText}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* TAB: PARTNERS */}
            {/* ============================================================ */}
            {activeTab === 'partners' && (
              <motion.div
                key="partners"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-display font-bold text-slate-900">Partner Operations</h2>
                  <p className="text-slate-500 mt-1">Manage partner accounts and KYC verification</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Sales
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {mockPartners.map((partner) => (
                          <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-mono text-slate-600">{partner.id}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{partner.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  partner.rank === 'Founder'
                                    ? 'bg-amber-100 text-amber-700'
                                    : partner.rank === 'Partner'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {partner.rank}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900">{formatVND(partner.sales)}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  partner.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {partner.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                                  <Lock className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ============================================================ */}
            {/* TAB: FINANCE */}
            {/* ============================================================ */}
            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-display font-bold text-slate-900">Finance Operations</h2>
                  <p className="text-slate-500 mt-1">Manage withdrawal requests and tax compliance</p>
                </div>

                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="bg-white border border-slate-200 rounded-lg p-6 hover:border-[#00575A] transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-display font-bold text-slate-900">
                              {withdrawal.partnerName}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                withdrawal.status === 'Approved'
                                  ? 'bg-green-100 text-green-700'
                                  : withdrawal.status === 'Rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {withdrawal.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">ID: {withdrawal.id}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Gross: </span>
                              <span className="font-medium text-slate-900">
                                {formatVND(withdrawal.gross)}
                              </span>
                            </div>
                            <span className="text-slate-300">-</span>
                            <div>
                              <span className="text-slate-500">Tax (10%): </span>
                              <span className="font-medium text-red-600">{formatVND(withdrawal.tax)}</span>
                            </div>
                            <span className="text-slate-300">=</span>
                            <div>
                              <span className="text-slate-500">Net: </span>
                              <span className="font-bold text-[#00575A]">{formatVND(withdrawal.net)}</span>
                            </div>
                          </div>
                        </div>

                        {withdrawal.status === 'Pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(withdrawal.id)}
                              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(withdrawal.id)}
                              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {withdrawals.length === 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                    <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No withdrawal requests at this time</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Admin;
