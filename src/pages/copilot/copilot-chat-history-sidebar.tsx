import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, X } from 'lucide-react';
import { ChatSession } from './use-copilot-page';

interface CopilotChatHistorySidebarProps {
  showHistory: boolean;
  chatSessions: ChatSession[];
  selectedSession: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onToggleHistory: () => void;
  formatTimestamp: (date: Date) => string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

export function CopilotChatHistorySidebar({
  showHistory,
  chatSessions,
  selectedSession,
  onSelectSession,
  onNewChat,
  onToggleHistory,
  formatTimestamp,
  t
}: CopilotChatHistorySidebarProps) {
  return (
    <>
      {/* Mobile toggle button in header area */}
      <button
        onClick={onToggleHistory}
        className="lg:hidden p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
      >
        {showHistory ? <X className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lg:col-span-1 space-y-4"
          >
            <button
              onClick={onNewChat}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-4 rounded-xl font-bold text-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('copilotpage.chat_m_i')}
            </button>

            <div className="glass-ultra rounded-2xl p-6 border border-white/10 shadow-xl sticky top-32 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                {t('copilotpage.l_ch_s_chat')}
              </h3>
              <div className="space-y-2">
                {chatSessions.map((session, index) => (
                  <motion.button
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                      selectedSession === session.id
                        ? 'bg-gradient-to-r from-teal-500/20 to-teal-600/20 border border-teal-500/50 shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">{session.title}</h4>
                    <p className="text-xs text-white/60 mb-2 line-clamp-1">{session.preview}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="text-xs text-white/40">{formatTimestamp(session.timestamp)}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
