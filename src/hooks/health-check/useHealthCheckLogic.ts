import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { Moon, Brain, Target, Activity, Coffee } from 'lucide-react';

export interface Question {
  id: string;
  question: string;
  icon: React.ElementType;
  options: Array<{
    label: string;
    value: string;
    score: number;
  }>;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  benefits: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface HealthDimension {
  dimension: string;
  score: number;
  fullMark: number;
}

export const useHealthCheckLogic = () => {
  const { t } = useTranslation();
  const { simulateOrder } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const quizQuestions = useMemo((): Question[] => [
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
  ], [t]);

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
      { id: 'sleep', name: t('healthCheck.dimensions.sleep') },
      { id: 'stress', name: t('healthCheck.dimensions.stress') },
      { id: 'energy', name: t('healthCheck.dimensions.energy') },
      { id: 'exercise', name: t('healthCheck.dimensions.exercise') }
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

    if (goal === 'better_sleep' || goal === 'reduce_stress' || sleepScore < 60 || stressScore < 60) {
      recommendations.push({
        id: '1',
        name: t('healthCheck.products.anima119.name'),
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

    if (goal === 'increase_energy' || goal === 'boost_immunity' || energyScore < 60) {
      recommendations.push({
        id: '3',
        name: t('healthCheck.products.immuneBoost.name'),
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

    if (goal === 'overall_health' || recommendations.length === 0) {
      recommendations.push({
        id: '2',
        name: t('healthCheck.products.starterKit.name'),
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
      t('healthCheck.zaloMessage', { score: calculateHealthScore() })
    );
    window.open(`https://zalo.me/${partnerZaloPhone}?text=${message}`, '_blank');
  };

  const resetQuiz = () => {
    setShowResults(false);
    setCurrentStep(0);
    setAnswers({});
  };

  const healthScore = showResults ? calculateHealthScore() : 0;
  const recommendations = showResults ? getRecommendations() : [];
  const healthDimensions = showResults ? getHealthDimensions() : [];

  return {
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
  };
};
