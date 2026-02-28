import { Moon, Brain, Coffee, Activity, Target } from 'lucide-react';
import { Question } from '@/hooks/health-check/types';

export const getQuizQuestions = (t: (key: string) => string): Question[] => [
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
