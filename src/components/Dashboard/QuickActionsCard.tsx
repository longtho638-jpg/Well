import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Share2, Zap } from 'lucide-react';

export const QuickActionsCard: React.FC = () => {
  const handleSendGiftCard = () => {
    // TODO: Implement gift card sending logic
    alert('Tính năng gửi Gift Card đang được phát triển!');
  };

  const handleShareHealthCheck = () => {
    // TODO: Implement health check link sharing
    const healthCheckLink = 'https://wellnexus.app/health-check';
    if (navigator.share) {
      navigator.share({
        title: 'WellNexus Health Check',
        text: 'Kiểm tra sức khỏe miễn phí cùng WellNexus!',
        url: healthCheckLink,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(healthCheckLink);
        alert('Link đã được sao chép vào clipboard!');
      });
    } else {
      navigator.clipboard.writeText(healthCheckLink);
      alert('Link đã được sao chép vào clipboard!');
    }
  };

  const handleShareAchievement = () => {
    // TODO: Implement achievement sharing
    alert('Tính năng khoe thành tích đang được phát triển!');
  };

  const quickActions = [
    {
      id: 'gift-card',
      label: 'Gửi Gift Card',
      icon: Gift,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      onClick: handleSendGiftCard,
      description: 'Tặng quà cho khách hàng',
    },
    {
      id: 'health-check',
      label: 'Chia sẻ Link Health Check',
      icon: Heart,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      onClick: handleShareHealthCheck,
      description: 'Gửi link kiểm tra sức khỏe',
    },
    {
      id: 'share-achievement',
      label: 'Khoe thành tích',
      icon: Share2,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      onClick: handleShareAchievement,
      description: 'Chia sẻ thành công của bạn',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-gradient-to-br from-[#00575A] to-[#FFBF00] rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Thao tác nhanh</h3>
          <p className="text-xs text-gray-500">Công cụ hỗ trợ kinh doanh</p>
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
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r hover:shadow-md transition-all duration-300 p-4 text-left"
            style={{
              background: `linear-gradient(135deg, ${action.bgColor.replace('bg-', '')} 0%, white 100%)`,
            }}
          >
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            />

            <div className="relative z-10 flex items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm md:text-base mb-0.5">
                  {action.label}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {action.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="shrink-0 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300">
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
        className="mt-4 pt-4 border-t border-gray-100"
      >
        <p className="text-xs text-gray-400 text-center">
          💡 Tip: Sử dụng các công cụ này để tăng tương tác với khách hàng
        </p>
      </motion.div>
    </motion.div>
  );
};
