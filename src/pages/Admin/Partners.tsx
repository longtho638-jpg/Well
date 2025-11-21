import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Bot,
  Sparkles,
  Check,
  Lock,
  Eye,
  Gift,
  Mail,
  Phone,
  Calendar,
  Award,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '@/utils/format';

// ============================================================
// TYPES & MOCK DATA
// ============================================================

interface Partner {
  id: string;
  name: string;
  rank: string;
  sales: number;
  status: 'Active' | 'Banned' | 'Dormant';
  aiScore: number; // 0-100
  behavior: 'growing' | 'stable' | 'declining' | 'dormant' | 'near-upgrade';
  joinDate: string;
  email: string;
  phone: string;
  teamSize: number;
  lastActivity: string;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count: number;
}

const mockPartners: Partner[] = [
  {
    id: 'P001',
    name: 'Lan Nguyen',
    rank: 'Founder',
    sales: 125000000,
    status: 'Active',
    aiScore: 95,
    behavior: 'growing',
    joinDate: '2024-01-15',
    email: 'lan.nguyen@example.com',
    phone: '+84 90 123 4567',
    teamSize: 12,
    lastActivity: '2 hours ago',
  },
  {
    id: 'P002',
    name: 'Minh Tran',
    rank: 'Partner',
    sales: 89000000,
    status: 'Active',
    aiScore: 88,
    behavior: 'near-upgrade',
    joinDate: '2024-02-20',
    email: 'minh.tran@example.com',
    phone: '+84 91 234 5678',
    teamSize: 8,
    lastActivity: '1 day ago',
  },
  {
    id: 'P003',
    name: 'Huong Le',
    rank: 'Member',
    sales: 32000000,
    status: 'Active',
    aiScore: 72,
    behavior: 'stable',
    joinDate: '2024-03-10',
    email: 'huong.le@example.com',
    phone: '+84 92 345 6789',
    teamSize: 3,
    lastActivity: '3 days ago',
  },
  {
    id: 'P004',
    name: 'Tuan Vo',
    rank: 'Partner',
    sales: 67000000,
    status: 'Banned',
    aiScore: 45,
    behavior: 'declining',
    joinDate: '2024-01-05',
    email: 'tuan.vo@example.com',
    phone: '+84 93 456 7890',
    teamSize: 5,
    lastActivity: '2 weeks ago',
  },
  {
    id: 'P005',
    name: 'Mai Pham',
    rank: 'Member',
    sales: 15000000,
    status: 'Dormant',
    aiScore: 35,
    behavior: 'dormant',
    joinDate: '2024-02-01',
    email: 'mai.pham@example.com',
    phone: '+84 94 567 8901',
    teamSize: 1,
    lastActivity: '1 month ago',
  },
];

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All Partners', value: 'all', count: 245 },
  { id: 'growing', label: '🚀 Growing', value: 'growing', count: 78 },
  { id: 'near-upgrade', label: '⭐ Near Upgrade', value: 'near-upgrade', count: 23 },
  { id: 'stable', label: '✅ Stable', value: 'stable', count: 102 },
  { id: 'declining', label: '📉 Declining', value: 'declining', count: 18 },
  { id: 'dormant', label: '😴 Dormant', value: 'dormant', count: 24 },
];

// ============================================================
// AI INSIGHTS COMPONENT
// ============================================================

const AIInsights: React.FC<{ partner: Partner }> = ({ partner }) => {
  const insights = {
    growing: {
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      color: 'bg-green-50 border-green-200 text-green-900',
      title: 'High Growth Partner',
      suggestions: [
        'Consider featuring in success stories',
        'Invite to leadership training program',
        'Offer advanced product samples',
      ],
    },
    'near-upgrade': {
      icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      title: 'Close to Rank Upgrade',
      suggestions: [
        `Send birthday gift (${formatVND(500000)} voucher)`,
        'Schedule 1-on-1 coaching call',
        'Share rank upgrade checklist',
      ],
    },
    stable: {
      icon: <Check className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      title: 'Consistent Performer',
      suggestions: [
        'Maintain regular check-ins',
        'Share seasonal promotions',
        'Invite to community events',
      ],
    },
    declining: {
      icon: <TrendingDown className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200 text-orange-900',
      title: 'Needs Attention',
      suggestions: [
        'Send personalized re-engagement email',
        'Offer product refresh consultation',
        'Share new earning opportunities',
      ],
    },
    dormant: {
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      color: 'bg-red-50 border-red-200 text-red-900',
      title: 'At Risk',
      suggestions: [
        'Urgent: Call within 24 hours',
        'Offer reactivation bonus',
        'Survey reasons for inactivity',
      ],
    },
  };

  const insight = insights[partner.behavior];

  return (
    <div className={`p-4 rounded-lg border ${insight.color}`}>
      <div className="flex items-center gap-2 mb-3">
        {insight.icon}
        <h4 className="font-semibold">{insight.title}</h4>
        <span className="ml-auto text-xs font-medium">AI Score: {partner.aiScore}/100</span>
      </div>
      <div className="space-y-2">
        {insight.suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{suggestion}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// PARTNER DETAIL MODAL
// ============================================================

const PartnerDetailModal: React.FC<{ partner: Partner; onClose: () => void }> = ({ partner, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">{partner.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  partner.rank === 'Founder'
                    ? 'bg-amber-100 text-amber-700'
                    : partner.rank === 'Partner'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {partner.rank}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  partner.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : partner.status === 'Dormant'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {partner.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900">{partner.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-medium text-slate-900">{partner.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Join Date</p>
                <p className="text-sm font-medium text-slate-900">{partner.joinDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Team Size</p>
                <p className="text-sm font-medium text-slate-900">{partner.teamSize} members</p>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00575A]" />
              Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Total Sales</p>
                <p className="text-xl font-bold text-slate-900">{formatVND(partner.sales)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Activity</p>
                <p className="text-xl font-bold text-slate-900">{partner.lastActivity}</p>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <AIInsights partner={partner} />

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button className="px-4 py-3 bg-[#00575A] text-white rounded-lg hover:bg-[#004447] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Mail className="w-4 h-4" />
              Send Email
            </button>
            <button className="px-4 py-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Gift className="w-4 h-4" />
              Send Gift
            </button>
            <button className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Phone className="w-4 h-4" />
              Call
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================
// MAIN PARTNERS COMPONENT
// ============================================================

const Partners: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Filter partners
  const filteredPartners = mockPartners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || partner.behavior === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Partner CRM</h2>
        <p className="text-slate-500 mt-1">AI-powered partner intelligence & management</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent"
            >
              {filterOptions.map((option) => (
                <option key={option.id} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  AI Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Behavior
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
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{partner.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{partner.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      partner.rank === 'Founder'
                        ? 'bg-amber-100 text-amber-700'
                        : partner.rank === 'Partner'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {partner.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{formatVND(partner.sales)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            partner.aiScore >= 80
                              ? 'bg-green-600'
                              : partner.aiScore >= 60
                              ? 'bg-amber-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${partner.aiScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{partner.aiScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm">
                      {partner.behavior === 'growing' && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {partner.behavior === 'declining' && <TrendingDown className="w-4 h-4 text-red-600" />}
                      {partner.behavior === 'near-upgrade' && <Sparkles className="w-4 h-4 text-amber-600" />}
                      {partner.behavior === 'stable' && <Check className="w-4 h-4 text-blue-600" />}
                      {partner.behavior === 'dormant' && <AlertCircle className="w-4 h-4 text-slate-400" />}
                      <span className="text-slate-600 capitalize">{partner.behavior.replace('-', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      partner.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : partner.status === 'Dormant'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPartner(partner)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Partner Detail Modal */}
      <AnimatePresence>
        {selectedPartner && (
          <PartnerDetailModal
            partner={selectedPartner}
            onClose={() => setSelectedPartner(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Partners;
