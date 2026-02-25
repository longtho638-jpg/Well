
import React, { useState } from 'react';
import { Quest, User } from '../types';
import { CheckCircle, Circle, Sparkles, Loader2, Bot } from 'lucide-react';
import { getCoachAdvice } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks';

interface Props {
  quests: Quest[];
  user: User;
}

const OnboardingQuest: React.FC<Props> = ({ quests, user }) => {
    const { t } = useTranslation();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetCoaching = async () => {
    setLoading(true);
    // Simulate a bit of "thinking" delay for UX if API is too fast
    const pending = quests.filter(q => !q.isCompleted).map(q => q.title);
    try {
        const text = await getCoachAdvice(user.name, user.totalSales, pending);
        setAdvice(text);
    } catch {
        setAdvice("Keep sharing your positivity! The sales will follow.");
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-deepTeal to-teal-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-teal-700"
    >
      {/* Background Decorative Circle */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-marigold opacity-10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Bot className="w-5 h-5 text-marigold" />
            {t('onboardingquest.the_coach')}</h3>
          <p className="text-teal-200 text-xs">{t('onboardingquest.powered_by_gemini_ai')}</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-marigold">
           {t('onboardingquest.day_3_30')}</div>
      </div>

      <div className="space-y-3 mb-6 relative z-10">
        {quests.map((quest, idx) => (
          <motion.div 
            key={quest.id} 
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${quest.isCompleted ? 'bg-teal-900/50 border-teal-800' : 'bg-white/5 border-white/10'}`}
          >
            {quest.isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-teal-200 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${quest.isCompleted ? 'line-through text-teal-400' : 'text-white'}`}>
                {quest.title}
              </p>
              <p className="text-xs text-teal-300 mt-1 leading-snug">{quest.description}</p>
            </div>
            <span className="text-xs font-bold text-marigold bg-marigold/10 px-2 py-1 rounded">+{quest.xp}{t('onboardingquest.xp')}</span>
          </motion.div>
        ))}
      </div>

      <div className="bg-black/20 rounded-xl p-4 border border-white/5 relative z-10">
        <AnimatePresence mode='wait'>
            {advice ? (
            <motion.div
                key="advice"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
            >
                <div className="flex gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-marigold" />
                    <p className="text-xs font-bold text-marigold uppercase">{t('onboardingquest.ai_strategy')}</p>
                </div>
                <p className="text-sm italic text-white/90 leading-relaxed">"{advice}"</p>
            </motion.div>
            ) : (
            <motion.p 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-teal-200"
            >
                {t('onboardingquest.stuck_ask_your_ai_coach_for_a')}</motion.p>
            )}
        </AnimatePresence>
        
        {!advice && (
            <button 
            onClick={handleGetCoaching}
            disabled={loading}
            className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 font-semibold py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 group"
            >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4 group-hover:text-marigold transition-colors"/>}
            {loading ? "Analyzing Sales Data..." : "Get AI Advice"}
            </button>
        )}
      </div>
    </motion.div>
  );
};

export default OnboardingQuest;
