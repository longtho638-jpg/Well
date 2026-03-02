import React from 'react';
import { Bot, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import TheCopilot from '@/components/TheCopilot';
import { useCopilotPage } from './copilot/use-copilot-page';
import { CopilotChatHistorySidebar } from './copilot/copilot-chat-history-sidebar';
import { CopilotPromptSuggestionsGrid } from './copilot/copilot-prompt-suggestions-grid';

export default function CopilotPage() {
  const {
    t,
    user,
    showHistory,
    setShowHistory,
    chatSessions,
    selectedSession,
    setSelectedSession,
    promptSuggestions,
    features,
    handleNewChat,
    formatTimestamp
  } = useCopilotPage();

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
              <p className="text-white/80 max-w-2xl">{t('copilot.description')}</p>
            </div>
            <CopilotChatHistorySidebar
              showHistory={showHistory}
              chatSessions={chatSessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
              onNewChat={handleNewChat}
              onToggleHistory={() => setShowHistory(!showHistory)}
              formatTimestamp={formatTimestamp}
              t={t}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar rendered inside header toggle — sidebar content shown via the component */}
          <div className="lg:col-span-1 hidden lg:block">
            <CopilotChatHistorySidebar
              showHistory={showHistory}
              chatSessions={chatSessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
              onNewChat={handleNewChat}
              onToggleHistory={() => setShowHistory(!showHistory)}
              formatTimestamp={formatTimestamp}
              t={t}
            />
          </div>

          {/* Main Content */}
          <div className={showHistory ? 'lg:col-span-3' : 'lg:col-span-4'}>
            <div className="space-y-6">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="lg:hidden w-full glass-ultra border border-white/10 px-4 py-3 rounded-xl font-medium text-sm hover:bg-white/10 active:bg-white/20 text-white transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5 text-teal-400" />
                  {t('copilotpage.xem_l_ch_s_chat')}
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

              <CopilotPromptSuggestionsGrid suggestions={promptSuggestions} t={t} />

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
                    <p className="text-3xl font-bold text-green-400 mb-1">{t('copilotpage.85')}</p>
                    <p className="text-xs text-white/60">{t('copilot.stats.conversionRate')}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
                <TheCopilot
                  userName={user.name}
                  productContext="WellNexus products - premium health and wellness supplements"
                />
              </motion.div>

              {/* Tips */}
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
                  {['tip1', 'tip2', 'tip3', 'tip4'].map((tip, i) => (
                    <li key={tip} className="flex gap-3 items-start">
                      <span className="bg-yellow-500/20 text-yellow-400 font-bold px-2 py-1 rounded-lg text-xs border border-yellow-500/30">{i + 1}</span>
                      <span className="flex-1">{t(`copilot.tips.${tip}`)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
