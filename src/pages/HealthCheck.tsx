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

const quizQuestions: Question[] = [
  {
    id: 'sleep',
    question: 'Bạn thường ngủ bao nhiêu tiếng mỗi đêm?',
    icon: Moon,
    options: [
      { label: 'Dưới 5 tiếng', value: 'under_5', score: 20 },
      { label: '5-6 tiếng', value: '5_6', score: 40 },
      { label: '6-7 tiếng', value: '6_7', score: 70 },
      { label: '7-8 tiếng', value: '7_8', score: 100 },
      { label: 'Trên 8 tiếng', value: 'over_8', score: 80 }
    ]
  },
  {
    id: 'stress',
    question: 'Bạn có hay bị stress hoặc lo âu không?',
    icon: Brain,
    options: [
      { label: 'Rất thường xuyên', value: 'very_often', score: 20 },
      { label: 'Thường xuyên', value: 'often', score: 40 },
      { label: 'Thỉnh thoảng', value: 'sometimes', score: 70 },
      { label: 'Hiếm khi', value: 'rarely', score: 90 },
      { label: 'Không bao giờ', value: 'never', score: 100 }
    ]
  },
  {
    id: 'energy',
    question: 'Mức năng lượng của bạn trong ngày như thế nào?',
    icon: Coffee,
    options: [
      { label: 'Rất mệt mỏi', value: 'very_tired', score: 20 },
      { label: 'Thường xuyên mệt', value: 'tired', score: 40 },
      { label: 'Bình thường', value: 'normal', score: 70 },
      { label: 'Tràn đầy năng lượng', value: 'energetic', score: 90 },
      { label: 'Luôn năng động', value: 'very_energetic', score: 100 }
    ]
  },
  {
    id: 'exercise',
    question: 'Bạn tập thể dục bao nhiêu lần mỗi tuần?',
    icon: Activity,
    options: [
      { label: 'Không bao giờ', value: 'never', score: 20 },
      { label: '1-2 lần/tuần', value: '1_2', score: 50 },
      { label: '3-4 lần/tuần', value: '3_4', score: 80 },
      { label: '5+ lần/tuần', value: '5_plus', score: 100 }
    ]
  },
  {
    id: 'goal',
    question: 'Mục tiêu sức khỏe chính của bạn là gì?',
    icon: Target,
    options: [
      { label: 'Cải thiện giấc ngủ', value: 'better_sleep', score: 0 },
      { label: 'Giảm stress', value: 'reduce_stress', score: 0 },
      { label: 'Tăng năng lượng', value: 'increase_energy', score: 0 },
      { label: 'Tăng cường miễn dịch', value: 'boost_immunity', score: 0 },
      { label: 'Sức khỏe tổng thể', value: 'overall_health', score: 0 }
    ]
  }
];

export default function HealthCheck() {
  const { user, simulateOrder } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

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
        reason: 'Hỗ trợ ổn định hệ thần kinh, cải thiện giấc ngủ và giảm căng thẳng',
        benefits: [
          'Giúp ngủ sâu, ngủ ngon hơn',
          'Giảm lo âu, stress',
          'Cân bằng cảm xúc',
          'Tăng cường trí nhớ'
        ]
      });
    }

    // Energy & Immunity issues
    if (goal === 'increase_energy' || goal === 'boost_immunity' || energyScore < 60) {
      recommendations.push({
        id: '3',
        name: 'ANIMA Immune Boost',
        price: 890000,
        reason: 'Tăng cường hệ miễn dịch và năng lượng cho cơ thể',
        benefits: [
          'Tăng sức đề kháng',
          'Giảm mệt mỏi',
          'Chống oxy hóa',
          'Phục hồi sức khỏe nhanh'
        ]
      });
    }

    // Overall health or no specific issues
    if (goal === 'overall_health' || recommendations.length === 0) {
      recommendations.push({
        id: '2',
        name: 'ANIMA Starter Kit',
        price: 4500000,
        reason: 'Combo dinh dưỡng toàn diện cho sức khỏe tổng thể',
        benefits: [
          'Bổ sung dinh dưỡng đầy đủ',
          'Cân bằng cơ thể',
          'Tăng cường sức khỏe',
          'Phù hợp mọi lứa tuổi'
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
    if (score >= 80) return 'Xuất sắc';
    if (score >= 60) return 'Tốt';
    if (score >= 40) return 'Trung bình';
    return 'Cần cải thiện';
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
                <h1 className="text-3xl font-bold mb-2">Kết Quả Đánh Giá</h1>
                <p className="text-teal-100">Điểm sức khỏe của bạn</p>
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
                    {healthScore >= 80 && 'Tuyệt vời! Bạn đang duy trì lối sống rất khỏe mạnh. Hãy tiếp tục!'}
                    {healthScore >= 60 && healthScore < 80 && 'Sức khỏe của bạn ở mức tốt, nhưng vẫn có thể cải thiện thêm.'}
                    {healthScore >= 40 && healthScore < 60 && 'Sức khỏe của bạn cần được quan tâm nhiều hơn. Hãy bắt đầu thay đổi ngay!'}
                    {healthScore < 40 && 'Sức khỏe của bạn đang cần được cải thiện khẩn cấp. Hãy tham khảo các giải pháp dưới đây!'}
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
                Gợi ý sản phẩm phù hợp
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
                      <p className="text-sm text-gray-500 mb-1">Giá</p>
                      <p className="text-2xl font-bold text-primary mb-4">
                        {formatVND(product.price)}
                      </p>
                      <button
                        onClick={() => handleOrderRecommendation(product.id)}
                        className="bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                      >
                        Đặt ngay
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
                    Cần tư vấn chuyên sâu hơn?
                  </h3>
                  <p className="text-green-100">
                    Kết nối ngay với Partner của bạn qua Zalo để được tư vấn miễn phí 1-1
                  </p>
                </div>
              </div>
              <button
                onClick={handleZaloChat}
                className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-xl flex items-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="w-6 h-6" />
                Nhắn tin Zalo ngay
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
              Làm lại bài đánh giá →
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
                Câu hỏi {currentStep + 1} / {quizQuestions.length}
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
                Quay lại
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
                {currentStep === quizQuestions.length - 1 ? 'Xem kết quả' : 'Tiếp theo'}
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
            ⏱️ Chỉ mất 2 phút để hoàn thành • 🔒 Thông tin của bạn được bảo mật
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
