import React, { useState } from 'react';
import TheCopilot from '@/components/TheCopilot';
import { useStore } from '@/store';
import { Bot, Target, MessageCircle, TrendingUp, Clock, Sparkles, Plus, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';

// Chat History Interface
interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

export default function CopilotPage() {
  const { t } = useTranslation();
  const { user } = useStore();

  // Chat history state
  const [showHistory, setShowHistory] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Tư vấn khách hàng về ANIMA 119',
      timestamp: new Date('2025-01-20 14:30'),
      preview: 'Khách hỏi về giá và công dụng của ANIMA...'
    },
    {
      id: '2',
      title: 'Xử lý từ chối - Giá cao',
      timestamp: new Date('2025-01-20 10:15'),
      preview: 'Khách nói sản phẩm đắt quá...'
    },
    {
      id: '3',
      title: 'Kịch bản chốt sale cuối tháng',
      timestamp: new Date('2025-01-19 16:45'),
      preview: 'Tạo kịch bản chốt sale cho khuyến mãi...'
    },
    {
      id: '4',
      title: 'Viết bài đăng Facebook',
      timestamp: new Date('2025-01-19 09:20'),
      preview: 'Viết bài giới thiệu sản phẩm mới...'
    }
  ]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Prompt suggestions
  const promptSuggestions = [
    {
      icon: '📝',
      title: 'Viết bài đăng Facebook',
      prompt: 'Giúp tôi viết bài đăng Facebook giới thiệu ANIMA 119 hấp dẫn, có emoji và call-to-action mạnh mẽ'
    },
    {
      icon: '💬',
      title: 'Kịch bản chốt sale',
      prompt: 'Tạo kịch bản chốt sale cho khách hàng đang do dự về giá'
    },
    {
      icon: '🎯',
      title: 'Xử lý từ chối',
      prompt: 'Khách hàng nói "Tôi cần suy nghĩ thêm". Tôi nên trả lời thế nào?'
    },
    {
      icon: '📞',
      title: 'Kịch bản gọi điện',
      prompt: 'Viết kịch bản gọi điện chào hàng cho khách hàng mới'
    },
    {
      icon: '✨',
      title: 'Highlight sản phẩm',
      prompt: 'Liệt kê 5 điểm nổi bật nhất của ANIMA 119 để thuyết phục khách'
    },
    {
      icon: '🎁',
      title: 'Chương trình khuyến mãi',
      prompt: 'Tạo ý tưởng chương trình khuyến mãi thu hút cho sản phẩm'
    }
  ];

  const features = [
    {
      icon: MessageCircle,
      title: t('copilot.features.objectionHandling.title'),
      description: t('copilot.features.objectionHandling.description')
    },
    {
      icon: Target,
      title: t('copilot.features.salesScript.title'),
      description: t('copilot.features.salesScript.description')
    },
    {
      icon: TrendingUp,
      title: t('copilot.features.realtimeCoaching.title'),
      description: t('copilot.features.realtimeCoaching.description')
    }
  ];

  const handleNewChat = () => {
    setSelectedSession(null);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffHours < 48) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-dark-ultra pb-20 relative overflow-hidden">
      <ParticleBackground />
      <CursorGlow />

      {/* Header */}
      <div className="glass-ultra border-b border-white/10 p-8 text-white sticky top-0 z-10 shadow-xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    {t('copilot.title')}
                  </h1>
                  <p className="text-white/60 text-sm">{t('copilot.subtitle')}</p>
                </div>
              </div>
              <p className="text-white/80 max-w-2xl">
                {t('copilot.description')}
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
            >
              {showHistory ? <X className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Chat History */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-1 space-y-4"
              >
                {/* New Chat Button */}
                <button
                  onClick={handleNewChat}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 rounded-xl font-bold text-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Chat Mới
                </button>

                {/* Chat History Card */}
                <div className="glass-ultra rounded-2xl p-6 border border-white/10 shadow-xl sticky top-32 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-400" />
                    Lịch Sử Chat
                  </h3>
                  <div className="space-y-2">
                    {chatSessions.map((session, index) => (
                      <motion.button
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedSession(session.id)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                          selectedSession === session.id
                            ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 border border-teal-500/50 shadow-md'
                            : 'bg-white/5 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                          {session.title}
                        </h4>
                        <p className="text-xs text-white/60 mb-2 line-clamp-1">
                          {session.preview}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span className="text-xs text-white/40">
                            {formatTimestamp(session.timestamp)}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className={showHistory ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="space-y-6">
              {/* Toggle Button (Mobile) */}
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="lg:hidden w-full glass-ultra border border-white/10 px-4 py-3 rounded-xl font-medium text-sm hover:bg-white/10 active:bg-white/20 text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5 text-teal-400" />
                  Xem Lịch Sử Chat
                </button>
              )}

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
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-purple-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="glass-ultra relative rounded-xl p-6 border border-white/10 hover:border-teal-500/30 hover:shadow-xl transition-all duration-300 h-full">
                        <Icon className="w-8 h-8 text-teal-400 mb-3" />
                        <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-white/60">{feature.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Prompt Suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-ultra rounded-2xl p-6 border border-white/10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20 pointer-events-none" />
                <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Gợi Ý Prompt - Click để dùng ngay
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
                  {promptSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="glass-dark hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all duration-300 text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{suggestion.icon}</span>
                        <h4 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">
                          {suggestion.title}
                        </h4>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-2">
                        {suggestion.prompt}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-ultra rounded-xl p-6 border border-white/10 bg-gradient-to-br from-blue-900/20 to-indigo-900/20"
              >
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  {t('copilot.stats.title')}
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-teal-400 mb-1">12</p>
                    <p className="text-xs text-white/60">{t('copilot.stats.objectionsHandled')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-teal-400 mb-1">8</p>
                    <p className="text-xs text-white/60">{t('copilot.stats.scriptsCreated')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400 mb-1">85%</p>
                    <p className="text-xs text-white/60">{t('copilot.stats.conversionRate')}</p>
                  </div>
                </div>
              </motion.div>

              {/* The Copilot Component */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <TheCopilot
                  userName={user.name}
                  productContext="WellNexus products - premium health and wellness supplements"
                />
              </motion.div>

              {/* Tips Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="glass-ultra rounded-xl p-6 border border-white/10"
              >
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  {t('copilot.tips.title')}
                </h3>
                <ul className="space-y-3 text-sm text-white/60">
                  <li className="flex gap-3 items-start">
                    <span className="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded-lg text-xs border border-yellow-500/30">1</span>
                    <span className="flex-1">{t('copilot.tips.tip1')}</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded-lg text-xs border border-yellow-500/30">2</span>
                    <span className="flex-1">{t('copilot.tips.tip2')}</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded-lg text-xs border border-yellow-500/30">3</span>
                    <span className="flex-1">{t('copilot.tips.tip3')}</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded-lg text-xs border border-yellow-500/30">4</span>
                    <span className="flex-1">{t('copilot.tips.tip4')}</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
