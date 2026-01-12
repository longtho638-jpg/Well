import React, { useState, useEffect } from 'react';
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
  Save,
  X,
  Loader2,
  Edit2
} from 'lucide-react';
import { formatVND } from '@/utils/format';
import { supabase } from '@/lib/supabase';
import { UserRank, RANK_NAMES } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { adminLogger } from '@/utils/logger';

// ============================================================
// TYPES
// ============================================================

// Supabase database user record type
interface SupabaseUserRecord {
  id: string;
  name?: string;
  email?: string;
  role_id?: number;
  total_sales?: number;
  pending_cashback?: number;
  point_balance?: number;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
}

interface Partner {
  id: string;
  name: string;
  email: string;
  rank: UserRank;
  roleId: number;
  totalSales: number;
  pendingCashback: number;
  pointBalance: number;
  joinDate: string;
  status: 'Active' | 'Banned' | 'Dormant';
  lastActivity: string;
  avatarUrl?: string;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All Partners', value: 'all' },
  { id: 'active', label: 'Active', value: 'Active' },
  { id: 'banned', label: 'Banned', value: 'Banned' },
];

// ============================================================
// PARTNER DETAIL MODAL
// ============================================================

const PartnerDetailModal: React.FC<{
  partner: Partner;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ partner, onClose, onUpdate }) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [formData, setFormData] = useState({
    rank: partner.rank,
    pendingCashback: partner.pendingCashback,
    pointBalance: partner.pointBalance,
    totalSales: partner.totalSales
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          role_id: formData.rank, // Map rank to role_id
          pending_cashback: formData.pendingCashback,
          point_balance: formData.pointBalance,
          total_sales: formData.totalSales
        })
        .eq('id', partner.id);

      if (error) throw error;

      showToast('Partner updated successfully', 'success');
      onUpdate(); // Refresh list
      setIsEditing(false);
    } catch (error) {
      adminLogger.error('Error updating partner', error);
      showToast('Failed to update partner', 'error');
    } finally {
      setLoading(false);
    }
  };

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
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
                  {RANK_NAMES[partner.rank] || 'Unknown'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {partner.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Partner Details</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-sm text-[#00575A] hover:underline"
              >
                <Edit2 className="w-4 h-4" /> Edit Metrics
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-[#00575A] text-white rounded hover:bg-[#004447] flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Rank */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Rank</label>
              {isEditing ? (
                <select
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {Object.entries(RANK_NAMES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900">{RANK_NAMES[partner.rank]}</p>
              )}
            </div>

            {/* Sales */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Total Sales</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.totalSales}
                  onChange={(e) => setFormData({ ...formData, totalSales: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{formatVND(partner.totalSales)}</p>
              )}
            </div>

            {/* Pending Cashback */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Pending Cashback</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.pendingCashback}
                  onChange={(e) => setFormData({ ...formData, pendingCashback: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{formatVND(partner.pendingCashback)}</p>
              )}
            </div>

            {/* Points */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Point Balance</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.pointBalance}
                  onChange={(e) => setFormData({ ...formData, pointBalance: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900">{partner.pointBalance.toLocaleString()} pts</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Contact Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-slate-900">{partner.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Joined</p>
                <p className="text-sm text-slate-900">{partner.joinDate}</p>
              </div>
            </div>
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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { showToast } = useToast();

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPartners: Partner[] = (data || []).map((user: SupabaseUserRecord) => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        rank: (user.role_id as UserRank) || UserRank.CTV,
        roleId: user.role_id || 8,
        totalSales: user.total_sales || 0,
        pendingCashback: user.pending_cashback || 0,
        pointBalance: user.point_balance || 0,
        joinDate: new Date(user.created_at).toLocaleDateString('vi-VN'),
        status: 'Active', // Default
        lastActivity: new Date(user.updated_at || user.created_at).toLocaleDateString('vi-VN'),
        avatarUrl: user.avatar_url
      }));

      setPartners(formattedPartners);
    } catch (error) {
      adminLogger.error('Error fetching partners', error);
      showToast('Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Filter partners
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || partner.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPartners.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPartners.map(p => p.id)));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'ban' | 'export') => {
    if (selectedIds.size === 0) {
      showToast('No partners selected', 'error');
      return;
    }

    setBulkActionLoading(true);
    try {
      if (action === 'export') {
        // Export to CSV
        const selectedPartners = partners.filter(p => selectedIds.has(p.id));
        const csv = [
          ['Name', 'Email', 'Rank', 'Sales', 'Points', 'Status'].join(','),
          ...selectedPartners.map(p => [
            p.name,
            p.email,
            RANK_NAMES[p.rank],
            p.totalSales,
            p.pointBalance,
            p.status
          ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `partners-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showToast(`Exported ${selectedIds.size} partners`, 'success');
      } else {
        // Update status in database (mock for now)
        showToast(`${action === 'ban' ? 'Banned' : 'Activated'} ${selectedIds.size} partners`, 'success');
      }
      setSelectedIds(new Set());
    } catch (error) {
      adminLogger.error('Bulk action error', error);
      showToast('Bulk action failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Partner CRM (Bee 3.0)</h2>
        <p className="text-slate-500 mt-1">Manage users, ranks, and balances directly.</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchPartners}
            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            title="Refresh Data"
          >
            <Loader2 className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-700">
              {selectedIds.size} partner{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('ban')}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Lock className="w-4 h-4 inline mr-1" />
              Ban
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Partners Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.size === filteredPartners.length && filteredPartners.length > 0
                      ? 'bg-[#00575A] border-[#00575A]'
                      : 'border-slate-300 hover:border-slate-400'
                      }`}
                  >
                    {selectedIds.size === filteredPartners.length && filteredPartners.length > 0 && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                </th>
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
                  Pending Cashback
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Points
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading partners...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No partners found.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(partner.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleSelect(partner.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedIds.has(partner.id)
                          ? 'bg-[#00575A] border-[#00575A]'
                          : 'border-slate-300 hover:border-slate-400'
                          }`}
                      >
                        {selectedIds.has(partner.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{partner.name}</p>
                        <p className="text-xs text-slate-500">{partner.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700`}>
                        {RANK_NAMES[partner.rank] || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{formatVND(partner.totalSales)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{formatVND(partner.pendingCashback)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{partner.pointBalance.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${partner.status === 'Active'
                        ? 'bg-green-100 text-green-700'
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
                          title="View & Edit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
            onUpdate={() => {
              fetchPartners();
              setSelectedPartner(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Partners;
