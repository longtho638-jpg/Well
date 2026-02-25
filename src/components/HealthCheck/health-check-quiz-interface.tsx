/**
 * Health Check Quiz Interface Component
 * Full-screen quiz interface for health assessment questions
 * Features:
 * - Progress bar with shimmer animation
 * - Question navigation (back/next)
 * - Option selection with animations
 * - Glassmorphism card design
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Heart,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';

interface Question {
  id: string;
  question: string;
  icon: React.ElementType;
  options: Array<{
    label: string;
    value: string;
    score: number;
  }>;
}

interface Props {
  currentStep: number;
  quizQuestions: Question[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function HealthCheckQuizInterface({
  currentStep,
  quizQuestions,
  answers,
  onAnswer,
  onNext,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const currentQuestion = quizQuestions[currentStep];
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-dark-ultra flex items-center justify-center p-6 relative overflow-hidden">
      <ParticleBackground />
      <CursorGlow />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl relative z-10"
      >
        {/* Quiz Card */}
        <div className="glass-ultra rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-3 bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>

          <div className="p-12">
            {/* Question Header */}
            <div className="text-center mb-12">
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="inline-block bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-3xl mb-6 shadow-2xl"
              >
                <currentQuestion.icon className="w-16 h-16 text-white" />
              </motion.div>

              <p className="text-sm font-bold text-teal-400 mb-3 tracking-wider uppercase">
                {t('healthCheck.questionProgress', { current: currentStep + 1, total: quizQuestions.length })}
              </p>

              <motion.h2
                key={`q-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-white leading-tight"
              >
                {currentQuestion.question}
              </motion.h2>
            </div>

            {/* Options */}
            <div className="space-y-4 mb-12">
              <AnimatePresence mode="wait">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
                    onClick={() => onAnswer(currentQuestion.id, option.value)}
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-6 rounded-2xl border-3 text-left transition-all duration-300 ${
                      answers[currentQuestion.id] === option.value
                        ? 'border-teal-500 bg-gradient-to-r from-teal-500/20 to-teal-600/20 shadow-xl scale-105'
                        : 'border-white/10 bg-white/5 hover:border-teal-500/50 hover:bg-white/10 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-lg ${
                        answers[currentQuestion.id] === option.value ? 'text-teal-400' : 'text-white'
                      }`}>
                        {option.label}
                      </span>
                      {answers[currentQuestion.id] === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  currentStep === 0
                    ? 'text-white/20 cursor-not-allowed'
                    : 'text-white/80 hover:bg-white/10 active:bg-white/20 hover:shadow-md'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
                {t('healthCheck.back')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNext}
                disabled={!answers[currentQuestion.id]}
                className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  answers[currentQuestion.id]
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:shadow-2xl hover:scale-105'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {currentStep === quizQuestions.length - 1 ? (
                  <>
                    {t('healthCheck.viewResults')}
                    <CheckCircle2 className="w-6 h-6" />
                  </>
                ) : (
                  <>
                    {t('healthCheck.next')}
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-white/60 flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            {t('healthCheck.timeInfo')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
