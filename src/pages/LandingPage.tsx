import React from 'react';
import { useTranslation } from '../hooks';
import { motion } from 'framer-motion';
import { ParticleBackground } from '@/components/ParticleBackground';
import {
  ArrowRight,
  Sprout,
  TreeDeciduous,
  Trees,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  TrendingUp,
  Award,
  Rocket,
  ChevronRight,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Star,
  Zap,
  Target,
  Globe,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { BentoGrid, BentoCard, AuraBadge, GridPattern } from '../components/ui/Aura';
import {
  HeroStats,
  SocialProofTicker,
  TestimonialsCarousel,
  TrustBadges,
  HERO_STATS,
  SOCIAL_PROOF_ITEMS,
  TESTIMONIALS,
  TRUST_BADGES,
} from '../components/HeroEnhancements';
import {
  AnimatedGradientBg,
  FloatingElement,
  GlassCard,
  CursorGlow,
  ShimmerText,
  SparkleEffect,
  Reveal,
  PulseRing,
} from '../components/PremiumEffects';
import {
  TiltCard,
  Typewriter,
  GradientText,
  SpotlightCard,
  AnimatedBorder,
  MorphingBlob,
  Marquee,
} from '../components/UltimateEffects';
import {
  ZenDivider,
  AwardsBar,
  ScrollProgress,
  StaggeredText,
  EA_AWARDS,
} from '../components/EastAsiaBrand';
import {
  PremiumHeader,
  PremiumFooter,
} from '../components/PremiumNavigation';

// ============================================================================
// CONTENT ARCHITECTURE - Growth Journey Map
// ============================================================================
// CONTENT object moved inside component for i18n

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useStore();

  const CONTENT = {
    hero: {
      badge: 'Hành Trình Thịnh Vượng',
      headline: t('landing.hero.title'),
      headlineAccent: 'Cùng WellNexus',
      subheadline: t('landing.hero.subtitle'),
      primaryCta: t('landing.hero.cta'), // Using cta.button key logically
      secondaryCta: t('landing.hero.learnMore'),
      currentStage: t('landing.roadmap.stages.seed.status')
    },

    roadmap: {
      sectionBadge: t('landing.roadmap.sectionBadge'),
      sectionTitle: t('landing.roadmap.sectionTitle'),
      subheadline: t('landing.roadmap.subheadline'),
      stages: [
        {
          id: 'seed',
          name: t('landing.roadmap.stages.seed.name'),
          icon: Sprout,
          status: 'active',
          statusLabel: t('landing.roadmap.stages.seed.status'),
          color: 'teal',
          gradient: 'from-teal-500 to-teal-600',
          bgGlow: 'bg-teal-500/20',
          textColor: 'text-teal-400',
          borderColor: 'border-teal-500/50',
          description: t('landing.roadmap.stages.seed.description'),
          mission: t('landing.roadmap.stages.seed.mission'),
          benefits: [
            'Thu nhập chủ động từ bán hàng',
            'Hoa hồng Founder Club',
            'Công cụ AI cơ bản',
            'Đào tạo & hỗ trợ 1-1'
          ],
          unlockCondition: null
        },
        {
          id: 'tree',
          name: t('landing.roadmap.stages.tree.name'),
          icon: TreeDeciduous,
          status: 'coming',
          statusLabel: t('landing.roadmap.stages.tree.status'),
          color: 'green',
          gradient: 'from-green-500 to-green-600',
          bgGlow: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/50',
          description: t('landing.roadmap.stages.tree.description'),
          mission: t('landing.roadmap.stages.tree.mission'),
          benefits: [
            'AI Copilot nâng cao',
            'Tự động hóa marketing',
            'Leader Dashboard',
            'Thu nhập thụ động từ team'
          ],
          unlockCondition: '1,000 Partner'
        },
        {
          id: 'forest',
          name: t('landing.roadmap.stages.forest.name'),
          icon: Trees,
          status: 'locked',
          statusLabel: t('landing.roadmap.stages.forest.status'),
          color: 'emerald',
          gradient: 'from-emerald-500 to-emerald-600',
          bgGlow: 'bg-emerald-500/20',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/50',
          description: t('landing.roadmap.stages.forest.description'),
          mission: t('landing.roadmap.stages.forest.mission'),
          benefits: [
            'Health Coach Platform',
            'Marketplace ownership',
            'Data monetization',
            'Equity participation'
          ],
          unlockCondition: '10,000 Partner'
        },
        {
          id: 'empire',
          name: t('landing.roadmap.stages.empire.name'),
          icon: Building2,
          status: 'vision',
          statusLabel: t('landing.roadmap.stages.empire.status'),
          color: 'amber',
          gradient: 'from-amber-500 to-yellow-500',
          bgGlow: 'bg-amber-500/20',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/50',
          description: t('landing.roadmap.stages.empire.description'),
          mission: t('landing.roadmap.stages.empire.mission'),
          benefits: [
            'Venture Builder platform',
            'IPO preparation',
            'Holdings structure',
            'SEA expansion'
          ],
          unlockCondition: '100,000 Partner',
          hasVisionLink: true
        }
      ]
    },

    whyNow: {
      sectionBadge: t('landing.whyNow.sectionBadge'),
      sectionTitle: t('landing.whyNow.sectionTitle'),
      subheadline: t('landing.whyNow.subheadline'),
      benefits: [
        {
          icon: Award,
          title: t('landing.whyNow.benefits.founders.title'),
          description: t('landing.whyNow.benefits.founders.description'),
          highlight: 'Chỉ còn 157 slot'
        },
        {
          icon: TrendingUp,
          title: t('landing.whyNow.benefits.growth.title'),
          description: t('landing.whyNow.benefits.growth.description'),
          highlight: '+320% YoY'
        },
        {
          icon: Zap,
          title: t('landing.whyNow.benefits.tech.title'),
          description: t('landing.whyNow.benefits.tech.description'),
          highlight: 'Early Access'
        },
        {
          icon: Globe,
          title: t('landing.whyNow.benefits.market.title'),
          description: t('landing.whyNow.benefits.market.description'),
          highlight: 'First-Mover'
        }
      ]
    },

    footer: {
      logo: 'WellNexus',
      tagline: 'Hệ sinh thái Social Commerce tiên phong tại Đông Nam Á với AI-driven technology, equity ownership, và lộ trình rõ ràng từ Hạt Giống đến Đế Chế.',
      newsletter: {
        title: 'Nhận Thông Tin Cập Nhật',
        placeholder: 'Email của bạn'
      },
      social: {
        facebook: 'https://facebook.com/wellnexus',
        instagram: 'https://instagram.com/wellnexus',
        linkedin: 'https://linkedin.com/company/wellnexus'
      },
      copyright: '© 2025 WellNexus. All rights reserved.'
    }
  };

  const handleJoin = () => {
    navigate('/signup');
  };

  const handleVisionClick = () => {
    navigate('/venture');
  };

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden selection:bg-emerald-900 selection:text-emerald-100">
      {/* East Asia 2026: Scroll Progress Indicator */}
      <ScrollProgress />


      {/* ================================================================== */}
      {/* PREMIUM HEADER - Phase 22 East Asia 2026 */}
      {/* ================================================================== */}
      <PremiumHeader />

      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      {/* MAX LEVEL AURA HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 pt-20 pb-20">
        <GridPattern />

        {/* MAX LEVEL: Animated Gradient Background */}
        <AnimatedGradientBg />

        {/* MAX LEVEL: Sparkle Effect */}
        <SparkleEffect count={30} />

        {/* Cursor Glow Effect */}
        <CursorGlow />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">

          {/* ULTIMATE: Morphing Blob Background */}
          <MorphingBlob className="w-[600px] h-[600px] bg-gradient-to-r from-emerald-500 to-cyan-500 -top-20 -left-40" />
          <MorphingBlob className="w-[400px] h-[400px] bg-gradient-to-r from-violet-500 to-pink-500 top-40 -right-20" />

          {/* Header Content */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <AnimatedBorder>
                <span className="px-6 py-2 text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  🚀 ULTIMATE LEVEL WELLNESS
                </span>
              </AnimatedBorder>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {CONTENT.hero.headline} <br />
              <GradientText className="font-black">
                {CONTENT.hero.headlineAccent}
              </GradientText>
            </motion.h1>

            <motion.p
              className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {CONTENT.hero.subheadline}
            </motion.p>

            <motion.div
              className="flex items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button onClick={handleJoin} className="btn-aura">
                {CONTENT.hero.primaryCta}
              </button>
              <button className="btn-aura-outline">
                {CONTENT.hero.secondaryCta}
              </button>
            </motion.div>
          </div>

          {/* Bento Grid Showcase */}
          <BentoGrid>
            <BentoCard colSpan={2} className="p-8 min-h-[300px] flex flex-col justify-between bg-zinc-900/40">
              <div>
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 border border-cyan-500/20">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Huấn Luyện Viên AI</h3>
                <p className="text-zinc-400">Hướng dẫn cá nhân hóa bởi Gemini 1.5 Pro. Đồng hành sức khỏe 24/7.</p>
              </div>
              <div className="mt-8 w-full h-32 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-xl border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              </div>
            </BentoCard>

            <BentoCard colSpan={1} className="p-8 min-h-[300px] bg-zinc-900/40">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
                <TrendingUp className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Thu Nhập Thụ Động</h3>
              <p className="text-zinc-400 mb-8">Theo dõi hoa hồng tự động và phần thưởng đa cấp.</p>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                $12,450
              </div>
              <div className="text-sm text-zinc-500 mt-1">Thu nhập TB Partner</div>
            </BentoCard>

            <BentoCard colSpan={1} className="p-8 min-h-[300px] bg-zinc-900/40">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 border border-pink-500/20">
                <Users className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Cộng Đồng</h3>
              <p className="text-zinc-400">Tham gia cùng 1,000+ founders xây dựng tương lai sức khỏe.</p>
            </BentoCard>

            <BentoCard colSpan={2} className="p-8 min-h-[300px] bg-zinc-900/40 flex items-center justify-between">
              <div className="max-w-md">
                <h3 className="text-2xl font-bold text-white mb-2">Mở Rộng Toàn Cầu</h3>
                <p className="text-zinc-400">Sẵn sàng chinh phục thị trường SEA. Hỗ trợ đa tiền tệ, đa ngôn ngữ.</p>
              </div>
              <Globe className="w-32 h-32 text-zinc-800" />
            </BentoCard>
          </BentoGrid>

          {/* WOW Enhancement: Hero Stats */}
          <HeroStats stats={HERO_STATS} />

        </div>
      </section>

      {/* WOW Enhancement: Trust Badges */}
      <TrustBadges badges={TRUST_BADGES} />

      {/* East Asia 2026: Awards & Certifications */}
      <AwardsBar awards={EA_AWARDS} />

      {/* East Asia 2026: Zen Divider */}
      <ZenDivider />

      {/* ================================================================== */}
      {/* THE ROADMAP SECTION - 4 Stages */}
      {/* ================================================================== */}
      <section id="roadmap" className="relative py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
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
                {CONTENT.roadmap.sectionBadge}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-100 mb-6">
              {CONTENT.roadmap.sectionTitle}
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              {CONTENT.roadmap.subheadline}
            </p>
          </motion.div>

          {/* Stages Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {CONTENT.roadmap.stages.map((stage, idx) => {
              const StageIcon = stage.icon;
              const isActive = stage.status === 'active';
              const isLocked = stage.status === 'locked' || stage.status === 'vision';

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                  whileHover={{ opacity: 1, scale: 1.03 }}
                  className="group relative"
                >
                  {/* Glow Effect for Active */}
                  {isActive && (
                    <div className={`absolute -inset-0.5 bg-gradient-to-br ${stage.gradient} rounded-3xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity`} />
                  )}

                  {/* Card */}
                  <div className={`relative bg-zinc-900/50 border ${isActive ? stage.borderColor : 'border-zinc-800'} rounded-3xl p-8 h-full transition-all ${isLocked ? 'opacity-50' : ''}`}>
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center mb-6 shadow-lg ${isActive ? 'ring-4 ring-offset-2 ring-' + stage.color + '-200' : ''}`}>
                      <StageIcon className="w-8 h-8 text-white" />
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${isActive ? stage.bgGlow + ' ' + stage.textColor : 'bg-slate-100 text-slate-600'}`}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {stage.statusLabel}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className={`text-2xl font-black mb-3 ${isActive ? stage.textColor : 'text-zinc-200'}`}>
                      {stage.name}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 font-medium mb-2">
                      {stage.description}
                    </p>
                    <p className="text-sm text-slate-500 mb-6 italic">
                      {stage.mission}
                    </p>

                    {/* Benefits */}
                    <ul className="space-y-3 mb-6">
                      {stage.benefits.map((benefit, bidx) => (
                        <li key={bidx} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isActive ? stage.textColor : 'text-slate-400'}`} />
                          <span className="text-sm text-zinc-400 leading-relaxed">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Unlock Condition or Action */}
                    {stage.unlockCondition ? (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Lock className="w-3 h-3" />
                          <span>Mở khóa khi đạt {stage.unlockCondition}</span>
                        </div>
                      </div>
                    ) : stage.hasVisionLink ? (
                      <motion.button
                        onClick={handleVisionClick}
                        className={`w-full mt-4 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r ${stage.gradient} text-white shadow-lg flex items-center justify-center gap-2`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Globe className="w-4 h-4" />
                        Xem Tầm Nhìn
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-600">
                          <Star className="w-3 h-3" />
                          <span>Giai đoạn hiện tại</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* WHY NOW SECTION */}
      {/* ================================================================== */}
      <section className="relative py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-5 py-2 mb-6">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700 uppercase tracking-wider">
                {CONTENT.whyNow.sectionBadge}
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-100 mb-6">
              {CONTENT.whyNow.sectionTitle}
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              {CONTENT.whyNow.subheadline}
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTENT.whyNow.benefits.map((benefit, idx) => {
              const BenefitIcon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  className="group relative"
                >
                  <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-full hover:border-emerald-500/50 hover:shadow-xl transition-all">
                    {/* Highlight Badge */}
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {benefit.highlight}
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BenefitIcon className="w-6 h-6 text-black" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-zinc-100 mb-2">
                      {benefit.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <motion.button
              onClick={handleJoin}
              className="group bg-gradient-to-r from-[#00575A] to-teal-600 text-white px-12 py-6 rounded-xl font-bold text-xl flex items-center justify-center gap-3 mx-auto shadow-2xl shadow-teal-500/30"
              whileHover={{ scale: 1.05, boxShadow: '0 30px 60px rgba(0, 87, 90, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-6 h-6" />
              Tham Gia Ngay - Chỉ Còn 157 Slot
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* TESTIMONIALS SECTION - WOW Enhancement */}
      {/* ================================================================== */}
      <section className="relative py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-5 py-2 mb-6">
              <Star className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-bold text-pink-400 uppercase tracking-wider">
                Câu Chuyện Thành Công
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-100 mb-6">
              Partner Nói Gì Về WellNexus?
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Hàng ngàn partner đã thay đổi cuộc sống cùng WellNexus
            </p>
          </motion.div>

          <TestimonialsCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>

      {/* Live Social Proof Ticker - Fixed Position */}
      <SocialProofTicker items={SOCIAL_PROOF_ITEMS} />


      {/* ================================================================== */}
      {/* PREMIUM FOOTER - Phase 22 East Asia 2026 */}
      {/* ================================================================== */}
      <PremiumFooter />
    </div>
  );
}
