import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Share2, Zap } from 'lucide-react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { formatVND } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';
import { APP_CONFIG } from '@/utils/constants';

export const QuickActionsCard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();

  const { showToast } = useToast();

  const handleSendGiftCard = () => {
    // Use crypto.getRandomValues for unpredictable gift codes (Math.random is predictable)
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = 'GIFT-' + Array.from(array, b => b.toString(36)).join('').toUpperCase().slice(0, 6);
    navigator.clipboard.writeText(code);
    showToast(t('quickactionscard.gift_card_created', { code }), 'success');
  };

  const handleShareHealthCheck = () => {
    const healthCheckLink = `${APP_CONFIG.url}/health-check`;
    if (navigator.share) {
      navigator.share({
        title: 'WellNexus Health Check',
        text: t('quickactionscard.health_check_share_text'),
        url: healthCheckLink,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(healthCheckLink);
        showToast(t('quickactionscard.link_copied'), 'success');
      });
    } else {
      navigator.clipboard.writeText(healthCheckLink);
      showToast(t('quickactionscard.link_copied'), 'success');
    }
  };

  const handleShareAchievement = () => {
    // Create achievement message based on user's current stats
    const achievementText = t('quickactionscard.achievement_share_text', {
      rank: user.rank,
      sales: formatVND(user.totalSales),
      team: formatVND(user.teamVolume)
    });

    const shareData = {
      title: t('quickactionscard.achievement_title'),
      text: achievementText,
      url: user.referralLink || APP_CONFIG.url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch((error) => {
        // User cancelled or error occurred, fallback to clipboard
        if (error.name !== 'AbortError') {
          navigator.clipboard.writeText(achievementText + '\n\n' + shareData.url);
          showToast(t('quickactionscard.achievement_copied'), 'success');
        }
      });
    } else {
      // Fallback to clipboard for browsers that don't support Web Share API
      navigator.clipboard.writeText(achievementText + '\n\n' + shareData.url);
      showToast(t('quickactionscard.achievement_copied'), 'success');
    }
  };

  const quickActions = [
    {
      id: 'gift-card',
      label: t('quickactionscard.send_gift_card'),
      icon: Gift,
      bgClass: 'bg-pink-500/10',
      iconColor: 'text-pink-400',
      gradient: 'from-pink-500/20 to-rose-600/10',
      onClick: handleSendGiftCard,
      description: t('dashboard.quickActions.shareProductDesc'),
    },
    {
      id: 'health-check',
      label: t('quickactionscard.share_health_check'),
      icon: Heart,
      bgClass: 'bg-red-500/10',
      iconColor: 'text-red-400',
      gradient: 'from-red-500/20 to-pink-600/10',
      onClick: handleShareHealthCheck,
      description: t('quickactionscard.share_health_check_desc'),
    },
    {
      id: 'share-achievement',
      label: t('dashboard.quickActions.shareAchievement'),
      icon: Share2,
      bgClass: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      gradient: 'from-blue-500/20 to-cyan-600/10',
      onClick: handleShareAchievement,
      description: t('dashboard.quickActions.shareAchievementDesc'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-sm p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-yellow-400 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">{t('dashboard.quickActions.title')}</h3>
          <p className="text-xs text-zinc-400">{t('quickactionscard.c_ng_c_h_tr_kinh_doanh')}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {quickActions.map((action, idx) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={action.onClick}
            className={`w-full group relative overflow-hidden rounded-xl bg-gradient-to-r ${action.gradient} hover:shadow-md transition-all duration-300 p-4 text-left`}
          >
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            />

            <div className="relative z-10 flex items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 ${action.bgClass} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm md:text-base mb-0.5">
                  {action.label}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {action.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="shrink-0 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 pt-4 border-t border-white/5"
      >
        <p className="text-xs text-zinc-500 text-center">
          {t('quickactionscard.tip_s_d_ng_c_c_c_ng_c_n')}</p>
      </motion.div>
    </motion.div>
  );
};
