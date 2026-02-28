import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CursorGlow } from '@/components/CursorGlow';
import HealthCheckQuizInterface from '@/components/HealthCheck/health-check-quiz-interface';
import HealthCheckResultsHero from '@/components/HealthCheck/health-check-results-hero';
import HealthCheckRadarChart from '@/components/HealthCheck/health-check-radar-chart';
import HealthCheckProductRecommendations from '@/components/HealthCheck/health-check-product-recommendations';
import HealthCheckConsultationCta from '@/components/HealthCheck/health-check-consultation-cta';
import { useHealthCheckLogic } from '@/hooks/health-check/useHealthCheckLogic';

export default function HealthCheck() {
  const {
    currentStep,
    quizQuestions,
    answers,
    showResults,
    healthScore,
    recommendations,
    healthDimensions,
    handleAnswer,
    handleNext,
    handleBack,
    handleOrderRecommendation,
    handleZaloChat,
    resetQuiz,
    t
  } = useHealthCheckLogic();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-amber-600';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return t('healthCheck.scoreLabels.excellent');
    if (score >= 60) return t('healthCheck.scoreLabels.good');
    if (score >= 40) return t('healthCheck.scoreLabels.average');
    return t('healthCheck.scoreLabels.needsImprovement');
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return t('healthCheck.scoreDescriptions.excellent');
    if (score >= 60) return t('healthCheck.scoreDescriptions.good');
    if (score >= 40) return t('healthCheck.scoreDescriptions.average');
    return t('healthCheck.scoreDescriptions.poor');
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-dark-ultra p-6 relative overflow-hidden">
        <ParticleBackground />
        <CursorGlow />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto space-y-6 relative z-10"
        >
          <HealthCheckResultsHero
            healthScore={healthScore}
            getScoreLabel={getScoreLabel}
            getScoreDescription={getScoreDescription}
          />

          <HealthCheckRadarChart
            healthDimensions={healthDimensions}
            getScoreColor={getScoreColor}
          />

          <HealthCheckProductRecommendations
            recommendations={recommendations}
            onOrderRecommendation={handleOrderRecommendation}
          />

          <HealthCheckConsultationCta
            onZaloChat={handleZaloChat}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center pb-8"
          >
            <button
              onClick={resetQuiz}
              className="text-white/60 hover:text-white transition-colors font-semibold text-lg flex items-center gap-2 mx-auto group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              {t('healthCheck.restartQuiz')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <HealthCheckQuizInterface
      currentStep={currentStep}
      quizQuestions={quizQuestions}
      answers={answers}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
