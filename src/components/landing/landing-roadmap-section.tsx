/**
 * Landing Roadmap Section Component
 * Four-stage growth roadmap with unlock conditions
 * Features:
 * - Animated stage cards with status badges
 * - Benefits list with icons
 * - Unlock condition display
 * - Interactive hover effects
 * - Vision link for final stage
 */

import { motion } from 'framer-motion';
import { Target, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface RoadmapStage {
  id: string;
  name: string;
  icon: React.ElementType;
  status: string;
  statusLabel: string;
  color: string;
  gradient: string;
  bgGlow: string;
  textColor: string;
  borderColor: string;
  description: string;
  mission: string;
  benefits: string[];
  unlockCondition: string | null;
  hasVisionLink?: boolean;
}

interface RoadmapContent {
  sectionBadge: string;
  sectionTitle: string;
  subheadline: string;
  stages: RoadmapStage[];
}

interface Props {
  content: RoadmapContent;
  onVisionClick: () => void;
}

export default function LandingRoadmapSection({
  content,
  onVisionClick,
}: Props) {
  const { t } = useTranslation();

  return (
    <section id="roadmap" className="relative py-32 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2 mb-6">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              {content.sectionBadge}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-100 mb-6">
            {content.sectionTitle}
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            {content.subheadline}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isLocked = stage.status === 'locked';
            const isVision = stage.status === 'vision';

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`
                  relative group overflow-hidden rounded-3xl
                  ${isLocked || isVision ? 'opacity-60' : ''}
                  bg-gradient-to-br from-zinc-900/90 to-zinc-950/90
                  backdrop-blur-xl border border-zinc-800/50
                  hover:border-${stage.color}-500/50 transition-all duration-300
                  hover:scale-105 hover:shadow-2xl hover:shadow-${stage.color}-500/20
                `}
              >
                {/* Stage Glow Background */}
                <div className={`absolute inset-0 ${stage.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl`} />

                <div className="relative p-8">
                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${stage.gradient} text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6 shadow-lg`}>
                    {stage.statusLabel}
                  </div>

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Stage Name */}
                  <h3 className={`text-2xl font-bold mb-3 ${stage.textColor}`}>
                    {stage.name}
                  </h3>

                  {/* Description */}
                  <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                    {stage.description}
                  </p>

                  {/* Mission */}
                  <p className="text-zinc-500 text-xs italic mb-6 border-l-2 border-zinc-700 pl-3">
                    {stage.mission}
                  </p>

                  {/* Benefits */}
                  <div className="space-y-2 mb-6">
                    {stage.benefits.map((benefit, benefitIdx) => (
                      <div key={benefitIdx} className="flex items-start gap-2">
                        <span className={`${stage.textColor} text-lg mt-0.5`}>✓</span>
                        <span className="text-zinc-300 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Unlock Condition or Vision Link */}
                  {stage.unlockCondition && (
                    <div className={`mt-auto pt-6 border-t ${stage.borderColor}`}>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                        {t('landing.roadmap.unlock_at')}
                      </p>
                      <p className={`text-sm font-bold ${stage.textColor}`}>
                        {stage.unlockCondition}
                      </p>
                    </div>
                  )}

                  {stage.hasVisionLink && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onVisionClick}
                      className={`mt-6 w-full bg-gradient-to-r ${stage.gradient} text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
                    >
                      {t('landing.roadmap.view_vision')}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
