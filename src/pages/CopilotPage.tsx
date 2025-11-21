import React from 'react';
import TheCopilot from '@/components/TheCopilot';
import { useStore } from '@/store';
import { Bot, Target, MessageCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CopilotPage() {
  const { user } = useStore();

  const features = [
    {
      icon: MessageCircle,
      title: 'Xử Lý Từ Chối',
      description: 'AI phát hiện và gợi ý cách xử lý từ chối thông minh'
    },
    {
      icon: Target,
      title: 'Kịch Bản Bán Hàng',
      description: 'Tạo script bán hàng chuyên nghiệp trong vài giây'
    },
    {
      icon: TrendingUp,
      title: 'Coaching Realtime',
      description: 'Nhận phản hồi và gợi ý cải thiện ngay lập tức'
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">The Copilot</h1>
                <p className="text-white/80 text-sm">Trợ lý bán hàng AI của bạn</p>
              </div>
            </div>
            <p className="text-white/90 max-w-2xl">
              Được trang bị AI tiên tiến để giúp bạn xử lý từ chối khách hàng, tạo kịch bản bán hàng,
              và cải thiện kỹ năng sales mỗi ngày.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <Icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-4">📊 Thống Kê Hôm Nay</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-primary">12</p>
            <p className="text-xs text-gray-600">Từ chối xử lý</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">8</p>
            <p className="text-xs text-gray-600">Script tạo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">85%</p>
            <p className="text-xs text-gray-600">Tỉ lệ chuyển đổi</p>
          </div>
        </div>
      </div>

      {/* The Copilot Component */}
      <div>
        <TheCopilot
          userName={user.name}
          productContext="WellNexus products - premium health and wellness supplements"
        />
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">💡 Tips Để Sử Dụng Hiệu Quả</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="text-accent font-bold">1.</span>
            <span>Nhập câu phản đối thật của khách hàng để nhận gợi ý chính xác nhất</span>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-bold">2.</span>
            <span>Sử dụng tính năng "Script" để có sẵn kịch bản cho từng sản phẩm</span>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-bold">3.</span>
            <span>Sau mỗi cuộc trò chuyện, bấm "Coach" để nhận phản hồi cải thiện</span>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-bold">4.</span>
            <span>Copy gợi ý nhanh và điều chỉnh cho phù hợp với phong cách của bạn</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
