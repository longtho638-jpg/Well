import React from 'react';
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

// ============================================================================
// CONTENT ARCHITECTURE - Growth Journey Map
// ============================================================================
const CONTENT = {
  hero: {
    badge: 'Hành Trình Thịnh Vượng',
    headline: 'Khởi Đầu Hành Trình Thịnh Vượng',
    headlineAccent: 'Cùng WellNexus',
    subheadline: 'Hệ sinh thái Social Commerce tiên phong tại Đông Nam Á. Từ Hạt Giống đến Đế Chế.',
    primaryCta: 'Gia Nhập Founders Club',
    secondaryCta: 'Tìm Hiểu Thêm',
    currentStage: 'Hiện đang ở Giai đoạn Hạt Giống'
  },

  roadmap: {
    sectionBadge: 'Lộ Trình Phát Triển',
    sectionTitle: 'The Evolution Map',
    subheadline: 'Hành trình từ Partner đến Empire Builder',
    stages: [
      {
        id: 'seed',
        name: 'HẠT GIỐNG',
        icon: Sprout,
        status: 'active',
        statusLabel: 'Đang diễn ra',
        color: 'teal',
        gradient: 'from-teal-500 to-teal-600',
        bgGlow: 'bg-teal-500/20',
        textColor: 'text-teal-400',
        borderColor: 'border-teal-500/50',
        description: 'Tuyển 200 Founders Club, Xây dựng niềm tin',
        mission: 'Bán lẻ & Xây dựng cộng đồng',
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
        name: 'CÂY',
        icon: TreeDeciduous,
        status: 'coming',
        statusLabel: 'Sắp mở khóa',
        color: 'green',
        gradient: 'from-green-500 to-green-600',
        bgGlow: 'bg-green-500/20',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/50',
        description: 'Tự động hóa Sales với AI',
        mission: 'Scale team & Automation',
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
        name: 'RỪNG',
        icon: Trees,
        status: 'locked',
        statusLabel: 'Tương lai',
        color: 'emerald',
        gradient: 'from-emerald-500 to-emerald-600',
        bgGlow: 'bg-emerald-500/20',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/50',
        description: 'Marketplace & Hệ sinh thái',
        mission: 'Build ecosystem products',
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
        name: 'ĐẤT',
        icon: Building2,
        status: 'vision',
        statusLabel: 'Tầm nhìn 2028',
        color: 'amber',
        gradient: 'from-amber-500 to-yellow-500',
        bgGlow: 'bg-amber-500/20',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/50',
        description: 'Venture Builder & IPO',
        mission: 'Build the empire',
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
    sectionBadge: 'Lợi Thế Tiên Phong',
    sectionTitle: 'Tại Sao Phải Tham Gia Ngay?',
    subheadline: 'Quyền lợi đặc biệt dành cho những người đi đầu trong giai đoạn Hạt Giống',
    benefits: [
      {
        icon: Award,
        title: 'Founders Club Bonus',
        description: 'Hoa hồng đặc biệt và equity allocation cho 200 Partner đầu tiên',
        highlight: 'Chỉ còn 157 slot'
      },
      {
        icon: TrendingUp,
        title: 'Tăng Trưởng Sớm',
        description: 'Xây dựng team từ đầu, hưởng lợi từ network effect khi hệ thống scale',
        highlight: '+320% YoY'
      },
      {
        icon: Zap,
        title: 'Công Nghệ AI Độc Quyền',
        description: 'Truy cập sớm vào Agentic OS và AI tools chỉ dành cho Founders',
        highlight: 'Early Access'
      },
      {
        icon: Globe,
        title: 'SEA Market First-Mover',
        description: 'Đi đầu trong thị trường $12B, mở rộng sang 4 quốc gia SEA',
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useStore();

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
      {/* ================================================================== */}
      {/* STICKY HEADER */}
      {/* ================================================================== */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20">
              W
            </div>
            <div>
              <div className="font-bold text-xl text-zinc-100 tracking-tight">
                {CONTENT.footer.logo}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                Evolution Map
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            onClick={handleJoin}
            className="bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-white/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Bắt Đầu Ngay
          </motion.button>
        </div>
      </motion.nav>

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

          {/* Header Content */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <AuraBadge color="cyan">MASTER LEVEL WELLNESS</AuraBadge>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {CONTENT.hero.headline} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                {CONTENT.hero.headlineAccent}
              </span>
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
      {/* FOOTER */}
      {/* ================================================================== */}
      <footer className="relative bg-zinc-950 text-white pt-20 pb-12 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-2xl shadow-lg">
                  W
                </div>
                <div>
                  <div className="font-bold text-xl">{CONTENT.footer.logo}</div>
                  <div className="text-xs text-slate-400">Evolution Map</div>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
                {CONTENT.footer.tagline}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Facebook, href: CONTENT.footer.social.facebook },
                  { icon: Instagram, href: CONTENT.footer.social.instagram },
                  { icon: Linkedin, href: CONTENT.footer.social.linkedin }
                ].map((social, idx) => {
                  const SocialIcon = social.icon;
                  return (
                    <motion.a
                      key={idx}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-teal-600 border border-slate-700 hover:border-teal-500 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <SocialIcon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-bold text-xl mb-4">
                {CONTENT.footer.newsletter.title}
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder={CONTENT.footer.newsletter.placeholder}
                  className="flex-1 px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <motion.button
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-slate-500 text-sm pt-8 border-t border-slate-800">
            {CONTENT.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
