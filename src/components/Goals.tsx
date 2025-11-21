import { motion } from 'framer-motion';
import { Target, TrendingUp, Users, Package, DollarSign, Calendar, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useStore } from '../store';
import { Goal } from '../types';
import { formatVND, formatNumber } from '../utils/format';

export default function Goals() {
  const { goals, updateGoalProgress, completeGoal } = useStore();

  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'sales':
        return <TrendingUp size={20} />;
      case 'revenue':
        return <DollarSign size={20} />;
      case 'recruits':
        return <Users size={20} />;
      case 'products':
        return <Package size={20} />;
      default:
        return <Target size={20} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-green-100 text-green-800';
      case 'custom':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatGoalValue = (value: number, unit: string) => {
    if (unit === 'revenue') {
      return formatVND(value);
    }
    return formatNumber(value);
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center">
            <Target size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
            <p className="text-gray-600">{activeGoals.length} active, {completedGoals.length} completed</p>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 text-lg">Active Goals</h3>
          {activeGoals.map((goal, index) => {
            const progress = calculateProgress(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isOverdue = daysRemaining < 0;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                      {goal.aiSuggested && (
                        <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                          <Sparkles size={12} />
                          AI Suggested
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-1 rounded-full font-semibold ${getTypeColor(goal.type)}`}>
                        {goal.type}
                      </span>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={14} />
                        <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                          {isOverdue ? 'Overdue' : `${daysRemaining} days left`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal-600 rounded-xl flex items-center justify-center text-white">
                    {getUnitIcon(goal.unit)}
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      {formatGoalValue(goal.current, goal.unit)} / {formatGoalValue(goal.target, goal.unit)}
                    </span>
                    <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-3 rounded-full ${
                        progress >= 100
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-primary to-accent'
                      }`}
                    />
                  </div>
                </div>

                {progress >= 100 && (
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <CheckCircle2 size={16} />
                    Goal achieved! Mark as complete to earn XP.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-600" />
            Recently Completed
          </h3>
          {completedGoals.slice(0, 3).map((goal) => (
            <div
              key={goal.id}
              className="p-3 rounded-lg bg-green-50 border border-green-200"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                  <p className="text-sm text-gray-600">
                    {formatGoalValue(goal.target, goal.unit)} {goal.unit}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(goal.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals set yet</h3>
          <p className="text-gray-600 mb-4">Set goals to track your progress and stay motivated!</p>
          <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition">
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}
