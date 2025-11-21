import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '../store';
import { getSalesStrategy, analyzePerformance, suggestGoals, getProductRecommendation } from '../services/geminiService';

export default function AICoachPanel() {
  const { user, products, transactions, goals, addGoal } = useStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'performance' | 'goals' | 'recommend'>('strategy');
  const [strategyData, setStrategyData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [suggestedGoals, setSuggestedGoals] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);

  const tabs = [
    { id: 'strategy', label: 'Strategy', icon: Lightbulb },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'recommend', label: 'Recommendations', icon: Sparkles },
  ];

  const handleGetStrategy = async () => {
    setIsLoading(true);
    try {
      const strategy = await getSalesStrategy(user, transactions, products);
      setStrategyData(strategy);
    } catch (error) {
      console.error('Error getting strategy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetPerformance = async () => {
    setIsLoading(true);
    try {
      const performance = await analyzePerformance(user, transactions);
      setPerformanceData(performance);
    } catch (error) {
      console.error('Error analyzing performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestGoals = async () => {
    setIsLoading(true);
    try {
      const goals = await suggestGoals(user, []);
      setSuggestedGoals(goals);
    } catch (error) {
      console.error('Error suggesting goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    try {
      const rec = await getProductRecommendation(user, products, transactions);
      setRecommendation(rec);
    } catch (error) {
      console.error('Error getting recommendation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptGoal = (goal: any) => {
    addGoal(goal);
    setSuggestedGoals(suggestedGoals.filter(g => g.id !== goal.id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-teal-600 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Coach</h3>
                    <p className="text-xs opacity-90">Your success partner</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2 px-2 rounded-md text-xs font-semibold transition ${
                        activeTab === tab.id
                          ? 'bg-white text-primary'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <Icon size={14} className="mx-auto mb-1" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Strategy Tab */}
              {activeTab === 'strategy' && (
                <div>
                  {!strategyData ? (
                    <div className="text-center py-8">
                      <Lightbulb size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">Get personalized sales strategy</p>
                      <button
                        onClick={handleGetStrategy}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                      >
                        {isLoading ? 'Analyzing...' : 'Get Strategy'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Your Strategy</h4>
                        <p className="text-sm text-gray-700">{strategyData.strategy}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Action Items</h4>
                        <ul className="space-y-2">
                          {strategyData.actionItems.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-primary font-bold">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Focus Products</h4>
                        <div className="flex flex-wrap gap-2">
                          {strategyData.focusProducts.map((product: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleGetStrategy}
                        className="w-full py-2 text-sm text-primary font-semibold hover:underline"
                      >
                        Refresh Strategy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div>
                  {!performanceData ? (
                    <div className="text-center py-8">
                      <TrendingUp size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">Analyze your performance metrics</p>
                      <button
                        onClick={handleGetPerformance}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                      >
                        {isLoading ? 'Analyzing...' : 'Analyze Performance'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{performanceData.conversionRate}%</div>
                          <div className="text-xs text-gray-600">Conversion Rate</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{performanceData.customerRetention}%</div>
                          <div className="text-xs text-gray-600">Retention</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{performanceData.teamGrowthRate}%</div>
                          <div className="text-xs text-gray-600">Team Growth</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm font-bold text-orange-600">{performanceData.bestPerformingDay}</div>
                          <div className="text-xs text-gray-600">Best Day</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Improvement Areas</h4>
                        <ul className="space-y-2">
                          {performanceData.improvementAreas.map((area: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-primary font-bold">•</span>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={handleGetPerformance}
                        className="w-full py-2 text-sm text-primary font-semibold hover:underline"
                      >
                        Refresh Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Goals Tab */}
              {activeTab === 'goals' && (
                <div>
                  {suggestedGoals.length === 0 ? (
                    <div className="text-center py-8">
                      <Target size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">Get AI-suggested goals</p>
                      <button
                        onClick={handleSuggestGoals}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                      >
                        {isLoading ? 'Generating...' : 'Suggest Goals'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suggestedGoals.map((goal) => (
                        <div key={goal.id} className="p-3 border-2 border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-semibold rounded-full whitespace-nowrap">
                              {goal.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                          <button
                            onClick={() => handleAcceptGoal(goal)}
                            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 transition"
                          >
                            Accept Goal
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={handleSuggestGoals}
                        className="w-full py-2 text-sm text-primary font-semibold hover:underline"
                      >
                        Get New Suggestions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommend' && (
                <div>
                  {!recommendation ? (
                    <div className="text-center py-8">
                      <Sparkles size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-4">Get product recommendations</p>
                      <button
                        onClick={handleGetRecommendation}
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                      >
                        {isLoading ? 'Analyzing...' : 'Get Recommendation'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
                        <h4 className="font-semibold text-gray-900 mb-2">Recommended Product</h4>
                        <div className="text-lg font-bold text-primary mb-2">
                          {products.find(p => p.id === recommendation.productId)?.name}
                        </div>
                        <p className="text-sm text-gray-700">{recommendation.reason}</p>
                      </div>

                      <button
                        onClick={handleGetRecommendation}
                        className="w-full py-2 text-sm text-primary font-semibold hover:underline"
                      >
                        Get New Recommendation
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-br from-primary to-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isExpanded ? <ChevronDown size={24} /> : <Bot size={24} />}
      </motion.button>
    </div>
  );
}
