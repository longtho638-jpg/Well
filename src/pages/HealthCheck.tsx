import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Brain,
  Target,
  Activity,
  Heart,
  Coffee,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  MessageCircle,
  Package,
  TrendingUp
} from 'lucide-react';
import { useStore } from '@/store';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

// Quiz questions structure
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

interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  benefits: string[];
}

const getQuizQuestions = (t: (key: string) => string): Question[] => [
  {
    id: 'sleep',
    question: t('healthCheck.questions.sleep.question'),
    icon: Moon,
    options: [
      { label: t('healthCheck.questions.sleep.options.under5'), value: 'under_5', score: 20 },
      { label: t('healthCheck.questions.sleep.options._5to6'), value: '5_6', score: 40 },
      { label: t('healthCheck.questions.sleep.options._6to7'), value: '6_7', score: 70 },
      { label: t('healthCheck.questions.sleep.options._7to8'), value: '7_8', score: 100 },
      { label: t('healthCheck.questions.sleep.options.over8'), value: 'over_8', score: 80 }
    ]
  },
  {
    id: 'stress',
    question: t('healthCheck.questions.stress.question'),
    icon: Brain,
    options: [
      { label: t('healthCheck.questions.stress.options.veryOften'), value: 'very_often', score: 20 },
      { label: t('healthCheck.questions.stress.options.often'), value: 'often', score: 40 },
      { label: t('healthCheck.questions.stress.options.sometimes'), value: 'sometimes', score: 70 },
      { label: t('healthCheck.questions.stress.options.rarely'), value: 'rarely', score: 90 },
      { label: t('healthCheck.questions.stress.options.never'), value: 'never', score: 100 }
    ]
  },
  {
    id: 'energy',
    question: t('healthCheck.questions.energy.question'),
    icon: Coffee,
    options: [
      { label: t('healthCheck.questions.energy.options.veryTired'), value: 'very_tired', score: 20 },
      { label: t('healthCheck.questions.energy.options.tired'), value: 'tired', score: 40 },
      { label: t('healthCheck.questions.energy.options.normal'), value: 'normal', score: 70 },
      { label: t('healthCheck.questions.energy.options.energetic'), value: 'energetic', score: 90 },
      { label: t('healthCheck.questions.energy.options.veryEnergetic'), value: 'very_energetic', score: 100 }
    ]
  },
  {
    id: 'exercise',
    question: t('healthCheck.questions.exercise.question'),
    icon: Activity,
    options: [
      { label: t('healthCheck.questions.exercise.options.never'), value: 'never', score: 20 },
      { label: t('healthCheck.questions.exercise.options._1to2'), value: '1_2', score: 50 },
      { label: t('healthCheck.questions.exercise.options._3to4'), value: '3_4', score: 80 },
      { label: t('healthCheck.questions.exercise.options._5plus'), value: '5_plus', score: 100 }
    ]
  },
  {
    id: 'goal',
    question: t('healthCheck.questions.goal.question'),
    icon: Target,
    options: [
      { label: t('healthCheck.questions.goal.options.betterSleep'), value: 'better_sleep', score: 0 },
      { label: t('healthCheck.questions.goal.options.reduceStress'), value: 'reduce_stress', score: 0 },
      { label: t('healthCheck.questions.goal.options.increaseEnergy'), value: 'increase_energy', score: 0 },
      { label: t('healthCheck.questions.goal.options.boostImmunity'), value: 'boost_immunity', score: 0 },
      { label: t('healthCheck.questions.goal.options.overallHealth'), value: 'overall_health', score: 0 }
    ]
  }
];

export default function HealthCheck() {
  const t = useTranslation();
  const { user, simulateOrder } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const quizQuestions = getQuizQuestions(t);
  const currentQuestion = quizQuestions[currentStep];
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const calculateHealthScore = (): number => {
    let totalScore = 0;
    let count = 0;

    quizQuestions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(opt => opt.value === answer);
        if (option && question.id !== 'goal') {
          totalScore += option.score;
          count++;
        }
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  };

  const getRecommendations = (): ProductRecommendation[] => {
    const goal = answers.goal;
    const sleepScore = quizQuestions[0].options.find(o => o.value === answers.sleep)?.score || 0;
    const stressScore = quizQuestions[1].options.find(o => o.value === answers.stress)?.score || 0;
    const energyScore = quizQuestions[2].options.find(o => o.value === answers.energy)?.score || 0;

    const recommendations: ProductRecommendation[] = [];

    // Sleep & Stress issues
    if (goal === 'better_sleep' || goal === 'reduce_stress' || sleepScore < 60 || stressScore < 60) {
      recommendations.push({
        id: '1',
        name: 'ANIMA 119 - Viên Uống Thần Kinh',
        price: 15900000,
        reason: t('healthCheck.products.anima119.reason'),
        benefits: [
          t('healthCheck.products.anima119.benefits.sleep'),
          t('healthCheck.products.anima119.benefits.stress'),
          t('healthCheck.products.anima119.benefits.emotion'),
          t('healthCheck.products.anima119.benefits.memory')
        ]
      });
    }

    // Energy & Immunity issues
    if (goal === 'increase_energy' || goal === 'boost_immunity' || energyScore < 60) {
      recommendations.push({
        id: '3',
        name: 'ANIMA Immune Boost',
        price: 890000,
        reason: t('healthCheck.products.immuneBoost.reason'),
        benefits: [
          t('healthCheck.products.immuneBoost.benefits.immunity'),
          t('healthCheck.products.immuneBoost.benefits.fatigue'),
          t('healthCheck.products.immuneBoost.benefits.antioxidant'),
          t('healthCheck.products.immuneBoost.benefits.recovery')
        ]
      });
    }

    // Overall health or no specific issues
    if (goal === 'overall_health' || recommendations.length === 0) {
      recommendations.push({
        id: '2',
        name: 'ANIMA Starter Kit',
        price: 4500000,
        reason: t('healthCheck.products.starterKit.reason'),
        benefits: [
          t('healthCheck.products.starterKit.benefits.nutrition'),
          t('healthCheck.products.starterKit.benefits.balance'),
          t('healthCheck.products.starterKit.benefits.health'),
          t('healthCheck.products.starterKit.benefits.allAges')
        ]
      });
    }

    return recommendations.slice(0, 2); // Maximum 2 recommendations
  };

  const handleOrderRecommendation = (productId: string) => {
    simulateOrder(productId);
  };

  const handleZaloChat = () => {
    // Partner's Zalo number - in production, this should come from user.referrerId
    const partnerZaloPhone = '0123456789'; // Mock partner phone
    const message = encodeURIComponent(`Xin chào! Tôi vừa hoàn thành bài đánh giá sức khỏe và muốn được tư vấn thêm về sản phẩm ANIMA phù hợp. Điểm sức khỏe của tôi là ${calculateHealthScore()}.`);

    // Open Zalo chat
    window.open(`https://zalo.me/${partnerZaloPhone}?text=${message}`, '_blank');
  };

  const healthScore = showResults ? calculateHealthScore() : 0;
  const recommendations = showResults ? getRecommendations() : [];

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Results Header */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-primary to-teal-600 p-8 text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <Award className="w-16 h-16 mb-4 text-accent" />
                <h1 className="text-3xl font-bold mb-2">{t('healthCheck.resultsTitle')}</h1>
                <p className="text-teal-100">{t('healthCheck.yourHealthScore')}</p>
              </motion.div>
            </div>

            {/* Score Display */}
            <div className="p-8">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className={`w-48 h-48 rounded-full bg-gradient-to-br ${getScoreColor(healthScore)} flex items-center justify-center shadow-2xl mb-6`}
                >
                  <div className="text-center">
                    <p className="text-6xl font-bold text-white">{healthScore}</p>
                    <p className="text-white text-lg font-semibold">/100</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {getScoreLabel(healthScore)}
                  </h2>
                  <p className="text-gray-600 max-w-md">
                    {getScoreDescription(healthScore)}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-2xl p-8 mb-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('healthCheck.recommendationsTitle')}
              </h2>
            </div>

            <div className="space-y-4">
              {recommendations.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.2 }}
                  className="border-2 border-primary/20 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-bold text-gray-900">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-3">{product.reason}</p>
                      <ul className="space-y-2">
                        {product.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500 mb-1">{t('healthCheck.priceLabel')}</p>
                      <p className="text-2xl font-bold text-primary mb-4">
                        {formatVND(product.price)}
                      </p>
                      <button
                        onClick={() => handleOrderRecommendation(product.id)}
                        className="bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        {t('healthCheck.orderNow')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Expert Consultation CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 rounded-2xl shadow-2xl p-8 text-white"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <MessageCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {t('healthCheck.consultationTitle')}
                  </h3>
                  <p className="text-green-100">
                    {t('healthCheck.consultationDescription')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleZaloChat}
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-xl flex items-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-6 h-6" />
                {t('healthCheck.chatNow')}
              </button>
            </div>
          </motion.div>

          {/* Restart Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="text-center mt-6"
          >
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentStep(0);
                setAnswers({});
              }}
              className="text-gray-600 hover:text-primary transition-colors font-medium"
            >
              {t('healthCheck.restartQuiz')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Quiz Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-teal-600"
            />
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring' }}
                className="inline-block bg-gradient-to-br from-primary to-teal-600 p-4 rounded-2xl mb-4 shadow-lg"
              >
                <currentQuestion.icon className="w-12 h-12 text-white" />
              </motion.div>
              <p className="text-sm text-gray-500 mb-2">
                {t('healthCheck.questionProgress', { current: currentStep + 1, total: quizQuestions.length })}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              <AnimatePresence mode="wait">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      answers[currentQuestion.id] === option.value
                        ? 'border-primary bg-primary/5 shadow-md scale-105'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {option.label}
                      </span>
                      {answers[currentQuestion.id] === option.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                {t('healthCheck.back')}
              </button>

              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  answers[currentQuestion.id]
                    ? 'bg-gradient-to-r from-primary to-teal-600 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentStep === quizQuestions.length - 1 ? t('healthCheck.viewResults') : t('healthCheck.next')}
                <ArrowRight className="w-5 h-5" />
              </button>
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
          <p className="text-sm text-gray-600">
            {t('healthCheck.timeInfo')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
