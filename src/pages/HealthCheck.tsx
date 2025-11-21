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
  TrendingUp,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { useStore } from '@/store';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

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
  priority: 'high' | 'medium' | 'low';
}

interface HealthDimension {
  dimension: string;
  score: number;
  fullMark: number;
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
  const { simulateOrder } = useStore();
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

  const getHealthDimensions = (): HealthDimension[] => {
    const dimensions = [
      { id: 'sleep', name: 'Giấc Ngủ' },
      { id: 'stress', name: 'Căng Thẳng' },
      { id: 'energy', name: 'Năng Lượng' },
      { id: 'exercise', name: 'Hoạt Động' }
    ];

    return dimensions.map(dim => {
      const question = quizQuestions.find(q => q.id === dim.id);
      const answer = answers[dim.id];
      const option = question?.options.find(opt => opt.value === answer);

      return {
        dimension: dim.name,
        score: option?.score || 0,
        fullMark: 100
      };
    });
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
        ],
        priority: 'high'
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
        ],
        priority: 'high'
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
        ],
        priority: 'medium'
      });
    }

    return recommendations;
  };

  const handleOrderRecommendation = (productId: string) => {
    simulateOrder(productId);
  };

  const handleZaloChat = () => {
    const partnerZaloPhone = '0123456789';
    const message = encodeURIComponent(
      `Xin chào! Tôi vừa hoàn thành bài đánh giá sức khỏe và muốn được tư vấn thêm về sản phẩm ANIMA phù hợp. Điểm sức khỏe của tôi là ${calculateHealthScore()}.`
    );
    window.open(`https://zalo.me/${partnerZaloPhone}?text=${message}`, '_blank');
  };

  const healthScore = showResults ? calculateHealthScore() : 0;
  const recommendations = showResults ? getRecommendations() : [];
  const healthDimensions = showResults ? getHealthDimensions() : [];

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
      <div className="min-h-screen bg-gradient-to-br from-violet-50 dark:from-slate-900 via-purple-50 dark:via-slate-800 to-pink-50 dark:to-slate-900 p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Results Hero */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary via-teal-600 to-cyan-600 rounded-3xl shadow-2xl overflow-hidden relative"
          >
            {/* Decorative Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

            <div className="relative p-12 text-white">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl">
                      <Award className="w-10 h-10 text-accent" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold mb-2">{t('healthCheck.resultsTitle')}</h1>
                      <p className="text-teal-100 text-lg">{t('healthCheck.yourHealthScore')}</p>
                    </div>
                  </div>
                </div>

                {/* Score Display */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className="w-48 h-48 bg-white/20 backdrop-blur-2xl rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/30"
                >
                  <div className="text-center">
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                      className="text-7xl font-bold text-white drop-shadow-lg"
                    >
                      {healthScore}
                    </motion.p>
                    <p className="text-white text-xl font-semibold opacity-90">/100</p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <div className="inline-block bg-white/20 backdrop-blur-xl px-6 py-3 rounded-full border border-white/30">
                  <p className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-accent" />
                    {getScoreLabel(healthScore)}
                  </p>
                </div>
                <p className="text-teal-100 mt-4 text-lg max-w-2xl">
                  {getScoreDescription(healthScore)}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Radar Chart Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Phân Tích Chi Tiết</h2>
                <p className="text-sm text-gray-600">Điểm số từng khía cạnh sức khỏe</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={healthDimensions}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#374151', fontSize: 14, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                <Radar
                  name="Điểm Sức Khỏe"
                  dataKey="score"
                  stroke="#00575A"
                  fill="#00575A"
                  fillOpacity={0.5}
                  strokeWidth={3}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '2px solid #00575A',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-4 gap-4 mt-6">
              {healthDimensions.map((dim, idx) => (
                <motion.div
                  key={dim.dimension}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + idx * 0.1 }}
                  className="bg-gradient-to-br from-primary/5 dark:from-primary/10 to-teal-50 dark:to-slate-700 rounded-xl p-4 border border-primary/20 dark:border-primary/30"
                >
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">{dim.dimension}</p>
                  <p className="text-3xl font-bold text-primary dark:text-cyan-400">{dim.score}</p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dim.score}%` }}
                      transition={{ delay: 1.2 + idx * 0.1, duration: 0.8 }}
                      className={`h-full bg-gradient-to-r ${getScoreColor(dim.score)}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bento Grid Product Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {t('healthCheck.recommendationsTitle')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">Sản phẩm được AI đề xuất dành riêng cho bạn</p>
              </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((product, index) => {
                const isLarge = index === 0 && recommendations.length > 2;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.4 + index * 0.15 }}
                    className={`
                      ${isLarge ? 'md:col-span-2 lg:row-span-2' : ''}
                      bg-gradient-to-br from-white dark:from-slate-800 to-gray-50/50 dark:to-slate-700 backdrop-blur-xl rounded-2xl shadow-xl border-2 overflow-hidden
                      ${product.priority === 'high' ? 'border-primary/30 dark:border-primary/40' : 'border-gray-200 dark:border-slate-600'}
                      hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group
                    `}
                  >
                    {/* Priority Badge */}
                    {product.priority === 'high' && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          ƯU TIÊN
                        </div>
                      </div>
                    )}

                    <div className={`p-6 ${isLarge ? 'lg:p-8' : ''}`}>
                      {/* Product Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`${isLarge ? 'w-16 h-16' : 'w-12 h-12'} bg-gradient-to-br from-primary to-teal-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <Package className={`${isLarge ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-primary transition-colors`}>
                            {product.name}
                          </h3>
                          <p className={`${isLarge ? 'text-base' : 'text-sm'} text-gray-600 dark:text-slate-400 leading-relaxed`}>
                            {product.reason}
                          </p>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className={`space-y-2 mb-6 ${isLarge ? '' : 'max-h-32 overflow-hidden'}`}>
                        {product.benefits.slice(0, isLarge ? 4 : 2).map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{benefit}</span>
                          </div>
                        ))}
                        {!isLarge && product.benefits.length > 2 && (
                          <p className="text-xs text-gray-500 italic">+{product.benefits.length - 2} lợi ích khác...</p>
                        )}
                      </div>

                      {/* Price & CTA */}
                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{t('healthCheck.priceLabel')}</p>
                          <p className={`${isLarge ? 'text-3xl' : 'text-2xl'} font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent`}>
                            {formatVND(product.price)}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOrderRecommendation(product.id)}
                          className={`${isLarge ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'} bg-gradient-to-r from-primary to-teal-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 flex items-center gap-2 group`}
                        >
                          <ShoppingBag className={`${isLarge ? 'w-5 h-5' : 'w-4 h-4'} group-hover:scale-110 transition-transform`} />
                          {t('healthCheck.orderNow')}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Expert Consultation CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

            <div className="relative p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 text-white">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 bg-white/20 backdrop-blur-2xl rounded-3xl flex items-center justify-center shadow-2xl border border-white/30"
                  >
                    <MessageCircle className="w-10 h-10" />
                  </motion.div>
                  <div>
                    <h3 className="text-3xl font-bold mb-2">
                      {t('healthCheck.consultationTitle')}
                    </h3>
                    <p className="text-purple-100 text-lg">
                      {t('healthCheck.consultationDescription')}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleZaloChat}
                  className="bg-white text-purple-600 px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-3 whitespace-nowrap group"
                >
                  <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                  {t('healthCheck.chatNow')}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Restart Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center pb-8"
          >
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentStep(0);
                setAnswers({});
              }}
              className="text-gray-600 hover:text-primary transition-colors font-semibold text-lg flex items-center gap-2 mx-auto group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              {t('healthCheck.restartQuiz')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Quiz Interface (Full Screen per Question)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 dark:from-slate-900 via-pink-50 dark:via-slate-800 to-blue-50 dark:to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        {/* Quiz Card */}
        <div className="bg-white dark:bg-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
          {/* Progress Bar */}
          <div className="h-3 bg-gray-200 dark:bg-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary via-teal-600 to-cyan-500 relative overflow-hidden"
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
                className="inline-block bg-gradient-to-br from-primary to-teal-600 p-6 rounded-3xl mb-6 shadow-2xl"
              >
                <currentQuestion.icon className="w-16 h-16 text-white" />
              </motion.div>

              <p className="text-sm font-bold text-primary dark:text-cyan-400 mb-3 tracking-wider uppercase">
                {t('healthCheck.questionProgress', { current: currentStep + 1, total: quizQuestions.length })}
              </p>

              <motion.h2
                key={`q-${currentStep}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 leading-tight"
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
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    whileHover={{ scale: 1.02, x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-6 rounded-2xl border-3 text-left transition-all duration-300 ${
                      answers[currentQuestion.id] === option.value
                        ? 'border-primary dark:border-cyan-400 bg-gradient-to-r from-primary/10 dark:from-primary/20 to-teal-50 dark:to-slate-700 shadow-xl scale-105'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary/50 dark:hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-lg ${
                        answers[currentQuestion.id] === option.value ? 'text-primary dark:text-cyan-400' : 'text-gray-900 dark:text-slate-100'
                      }`}>
                        {option.label}
                      </span>
                      {answers[currentQuestion.id] === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center"
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
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  currentStep === 0
                    ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:shadow-md'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
                {t('healthCheck.back')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                  answers[currentQuestion.id]
                    ? 'bg-gradient-to-r from-primary to-teal-600 text-white hover:shadow-2xl hover:scale-105'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {currentStep === quizQuestions.length - 1 ? (
                  <>
                    {t('healthCheck.viewResults')}
                    <Sparkles className="w-6 h-6" />
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
          <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            {t('healthCheck.timeInfo')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
