import React from 'react';
import TheCopilot from '@/components/TheCopilot';
import { useStore } from '@/store';
import { Bot, Target, MessageCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export default function CopilotPage() {
  const { user } = useStore();
  const { t } = useTranslation();

  const features = [
    {
      icon: MessageCircle,
      title: t.copilot.features.objectionHandling.title,
      description: t.copilot.features.objectionHandling.description
    },
    {
      icon: Target,
      title: t.copilot.features.scriptGeneration.title,
      description: t.copilot.features.scriptGeneration.description
    },
    {
      icon: TrendingUp,
      title: t.copilot.features.realtimeCoaching.title,
      description: t.copilot.features.realtimeCoaching.description
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t.copilot.title}</h1>
                <p className="text-white/80 text-sm">{t.copilot.subtitle}</p>
              </div>
            </div>
            <p className="text-white/90 max-w-2xl">
              {t.copilot.description}
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <Icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-4">📊 {t.copilot.stats.title}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-primary">12</p>
            <p className="text-xs text-gray-600">{t.copilot.stats.objectionsHandled}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">8</p>
            <p className="text-xs text-gray-600">{t.copilot.stats.scriptsCreated}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">85%</p>
            <p className="text-xs text-gray-600">{t.copilot.stats.conversionRate}</p>
          </div>
        </div>
      </div>

      {/* The Copilot Component */}
      <div>
        <TheCopilot
          userName={user.name}
          productContext="WellNexus products - premium health and wellness supplements"
        />
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">💡 {t.copilot.tips.title}</h3>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="text-accent font-bold">1.</span>
            <span>{t.copilot.tips.tip1}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-bold">2.</span>
            <span>{t.copilot.tips.tip2}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-bold">3.</span>
            <span>{t.copilot.tips.tip3}</span>
          </li>
          <li className="flex gap-3">
            <span className="text-accent font-bold">4.</span>
            <span>{t.copilot.tips.tip4}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
