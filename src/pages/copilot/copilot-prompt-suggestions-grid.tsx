import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PromptSuggestion {
  icon: string;
  title: string;
  prompt: string;
}

interface CopilotPromptSuggestionsGridProps {
  suggestions: PromptSuggestion[];
  t: (key: string) => string;
}

export function CopilotPromptSuggestionsGrid({ suggestions, t }: CopilotPromptSuggestionsGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-ultra rounded-2xl p-6 border border-white/10 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20 pointer-events-none" />
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <Sparkles className="w-5 h-5 text-purple-400" />
        {t('copilotpage.g_i_prompt_click_d_ng_n')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
        {suggestions.map((suggestion, index) => (
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
            <p className="text-xs text-white/60 line-clamp-2">{suggestion.prompt}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
