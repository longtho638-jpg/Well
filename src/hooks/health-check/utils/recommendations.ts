import { ProductRecommendation, Question } from '../types';

export const getRecommendations = (
  answers: Record<string, string>,
  quizQuestions: Question[],
  t: (key: string) => string
): ProductRecommendation[] => {
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
