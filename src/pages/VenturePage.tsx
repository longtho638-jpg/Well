import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Users,
  Bot,
  TrendingUp,
  Crown,
  CheckCircle2,
  Sparkles,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Zap,
  Globe,
  Network,
  Rocket,
  Lock,
  ChevronRight,
  Building2,
  LineChart,
  Award,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

// ============================================================================
// SMOOTH SCROLL UTILITY
// ============================================================================
const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// ============================================================================
// CONTENT ARCHITECTURE - Venture Builder Positioning
// ============================================================================
const CONTENT = {
  hero: {
    badge: 'Venture Builder · SEA Health Market',
    headline: 'WellNexus Venture Builder:',
    headlineAccent: 'Nơi Khởi Nguồn Của Những Kỳ Lân Sức Khỏe Tiếp Theo Tại SEA',
    subheadline: 'Chúng tôi không tìm người bán hàng. Chúng tôi tìm kiếm 200 Co-Founders để cùng sở hữu và vận hành chuỗi cung ứng sức khỏe phi tập trung (DeFi Health).',
    primaryCta: 'Nộp Hồ Sơ Đối Tác Chiến Lược',
    secondaryCta: 'Xem Portfolio',
    stats: [
      { value: '$2.5M', label: 'Total Portfolio Valuation' },
      { value: '200', label: 'Co-Founder Slots' },
      { value: 'SEA', label: 'Market Coverage' }
    ]
  },

  deal: {
    sectionBadge: 'The Term Sheet',
    sectionTitle: 'Cơ Cấu Đầu Tư & Quyền Lợi',
    subheadline: 'Mô hình đầu tư dành cho Co-Founders với equity ownership thực sự',
    terms: [
      {
        category: 'Vốn (Capital)',
        items: [
          'Hỗ trợ hàng hóa (Inventory) không cần vốn ban đầu',
          'Working capital từ hệ sinh thái WellNexus',
          'Credit line mở rộng theo performance'
        ],
        icon: Building2,
        gradient: 'from-emerald-500/20 to-teal-500/20'
      },
      {
        category: 'Công nghệ (Technology Stack)',
        items: [
          'Agentic OS - Hệ điều hành AI độc quyền',
          'Real-time Analytics & Valuation Dashboard',
          'Automated Tax Compliance (Vietnam Law)',
          'Smart Contract Integration (Blockchain-ready)'
        ],
        icon: Zap,
        gradient: 'from-violet-500/20 to-purple-500/20'
      },
      {
        category: 'Cổ phần (Equity)',
        items: [
          'ESOP Program - Employee Stock Ownership Plan',
          'GROW Token Allocation (Equity-backed)',
          'Vesting schedule: 4 năm với 1 năm cliff',
          'Lộ trình IPO rõ ràng với milestone định giá'
        ],
        icon: Award,
        gradient: 'from-amber-500/20 to-yellow-500/20'
      }
    ]
  },

  portfolio: {
    sectionBadge: 'Portfolio Companies',
    sectionTitle: 'Những Founder Đã Đạt Định Giá',
    subheadline: 'Học hỏi từ những Co-Founders thành công trong hệ sinh thái WellNexus',
    companies: [
      {
        founderName: 'Nguyễn Minh An',
        companyName: 'AnHealth Distribution',
        role: 'Co-Founder & CEO',
        valuation: '$500K',
        growth: '+320% YoY',
        metric: '₫180M ARR',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
        region: 'Hà Nội'
      },
      {
        founderName: 'Trần Thị Bích',
        companyName: 'Wellness Network VN',
        role: 'Co-Founder & CMO',
        valuation: '$350K',
        growth: '+280% YoY',
        metric: '₫125M ARR',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80',
        region: 'TP.HCM'
      },
      {
        founderName: 'Lê Hoàng Long',
        companyName: 'HealthTech Ventures',
        role: 'Co-Founder & CTO',
        valuation: '$420K',
        growth: '+295% YoY',
        metric: '₫155M ARR',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
        region: 'Đà Nẵng'
      }
    ]
  },

  market: {
    sectionBadge: 'SEA Expansion',
    sectionTitle: 'Biên Giới Của Bạn Không Phải Là Việt Nam',
    subheadline: 'Là cả Đông Nam Á - Market opportunity $12B',
    regions: [
      { name: 'Vietnam', market: '$3.5B', growth: '+28%', status: 'Active' },
      { name: 'Thailand', market: '$2.8B', growth: '+22%', status: 'Expanding' },
      { name: 'Indonesia', market: '$4.2B', growth: '+32%', status: 'Planning' },
      { name: 'Philippines', market: '$1.5B', growth: '+25%', status: 'Planning' }
    ]
  },

  footer: {
    logo: 'WellNexus',
    tagline: 'Venture Builder powering the next generation of health entrepreneurs across Southeast Asia with AI-driven technology, equity ownership, and clear path to unicorn status.',
    newsletter: {
      title: 'Co-Founder Updates',
      placeholder: 'Your email'
    },
    social: {
      facebook: 'https://facebook.com/wellnexus',
      instagram: 'https://instagram.com/wellnexus',
      linkedin: 'https://linkedin.com/company/wellnexus'
    },
    copyright: '© 2025 WellNexus Venture Builder. All rights reserved.'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function VenturePage() {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate('/signup');
  };

  // Animation Variants - Cinematic Style
  const cinematicFadeIn = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1,
        ease: [0.16, 1, 0.3, 1] // Custom easing for cinematic feel
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <>
      {/* ====================================================================== */}
      {/* CUSTOM STYLES - Premium Dark Theme */}
      {/* ====================================================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        body {
          font-family: 'Inter', sans-serif;
          background: #0a0a0a;
        }

        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        .grain-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        }

        .mesh-gradient {
          background:
            radial-gradient(at 27% 37%, hsla(175, 100%, 17%, 0.3) 0px, transparent 50%),
            radial-gradient(at 97% 21%, hsla(45, 100%, 50%, 0.15) 0px, transparent 50%),
            radial-gradient(at 52% 99%, hsla(175, 100%, 12%, 0.4) 0px, transparent 50%),
            radial-gradient(at 10% 29%, hsla(175, 100%, 20%, 0.2) 0px, transparent 50%);
        }

        .glow-text {
          text-shadow: 0 0 40px rgba(255, 191, 0, 0.3);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

        {/* ================================================================== */}
        {/* STICKY HEADER - Premium Dark */}
        {/* ================================================================== */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-slate-800/50"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => smoothScrollTo('hero')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFBF00] to-[#FF9500] rounded-lg flex items-center justify-center text-slate-950 font-display font-black text-xl shadow-2xl shadow-[#FFBF00]/20">
                W
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                {CONTENT.footer.logo}
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Venture Builder
              </span>
            </motion.div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Portfolio', id: 'portfolio' },
                { label: 'The Deal', id: 'deal' },
                { label: 'SEA Market', id: 'market' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => smoothScrollTo(item.id)}
                  className="text-sm font-medium text-slate-400 hover:text-[#FFBF00] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Action Button */}
            <motion.button
              onClick={handleJoin}
              className="text-sm font-bold bg-[#FFBF00] hover:bg-[#FF9500] text-slate-950 px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-[#FFBF00]/20"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 191, 0, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Apply Now
            </motion.button>
          </div>
        </motion.nav>

        {/* ================================================================== */}
        {/* HERO SECTION - The Pitch (Dark Premium) */}
        {/* ================================================================== */}
        <section id="hero" className="relative min-h-screen pt-32 pb-20 overflow-hidden">
          {/* Background - Dark Mesh Gradient */}
          <div className="absolute inset-0 z-0 mesh-gradient" />
          <div className="absolute inset-0 z-0 grain-overlay" />

          {/* Animated Grid Background */}
          <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255, 191, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 191, 0, 0.1) 1px, transparent 1px)',
              backgroundSize: '100px 100px'
            }} />
          </div>

          {/* Glowing Orbs */}
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-[#FFBF00]/20 rounded-full blur-[150px] animate-float" />
          <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-[#00575A]/30 rounded-full blur-[120px]" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-center max-w-5xl mx-auto"
            >
              {/* Badge */}
              <motion.div variants={cinematicFadeIn} className="mb-8 inline-flex">
                <div className="inline-flex items-center gap-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-full px-5 py-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBF00] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFBF00]" />
                  </span>
                  <Globe className="w-4 h-4 text-[#FFBF00]" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {CONTENT.hero.badge}
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={cinematicFadeIn}
                className="font-display font-black text-6xl md:text-7xl lg:text-8xl mb-8 leading-[0.9] tracking-tight"
              >
                <span className="text-slate-100">
                  {CONTENT.hero.headline}
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] via-[#FFD700] to-[#FFBF00] glow-text">
                  {CONTENT.hero.headlineAccent}
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={cinematicFadeIn}
                className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-4xl mx-auto"
              >
                {CONTENT.hero.subheadline}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={cinematicFadeIn}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
              >
                <motion.button
                  onClick={handleJoin}
                  className="group bg-[#FFBF00] text-slate-950 px-10 py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-[#FFBF00]/30"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 30px 60px rgba(255, 191, 0, 0.4)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Rocket className="w-5 h-5" />
                  {CONTENT.hero.primaryCta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  onClick={() => smoothScrollTo('portfolio')}
                  className="px-10 py-5 rounded-xl font-bold text-lg text-slate-300 border-2 border-slate-700 hover:border-[#FFBF00] bg-slate-900/50 backdrop-blur-xl hover:bg-slate-800/50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {CONTENT.hero.secondaryCta}
                </motion.button>
              </motion.div>

              {/* Stats - Venture Style */}
              <motion.div
                variants={cinematicFadeIn}
                className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
              >
                {CONTENT.hero.stats.map((stat, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFBF00]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                    <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-[#FFBF00]/50 transition-all">
                      <div className="text-4xl lg:text-5xl font-black text-[#FFBF00] font-display mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm text-slate-400 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* THE DEAL SECTION - Term Sheet Style */}
        {/* ================================================================== */}
        <section id="deal" className="relative py-32 bg-slate-950">
          <div className="absolute inset-0 grain-overlay opacity-50" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-full px-5 py-2 mb-6">
                <Lock className="w-4 h-4 text-[#FFBF00]" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  {CONTENT.deal.sectionBadge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 font-display">
                {CONTENT.deal.sectionTitle}
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                {CONTENT.deal.subheadline}
              </p>
            </motion.div>

            {/* Term Cards Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {CONTENT.deal.terms.map((term, idx) => {
                const Icon = term.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2, duration: 0.8 }}
                    className="group relative"
                  >
                    {/* Glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-[#FFBF00]/20 to-[#00575A]/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />

                    {/* Card */}
                    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 h-full hover:border-[#FFBF00]/30 transition-all">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFBF00]/20 to-transparent border border-[#FFBF00]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Icon className="w-8 h-8 text-[#FFBF00]" />
                      </div>

                      {/* Category */}
                      <h3 className="text-2xl font-bold text-white mb-6 font-display">
                        {term.category}
                      </h3>

                      {/* Items */}
                      <ul className="space-y-4">
                        {term.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#FFBF00] flex-shrink-0 mt-0.5" />
                            <span className="text-slate-300 text-sm leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PORTFOLIO SECTION - Portfolio Companies */}
        {/* ================================================================== */}
        <section id="portfolio" className="relative py-32 bg-slate-900">
          <div className="absolute inset-0 grain-overlay opacity-30" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 bg-slate-950/50 backdrop-blur-xl border border-slate-800/50 rounded-full px-5 py-2 mb-6">
                <Award className="w-4 h-4 text-[#FFBF00]" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  {CONTENT.portfolio.sectionBadge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 font-display">
                {CONTENT.portfolio.sectionTitle}
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                {CONTENT.portfolio.subheadline}
              </p>
            </motion.div>

            {/* Portfolio Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {CONTENT.portfolio.companies.map((company, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.8 }}
                  className="group relative"
                >
                  {/* Glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-[#FFBF00]/30 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

                  {/* Card */}
                  <div className="relative bg-slate-950/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden hover:border-[#FFBF00]/30 transition-all">
                    {/* Profile Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={company.image}
                        alt={company.founderName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                      {/* Valuation Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-[#FFBF00]/20 backdrop-blur-xl border border-[#FFBF00]/30 rounded-full px-4 py-2">
                          <span className="text-[#FFBF00] font-bold text-sm">
                            {company.valuation}
                          </span>
                        </div>
                      </div>

                      {/* Region */}
                      <div className="absolute bottom-4 left-4">
                        <div className="flex items-center gap-2 bg-slate-950/50 backdrop-blur-xl border border-slate-800/50 rounded-full px-3 py-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300 font-medium text-xs">
                            {company.region}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-white mb-1 font-display">
                        {company.founderName}
                      </h3>
                      <p className="text-slate-400 text-sm mb-1">
                        {company.role}
                      </p>
                      <p className="text-[#FFBF00] text-sm font-bold mb-4">
                        {company.companyName}
                      </p>

                      {/* Metrics */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                        <div>
                          <div className="text-sm text-slate-500">Growth</div>
                          <div className="text-lg font-bold text-emerald-400">
                            {company.growth}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-500">ARR</div>
                          <div className="text-lg font-bold text-white">
                            {company.metric}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* THE MARKET SECTION - SEA Vision */}
        {/* ================================================================== */}
        <section id="market" className="relative py-32 bg-slate-950">
          <div className="absolute inset-0 grain-overlay opacity-50" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-full px-5 py-2 mb-6">
                <Network className="w-4 h-4 text-[#FFBF00]" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  {CONTENT.market.sectionBadge}
                </span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 font-display leading-tight">
                {CONTENT.market.sectionTitle}
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                {CONTENT.market.subheadline}
              </p>
            </motion.div>

            {/* Market Map Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-12 mb-12"
            >
              {/* Visual Map Representation */}
              <div className="relative h-[400px] mb-8">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1600&h=900&fit=crop&q=80"
                  alt="SEA Map"
                  className="w-full h-full object-cover rounded-2xl opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent rounded-2xl" />

                {/* Network Nodes Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full max-w-3xl">
                    {/* Connecting Lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-30">
                      <line x1="25%" y1="30%" x2="50%" y2="50%" stroke="#FFBF00" strokeWidth="2" strokeDasharray="5,5" />
                      <line x1="50%" y1="50%" x2="75%" y2="40%" stroke="#FFBF00" strokeWidth="2" strokeDasharray="5,5" />
                      <line x1="50%" y1="50%" x2="60%" y2="70%" stroke="#FFBF00" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>

                    {/* Node Points */}
                    <div className="absolute top-[30%] left-[25%] w-4 h-4 bg-[#FFBF00] rounded-full animate-pulse shadow-lg shadow-[#FFBF00]/50" />
                    <div className="absolute top-[50%] left-[50%] w-6 h-6 bg-[#FFBF00] rounded-full animate-pulse shadow-2xl shadow-[#FFBF00]/70" />
                    <div className="absolute top-[40%] left-[75%] w-4 h-4 bg-slate-500 rounded-full animate-pulse" />
                    <div className="absolute top-[70%] left-[60%] w-4 h-4 bg-slate-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Region Grid */}
              <div className="grid md:grid-cols-4 gap-6">
                {CONTENT.market.regions.map((region, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.6 }}
                    className="relative group"
                  >
                    <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-[#FFBF00]/30 transition-all">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-white font-display">
                          {region.name}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${region.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                            region.status === 'Expanding' ? 'bg-[#FFBF00]/20 text-[#FFBF00]' :
                              'bg-slate-700/20 text-slate-400'
                          }`}>
                          {region.status}
                        </span>
                      </div>

                      {/* Market Size */}
                      <div className="mb-2">
                        <div className="text-3xl font-black text-[#FFBF00] font-display">
                          {region.market}
                        </div>
                        <div className="text-sm text-slate-500">Market Size</div>
                      </div>

                      {/* Growth */}
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">
                          {region.growth}
                        </span>
                        <span className="text-slate-500 text-sm">YoY</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <motion.button
                onClick={handleJoin}
                className="group bg-[#FFBF00] text-slate-950 px-12 py-6 rounded-xl font-bold text-xl flex items-center justify-center gap-3 mx-auto shadow-2xl shadow-[#FFBF00]/30"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 30px 60px rgba(255, 191, 0, 0.4)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Globe className="w-6 h-6" />
                Mở Rộng Sang SEA Với Chúng Tôi
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* FOOTER - Premium Dark */}
        {/* ================================================================== */}
        <footer className="relative bg-slate-950 text-white pt-20 pb-12 border-t border-slate-800/50">
          <div className="absolute inset-0 grain-overlay opacity-30" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Main Footer Content */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#FFBF00] to-[#FF9500] rounded-lg flex items-center justify-center text-slate-950 font-display font-black text-2xl shadow-2xl shadow-[#FFBF00]/20">
                    W
                  </div>
                  <div>
                    <div className="font-display font-bold text-xl">
                      {CONTENT.footer.logo}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                      Venture Builder
                    </div>
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
                        className="w-12 h-12 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/50 hover:border-[#FFBF00]/30 flex items-center justify-center transition-all"
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
                <h3 className="font-display font-bold text-xl mb-4">
                  {CONTENT.footer.newsletter.title}
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder={CONTENT.footer.newsletter.placeholder}
                    className="flex-1 px-5 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:border-[#FFBF00]/50 transition-colors backdrop-blur-xl"
                  />
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-[#FFBF00] text-slate-950 font-bold shadow-lg shadow-[#FFBF00]/20"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-slate-500 text-sm pt-8 border-t border-slate-800/50">
              {CONTENT.footer.copyright}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
