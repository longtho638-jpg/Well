/**
 * Landing Hero Section Component
 * Max-level Aura Hero with bento grid showcase
 * Features:
 * - Animated gradient background
 * - Sparkle effects
 * - Morphing blobs
 * - Bento grid with 5 feature cards
 * - Hero stats display
 */

import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Users,
  Globe,
} from 'lucide-react';
import { BentoGrid, BentoCard, GridPattern } from '@/components/ui/Aura';
import { HeroStats } from '@/components/HeroEnhancements';
import {
  AnimatedGradientBg,
  CursorGlow,
  SparkleEffect,
} from '@/components/PremiumEffects';
import {
  GradientText,
  AnimatedBorder,
  MorphingBlob,
} from '@/components/UltimateEffects';

interface HeroContent {
  hero: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
  };
  bento: {
    ai_coach: { title: string; description: string };
    passive_income: { title: string; description: string; amount: string; label: string };
    community: { title: string; description: string };
    global: { title: string; description: string };
  };
}

interface HeroStat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

interface Props {
  content: HeroContent;
  heroStats: HeroStat[];
  onJoin: () => void;
  onLearnMore?: () => void;
  t: (key: string) => string;
}

export default function LandingHeroSection({
  content,
  heroStats,
  onJoin,
  onLearnMore,
  t,
}: Props) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 pt-16 pb-12 md:pt-20 md:pb-20">
      <GridPattern />

      {/* MAX LEVEL: Animated Gradient Background */}
      <AnimatedGradientBg />

      {/* MAX LEVEL: Sparkle Effect */}
      <SparkleEffect count={30} />

      {/* Cursor Glow Effect */}
      <CursorGlow />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">

        {/* ULTIMATE: Morphing Blob Background - hidden on mobile for perf */}
        <MorphingBlob className="hidden md:block w-[600px] h-[600px] bg-gradient-to-r from-emerald-500 to-cyan-500 -top-20 -left-40" />
        <MorphingBlob className="hidden md:block w-[400px] h-[400px] bg-gradient-to-r from-violet-500 to-pink-500 top-40 -right-20" />

        {/* Header Content */}
        <div className="text-center mb-10 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center mb-6"
          >
            <AnimatedBorder>
              <span className="px-6 py-2 text-sm font-bold text-emerald-400 uppercase tracking-wider">
                {t('landing.hero.badge_ultimate')}
              </span>
            </AnimatedBorder>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {content.hero.headline} <br />
            <GradientText className="font-black">
              {content.hero.headlineAccent}
            </GradientText>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 md:mb-10 px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {content.hero.subheadline}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button onClick={onJoin} className="btn-aura w-full sm:w-auto">
              {content.hero.primaryCta}
            </button>
            <button className="btn-aura-outline w-full sm:w-auto" onClick={onLearnMore}>
              {content.hero.secondaryCta}
            </button>
          </motion.div>
        </div>

        {/* Bento Grid Showcase — benefit-first: income proof leads */}
        <BentoGrid>
          {/* Card 1: Income Proof — colSpan 2, benefit-first */}
          <BentoCard colSpan={2} className="p-6 md:p-8 min-h-[250px] md:min-h-[300px] flex flex-col justify-between bg-zinc-900/40">
            <div>
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
                <TrendingUp className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('landing.bento.passive_income.title')}</h3>
              <p className="text-zinc-400 mb-6">{t('landing.bento.passive_income.description')}</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                {t('landing.bento.passive_income.amount')}
              </div>
              <div className="text-sm text-zinc-500 mt-1">{t('landing.bento.passive_income.label')}</div>
            </div>
          </BentoCard>

          {/* Card 2: AI Coach */}
          <BentoCard colSpan={1} className="p-6 md:p-8 min-h-[250px] md:min-h-[300px] flex flex-col justify-between bg-zinc-900/40">
            <div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('landing.bento.ai_coach.title')}</h3>
              <p className="text-zinc-400">{t('landing.bento.ai_coach.description')}</p>
            </div>
            <div className="mt-6 w-full h-20 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-xl border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>
          </BentoCard>

          {/* Card 3: Community */}
          <BentoCard colSpan={1} className="p-6 md:p-8 min-h-[250px] md:min-h-[300px] bg-zinc-900/40">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 border border-pink-500/20">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('landing.bento.community.title')}</h3>
            <p className="text-zinc-400">{t('landing.bento.community.description')}</p>
          </BentoCard>

          {/* Card 4: Global */}
          <BentoCard colSpan={2} className="p-6 md:p-8 min-h-[300px] bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="max-w-md">
              <h3 className="text-2xl font-bold text-white mb-2">{t('landing.bento.global.title')}</h3>
              <p className="text-zinc-400">{t('landing.bento.global.description')}</p>
            </div>
            <Globe className="w-20 h-20 sm:w-32 sm:h-32 text-zinc-800 flex-shrink-0" />
          </BentoCard>
        </BentoGrid>

        {/* WOW Enhancement: Hero Stats */}
        <HeroStats stats={heroStats} />

      </div>
    </section>
  );
}
