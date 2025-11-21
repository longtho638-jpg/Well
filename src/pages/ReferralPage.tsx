import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Copy,
  Check,
  Users,
  TrendingUp,
  DollarSign,
  Gift,
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Link as LinkIcon,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useStore } from '@/store';
import { Referral } from '@/types';
import { formatVND } from '@/utils/format';
import { REFERRALS, REFERRAL_STATS } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReferralPage() {
  const { user } = useStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'referrals'>('overview');

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://${REFERRAL_STATS.referralLink}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join WellNexus - Transform Your Health & Income!');
    const body = encodeURIComponent(
      `Hi! I've been using WellNexus and thought you'd love it too.\n\nJoin me here: https://${REFERRAL_STATS.referralLink}\n\nLet's grow together!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Join WellNexus with me! https://${REFERRAL_STATS.referralLink}`
    );
    window.location.href = `sms:?body=${message}`;
  };

  const getStatusIcon = (status: Referral['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'registered':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Referral['status']) => {
    const badges = {
      active: 'bg-green-100 text-green-700',
      registered: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-gray-100 text-gray-700'
    };
    return badges[status] || badges.pending;
  };

  // Mock chart data
  const referralTrendData = [
    { month: 'Jan', referrals: 0, revenue: 0 },
    { month: 'Feb', referrals: 1, revenue: 1200000 },
    { month: 'Mar', referrals: 2, revenue: 2050000 },
    { month: 'Apr', referrals: 3, revenue: 2570000 },
    { month: 'May', referrals: 4, revenue: 2570000 }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <Share2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Giới Thiệu & Kiếm Tiền</h1>
                <p className="text-white/80 text-sm">Referral Tracking System</p>
              </div>
            </div>
            <p className="text-white/90 max-w-2xl">
              Chia sẻ link giới thiệu và nhận hoa hồng từ mỗi người bạn giới thiệu thành công!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {REFERRAL_STATS.activeReferrals} Active
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{REFERRAL_STATS.totalReferrals}</h3>
          <p className="text-sm text-gray-600">Tổng Giới Thiệu</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">
              {REFERRAL_STATS.conversionRate}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{REFERRAL_STATS.conversionRate}%</h3>
          <p className="text-sm text-gray-600">Tỉ Lệ Chuyển Đổi</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-purple-500" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatVND(REFERRAL_STATS.totalBonus)}</h3>
          <p className="text-sm text-gray-600">Tổng Hoa Hồng</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <Gift className="w-8 h-8 text-orange-500" />
            <span className="text-xs font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
              Tháng này
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{REFERRAL_STATS.monthlyReferrals}</h3>
          <p className="text-sm text-gray-600">Giới Thiệu Mới</p>
        </motion.div>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">📎 Link Giới Thiệu Của Bạn</h3>
            <p className="text-sm text-gray-600">Chia sẻ link này để bắt đầu kiếm hoa hồng!</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 flex items-center gap-3 mb-6">
          <LinkIcon className="w-5 h-5 text-primary flex-shrink-0" />
          <input
            type="text"
            value={`https://${REFERRAL_STATS.referralLink}`}
            readOnly
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-mono"
          />
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                Đã copy!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={shareViaEmail}
            className="px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 justify-center transition-colors"
          >
            <Mail className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">Email</span>
          </button>
          <button
            onClick={shareViaSMS}
            className="px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 justify-center transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">SMS</span>
          </button>
          <button className="px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 justify-center transition-colors">
            <Facebook className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Facebook</span>
          </button>
          <button className="px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2 justify-center transition-colors">
            <Twitter className="w-5 h-5 text-sky-500" />
            <span className="text-sm font-medium">Twitter</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-6 py-3 font-medium transition-colors ${
            selectedTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tổng Quan
        </button>
        <button
          onClick={() => setSelectedTab('referrals')}
          className={`px-6 py-3 font-medium transition-colors ${
            selectedTab === 'referrals'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Danh Sách Giới Thiệu ({REFERRALS.length})
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' ? (
        <div className="space-y-6">
          {/* Trend Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Xu Hướng Giới Thiệu
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={referralTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'revenue' ? formatVND(value) : value
                  }
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="referrals"
                  stroke="#00575A"
                  strokeWidth={3}
                  name="Referrals"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FFBF00"
                  strokeWidth={3}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rewards Program */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Chương Trình Thưởng
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl mb-2">🎁</div>
                <h4 className="font-bold text-gray-900 mb-1">Đăng Ký</h4>
                <p className="text-sm text-gray-600 mb-2">Mỗi người đăng ký</p>
                <p className="text-lg font-bold text-purple-600">+50.000 ₫</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-bold text-gray-900 mb-1">Mua Đầu Tiên</h4>
                <p className="text-sm text-gray-600 mb-2">Khi họ mua hàng lần đầu</p>
                <p className="text-lg font-bold text-purple-600">+10% doanh thu</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-bold text-gray-900 mb-1">Cột Mốc</h4>
                <p className="text-sm text-gray-600 mb-2">10 người active</p>
                <p className="text-lg font-bold text-purple-600">+1.000.000 ₫</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Referrals List */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Người Giới Thiệu</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày Tạo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Doanh Thu</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Hoa Hồng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {REFERRALS.map((referral, index) => (
                  <motion.tr
                    key={referral.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {referral.referredName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referral.referredName || 'Chưa đăng ký'}</p>
                          <p className="text-xs text-gray-500">{referral.referredEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(referral.status)}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(referral.status)}`}>
                          {referral.status === 'active' && 'Đang hoạt động'}
                          {referral.status === 'registered' && 'Đã đăng ký'}
                          {referral.status === 'pending' && 'Chờ xác nhận'}
                          {referral.status === 'expired' && 'Hết hạn'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(referral.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {referral.totalRevenue > 0 ? formatVND(referral.totalRevenue) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-green-600">
                        {referral.referralBonus > 0 ? formatVND(referral.referralBonus) : '-'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
