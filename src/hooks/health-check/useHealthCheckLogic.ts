import { useState } from 'react';
import { useStore } from '@/store';
import { useTranslation } from '@/hooks';
import { getQuizQuestions } from './constants/questions';
import { getRecommendations } from './utils/recommendations';
import { HealthDimension } from './types';

export const useHealthCheckLogic = () => {
  const { t } = useTranslation();
  const { simulateOrder } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const quizQuestions = getQuizQuestions(t);

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
  const recommendations = showResults ? getRecommendations(answers, quizQuestions, t) : [];
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
