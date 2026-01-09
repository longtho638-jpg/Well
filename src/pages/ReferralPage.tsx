import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  QrCode,
  Download,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Network,
  Sparkles,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { useStore } from '@/store';
import { Referral } from '@/types';
import { formatVND } from '@/utils/format';
import { REFERRALS, REFERRAL_STATS } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/hooks';

export default function ReferralPage() {
  const { t } = useTranslation();
  const { user } = useStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'network'>('overview');
  const [showQRCode, setShowQRCode] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const referralUrl = `https://${user.referralLink || `wellnexus.vn/ref/${user.id}`}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralUrl)}&margin=20&qzone=2&color=00575A`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaZalo = () => {
    const text = encodeURIComponent(
      `🌟 Tham gia WellNexus cùng tôi! Nền tảng chăm sóc sức khỏe và kinh doanh thông minh.\n\n👉 ${referralUrl}\n\nĐăng ký ngay để nhận ưu đãi đặc biệt!`
    );
    window.open(`https://zalo.me/share?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank');
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent(`Tham gia WellNexus cùng tôi! ${referralUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join WellNexus - Transform Your Health & Income!');
    const body = encodeURIComponent(
      `Hi! I've been using WellNexus and thought you'd love it too.\n\nJoin me here: ${referralUrl}\n\nLet's grow together!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'wellnexus-referral-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      active: 'bg-green-100 text-green-700 border-green-200',
      registered: 'bg-blue-100 text-blue-700 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      expired: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return badges[status] || badges.pending;
  };

  const getStatusLabel = (status: Referral['status']) => {
    const labels = {
      active: 'Đang hoạt động',
      registered: 'Đã đăng ký',
      pending: 'Chờ xác nhận',
      expired: 'Hết hạn'
    };
    return labels[status] || 'Không xác định';
  };

  // Mock chart data
  const referralTrendData = [
    { month: 'T1', referrals: 0, revenue: 0 },
    { month: 'T2', referrals: 1, revenue: 1200000 },
    { month: 'T3', referrals: 2, revenue: 2050000 },
    { month: 'T4', referrals: 3, revenue: 2570000 },
    { month: 'T5', referrals: 4, revenue: 2570000 }
  ];

  // Group referrals by level (F1, F2)
  const f1Referrals = REFERRALS.filter(r => r.level === 1);
  const f2Referrals = REFERRALS.filter(r => r.level === 2);

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary via-teal-600 to-cyan-600 dark:from-teal-800 dark:via-teal-900 dark:to-cyan-900 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-white/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 dark:bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative p-12">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30"
                >
                  <Share2 className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{t('referral.title')}</h1>
                  <p className="text-teal-100 text-lg">{t('referral.subtitle')}</p>
                </div>
              </div>
              <p className="text-white/90 max-w-2xl text-lg">
                {t('referral.description')}
              </p>
            </div>

            {/* Total Earnings Display */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="bg-white/20 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border-2 border-white/30 min-w-[280px]"
            >
              <div className="text-center">
                <p className="text-teal-100 text-sm mb-2 font-semibold">TỔNG THU NHẬP</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="text-5xl font-bold text-white drop-shadow-lg mb-2"
                >
                  {formatVND(REFERRAL_STATS.totalBonus)}
                </motion.p>
                <div className="flex items-center justify-center gap-2 text-accent">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold">+{REFERRAL_STATS.monthlyReferrals} tháng này</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{REFERRAL_STATS.totalReferrals}</p>
                  <p className="text-teal-100 text-sm">{t('referral.stats.totalReferrals')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-accent text-sm">
                <span className="font-bold bg-accent/20 px-2 py-1 rounded-full">
                  {REFERRAL_STATS.activeReferrals} {t('referral.stats.active')}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{REFERRAL_STATS.conversionRate}%</p>
                  <p className="text-teal-100 text-sm">{t('referral.stats.conversionRate')}</p>
                </div>
              </div>
              <div className="text-accent text-sm font-bold">
                Xuất sắc! 🎯
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{REFERRAL_STATS.monthlyReferrals}</p>
                  <p className="text-teal-100 text-sm">{t('referral.stats.monthlyReferrals')}</p>
                </div>
              </div>
              <div className="text-accent text-sm font-bold">
                Tuyệt vời! 🎉
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-2xl mb-2 flex items-center gap-2">
                <Share2 className="w-6 h-6 text-primary dark:text-teal-400" />
                {t('referral.link.title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{t('referral.link.description')}</p>
            </div>
          </div>

          {/* Link Input */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex items-center gap-3 mb-6 shadow-md border-2 border-primary/20 dark:border-teal-600/30">
            <div className="flex-1 font-mono text-sm text-gray-700 dark:text-slate-300 truncate">
              {referralUrl}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyReferralLink}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-teal-600 hover:shadow-lg active:scale-95 active:shadow-inner text-white rounded-lg flex items-center gap-2 transition-all font-semibold"
            >
              {copiedLink ? (
                <>
                  <Check className="w-5 h-5" />
                  {t('referral.link.copied')}
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  {t('referral.link.copy')}
                </>
              )}
            </motion.button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareViaZalo}
              className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-slate-100">Zalo</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareViaFacebook}
              className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">f</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-slate-100">Facebook</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareViaTelegram}
              className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 active:bg-sky-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-sky-300 dark:hover:border-sky-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
            >
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-slate-100">Telegram</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareViaEmail}
              className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-slate-800 active:bg-red-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
            >
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-slate-100">Email</span>
            </motion.button>
          </div>

          {/* QR Code Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQRCode(!showQRCode)}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg font-bold text-lg group"
          >
            <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            {showQRCode ? 'Ẩn QR Code' : 'Hiển Thị QR Code'}
          </motion.button>
        </motion.div>

        {/* QR Code Card */}
        <AnimatePresence>
          {showQRCode && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200 }}
              ref={qrCodeRef}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-xl border border-purple-200 dark:border-purple-800 p-8"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <QrCode className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-2xl">QR Code Giới Thiệu</h3>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg inline-block mb-6">
                  <img
                    src={qrCodeUrl}
                    alt="Referral QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-1">WellNexus</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Quét mã để tham gia</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadQRCode}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 font-bold group"
                >
                  <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  Tải Xuống QR Code
                </motion.button>

                <p className="text-xs text-gray-600 dark:text-slate-400 mt-4">
                  💡 In QR Code để đưa vào tài liệu marketing hoặc danh thiếp
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rewards Program (when QR is hidden) */}
        {!showQRCode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-xl border border-purple-100 dark:border-purple-800 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-2xl">Chương Trình Thưởng</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">Nhận hoa hồng hấp dẫn</p>
              </div>
            </div>

            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🎁</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg">Đăng Ký Thành Công</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Mỗi người đăng ký qua link của bạn</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">+50K</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500">ngay lập tức</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">💰</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg">Mua Hàng Đầu Tiên</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Khi người được giới thiệu mua hàng</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">+10%</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500">doanh thu</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-slate-100 text-lg">Cột Mốc 10 Người</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400">10 người active trong mạng lưới</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">+1M</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500">thưởng đặc biệt</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-200 dark:border-slate-700">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedTab('overview')}
          className={`px-8 py-4 font-bold text-lg transition-all relative ${selectedTab === 'overview'
            ? 'text-primary dark:text-teal-400'
            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
        >
          Tổng Quan
          {selectedTab === 'overview' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-teal-600 dark:from-teal-400 dark:to-cyan-400 rounded-t-full"
            />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedTab('network')}
          className={`px-8 py-4 font-bold text-lg transition-all relative ${selectedTab === 'network'
            ? 'text-primary dark:text-teal-400'
            : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
        >
          Mạng Lưới ({REFERRALS.length})
          {selectedTab === 'network' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-teal-600 dark:from-teal-400 dark:to-cyan-400 rounded-t-full"
            />
          )}
        </motion.button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Trend Chart */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 dark:from-teal-600 dark:to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-2xl">Xu Hướng Giới Thiệu</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Biểu đồ tăng trưởng theo thời gian</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={referralTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 14, fontWeight: 600 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? formatVND(value) : value
                    }
                    contentStyle={{
                      borderRadius: '12px',
                      border: '2px solid #00575A',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="referrals"
                    stroke="#00575A"
                    strokeWidth={4}
                    name="Số người giới thiệu"
                    dot={{ r: 6, fill: '#00575A', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FFBF00"
                    strokeWidth={4}
                    name="Doanh thu"
                    dot={{ r: 6, fill: '#FFBF00', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="network"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Network Visualization */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 dark:from-teal-600 dark:to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 text-2xl">Cấu Trúc Mạng Lưới</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Hệ thống F1 & F2 của bạn</p>
                </div>
              </div>

              {/* F1 Level */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-primary dark:text-teal-400" />
                  <h4 className="font-bold text-xl text-gray-900 dark:text-slate-100">Cấp F1</h4>
                  <span className="bg-primary/10 dark:bg-teal-500/20 text-primary dark:text-teal-400 px-3 py-1 rounded-full text-sm font-bold">
                    {f1Referrals.length} người
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {f1Referrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-800 dark:to-teal-900/20 rounded-2xl p-6 shadow-lg border-2 border-primary/30 dark:border-teal-600/40 hover:border-primary dark:hover:border-teal-500 hover:shadow-xl transition-all"
                    >
                      {/* Avatar & Name */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal-600 dark:from-teal-600 dark:to-cyan-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {referral.referredName?.charAt(0) || '?'}
                          </div>
                          <div className="absolute -top-1 -right-1">
                            {getStatusIcon(referral.status)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-slate-100 text-lg">
                            {referral.referredName || 'Chưa đăng ký'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{referral.referredEmail}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold mb-3 border ${getStatusBadge(referral.status)}`}>
                        {getStatusLabel(referral.status)}
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-slate-400">Doanh thu:</span>
                          <span className="font-bold text-primary dark:text-teal-400">
                            {referral.totalRevenue > 0 ? formatVND(referral.totalRevenue) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-slate-400">Hoa hồng:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {referral.referralBonus > 0 ? formatVND(referral.referralBonus) : '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-slate-400">Ngày tham gia:</span>
                          <span className="text-gray-900 dark:text-slate-100 font-semibold">
                            {new Date(referral.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* F2 Level */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-accent dark:text-yellow-400" />
                  <h4 className="font-bold text-xl text-gray-900 dark:text-slate-100">Cấp F2</h4>
                  <span className="bg-accent/10 dark:bg-yellow-500/20 text-accent dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                    {f2Referrals.length} người
                  </span>
                </div>

                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {f2Referrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-700 hover:border-accent dark:hover:border-yellow-500 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-500 dark:from-yellow-500 dark:to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {referral.referredName?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
                            {referral.referredName || 'Chưa đăng ký'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-1 rounded-full border font-medium ${getStatusBadge(referral.status)}`}>
                          {getStatusLabel(referral.status)}
                        </span>
                        {referral.referralBonus > 0 && (
                          <span className="font-bold text-green-600 dark:text-green-400">
                            +{Math.round(referral.referralBonus / 1000)}K
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
