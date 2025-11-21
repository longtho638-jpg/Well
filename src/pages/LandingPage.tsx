import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
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
  Target,
  Compass,
  Wrench,
  BarChart3
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
// CONTENT ARCHITECTURE - Visual-First Approach
// ============================================================================
const CONTENT = {
  hero: {
    badge: 'Nền tảng #1 cho người bán sức khỏe tại Việt Nam',
    headline: 'Kinh Doanh Sức Khỏe',
    headlineAccent: 'Thời Đại AI Agentic',
    subheadline: 'Nền tảng Social Commerce trang bị cho bạn một AI Coach riêng biệt, minh bạch hoa hồng, và công cụ thông minh để bạn bán sản phẩm wellness theo cách của mình.',
    primaryCta: 'Tham gia Founders Club',
    secondaryCta: 'Tìm hiểu thêm',
    stats: [
      { value: '2,000+', label: 'Người bán hoạt động' },
      { value: '₫50M+', label: 'Hoa hồng chi trả' },
      { value: '4.8/5⭐', label: 'Đánh giá trung bình' }
    ]
  },

  problems: {
    sectionTitle: 'Ba rào cản lớn nhất của người bán sức khỏe',
    items: [
      {
        title: 'Cô đơn',
        description: 'Bán hàng một mình, không có hỗ trợ, không biết tìm ai khi gặp khó khăn',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=600&fit=crop&q=80',
        icon: Target
      },
      {
        title: 'Mất phương hướng',
        description: 'Không biết bắt đầu từ đâu, chiến lược nào hiệu quả, sản phẩm nào phù hợp',
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop&q=80',
        icon: Compass
      },
      {
        title: 'Thiếu công cụ',
        description: 'Tính toán thuế thủ công, quản lý hoa hồng bằng Excel, mất thời gian và dễ sai sót',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&q=80',
        icon: Wrench
      }
    ]
  },

  solution: {
    sectionBadge: 'Giải pháp toàn diện',
    sectionTitle: 'WellNexus giải quyết tất cả',
    bentoItems: [
      {
        title: 'AI Coach 24/7',
        description: 'Trợ lý AI cá nhân hóa phân tích dữ liệu và đưa ra gợi ý chiến lược mỗi ngày',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop&q=80',
        size: 'large', // 2x2 on desktop
        icon: Bot,
        gradient: 'from-violet-500/20 to-purple-500/20'
      },
      {
        title: 'Minh bạch 100%',
        description: 'Xem chi tiết cấu trúc hoa hồng từng sản phẩm, không phí ẩn',
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&q=80',
        size: 'medium', // 1x1
        icon: ShieldCheck,
        gradient: 'from-emerald-500/20 to-teal-500/20'
      },
      {
        title: 'Cộng đồng hỗ trợ',
        description: 'Kết nối với 2,000+ người bán, học hỏi chiến lược thực chiến',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=80',
        size: 'medium', // 1x1
        icon: Users,
        gradient: 'from-blue-500/20 to-cyan-500/20'
      },
      {
        title: 'Thu nhập ổn định',
        description: 'Hoa hồng 15-25%, rút tiền linh hoạt, thuế tự động',
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop&q=80',
        size: 'small', // 1x0.5
        icon: TrendingUp,
        gradient: 'from-amber-500/20 to-yellow-500/20'
      }
    ]
  },

  pricing: {
    sectionBadge: 'The Elite Protocol',
    sectionTitle: 'Chỉ dành cho 50 Founders đầu tiên',
    badge: 'Chỉ còn 50 suất',
    title: 'Founders Club',
    price: 'Miễn phí',
    priceNote: 'Commission 15-25%',
    benefits: [
      'AI Business Coach cá nhân hóa',
      'Dashboard analytics real-time',
      'Tự động tính thuế TNCN',
      'Hỗ trợ ưu tiên 1-1',
      'Truy cập Product Catalog đầy đủ',
      'Community Learning Hub',
      'Webinar độc quyền hàng tháng',
      'Rank progression: Partner → Founder Club'
    ]
  },

  footer: {
    logo: 'WellNexus',
    tagline: 'Nền tảng Social Commerce cho phép bạn bán sản phẩm wellness với AI Coach, thuế tự động, và hoa hồng minh bạch.',
    newsletter: {
      title: 'Nhận hướng dẫn bán hàng',
      placeholder: 'Email của bạn'
    },
    social: {
      facebook: 'https://facebook.com/wellnexus',
      instagram: 'https://instagram.com/wellnexus',
      linkedin: 'https://linkedin.com/company/wellnexus'
    },
    copyright: '© 2025 WellNexus Technology JSC. All rights reserved.'
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useStore();

  const handleJoin = () => {
    login();
    navigate('/dashboard');
  };

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  return (
    <>
      {/* ====================================================================== */}
      {/* CUSTOM STYLES */}
      {/* ====================================================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .font-display {
          font-family: 'Manrope', sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        }

        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">

        {/* ================================================================== */}
        {/* STICKY HEADER WITH ANCHOR NAVIGATION */}
        {/* ================================================================== */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => smoothScrollTo('hero')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#00575A] to-[#003335] rounded-xl flex items-center justify-center text-[#FFBF00] font-display font-black text-xl shadow-lg">
                W
              </div>
              <span className="font-display font-bold text-xl text-slate-900 tracking-tight">
                {CONTENT.footer.logo}
              </span>
            </motion.div>

            {/* Navigation Menu - Anchor Links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Về chúng tôi', id: 'about' },
                { label: 'Tính năng', id: 'features' },
                { label: 'Cộng đồng', id: 'community' },
                { label: 'Bảng giá', id: 'pricing' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => smoothScrollTo(item.id)}
                  className="text-sm font-medium text-slate-600 hover:text-[#00575A] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Action Button */}
            <motion.button
              onClick={handleJoin}
              className="text-sm font-bold bg-[#00575A] hover:bg-[#003335] text-white px-6 py-2.5 rounded-xl transition-all shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0, 87, 90, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Đăng nhập
            </motion.button>
          </div>
        </motion.nav>

        {/* ================================================================== */}
        {/* HERO SECTION - FUTURISTIC WELLNESS */}
        {/* ================================================================== */}
        <section id="hero" className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
          {/* Background Visual */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00575A]/5 rounded-full blur-[200px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FFBF00]/10 rounded-full blur-[180px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-6 inline-flex">
                <div className="inline-flex items-center gap-2 bg-[#00575A]/5 border border-[#00575A]/10 rounded-full px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00575A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00575A]" />
                  </span>
                  <Sparkles className="w-4 h-4 text-[#00575A]" />
                  <span className="text-xs font-bold text-[#00575A] uppercase tracking-wider">
                    {CONTENT.hero.badge}
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="font-display font-black text-5xl md:text-6xl lg:text-7xl mb-6 leading-[0.95] tracking-tight text-slate-900"
              >
                {CONTENT.hero.headline}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00575A] via-[#004144] to-[#00575A]">
                  {CONTENT.hero.headlineAccent}
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed"
              >
                {CONTENT.hero.subheadline}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  onClick={handleJoin}
                  className="group bg-[#00575A] text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl"
                  whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0, 87, 90, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {CONTENT.hero.primaryCta}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  onClick={() => smoothScrollTo('about')}
                  className="px-8 py-4 rounded-xl font-bold text-lg text-slate-700 border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {CONTENT.hero.secondaryCta}
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={fadeInUp}
                className="mt-12 grid grid-cols-3 gap-6"
              >
                {CONTENT.hero.stats.map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-3xl lg:text-4xl font-black text-[#00575A] font-display">
                      {stat.value}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=1200&fit=crop&q=80"
                  alt="AI Technology"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#00575A]/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Bot className="w-6 h-6 text-[#FFBF00]" />
                      <span className="font-display font-bold text-white text-lg">AI Coach</span>
                    </div>
                    <p className="text-white/80 text-sm">
                      "Hôm nay bạn nên tập trung vào khách hàng quan tâm ANIMA 119. Tôi đã chuẩn bị 3 chiến lược cho bạn..."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PROBLEM SECTION - VISUAL CARDS */}
        {/* ================================================================== */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4 font-display">
                {CONTENT.problems.sectionTitle}
              </h2>
            </motion.div>

            {/* 3 Problem Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              {CONTENT.problems.items.map((problem, idx) => {
                const Icon = problem.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                    whileHover={{ y: -8 }}
                  >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={problem.image}
                        alt={problem.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="w-12 h-12 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 font-display">
                        {problem.title}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {problem.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* BENTO GRID SOLUTION SECTION - VISUAL-FIRST */}
        {/* ================================================================== */}
        <section id="features" className="py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-[#00575A]/5 border border-[#00575A]/10 rounded-full px-5 py-2 mb-6">
                <span className="text-sm font-bold text-[#00575A] uppercase tracking-wider">
                  {CONTENT.solution.sectionBadge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 font-display">
                {CONTENT.solution.sectionTitle}
              </h2>
            </motion.div>

            {/* Bento Grid - Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[300px]">
              {CONTENT.solution.bentoItems.map((item, idx) => {
                const Icon = item.icon;
                const gridClass =
                  item.size === 'large' ? 'md:col-span-2 md:row-span-2' :
                  item.size === 'medium' ? 'md:col-span-2 lg:col-span-2' :
                  'md:col-span-2 lg:col-span-2';

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all ${gridClass}`}
                    whileHover={{ y: -8 }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} backdrop-blur-[2px]`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 h-full p-8 flex flex-col justify-end">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 font-display">
                        {item.title}
                      </h3>
                      <p className="text-white/90 text-base leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* COMMUNITY SECTION (Placeholder for testimonials) */}
        {/* ================================================================== */}
        <section id="community" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 font-display">
                Cộng đồng 2,000+ người bán
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Học hỏi từ những người thực sự kinh doanh sản phẩm wellness và đạt kết quả
              </p>
            </motion.div>

            {/* Community Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-2xl h-[500px]"
            >
              <img
                src="https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=1600&h=900&fit=crop&q=80"
                alt="Community"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00575A]/90 via-[#00575A]/40 to-transparent" />
              <div className="absolute bottom-12 left-12 right-12">
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { value: '₫18M', label: 'Hoa hồng TB/người' },
                    { value: '47', label: 'Đơn hàng TB/tháng' },
                    { value: '92%', label: 'Tỷ lệ thành công' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                      <div className="text-4xl font-black text-[#FFBF00] font-display mb-2">
                        {stat.value}
                      </div>
                      <div className="text-white/80 text-sm">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PRICING SECTION - THE ELITE PROTOCOL */}
        {/* ================================================================== */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-[#FFBF00]/10 border border-[#FFBF00]/20 rounded-full px-5 py-2 mb-6">
                <Crown className="w-4 h-4 text-[#FFBF00]" />
                <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider">
                  {CONTENT.pricing.sectionBadge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 font-display">
                {CONTENT.pricing.sectionTitle}
              </h2>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-[#00575A] to-[#003335] rounded-3xl p-10 shadow-2xl overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 noise-texture opacity-20" />

              {/* Badge */}
              <div className="relative z-10 inline-flex items-center gap-2 bg-[#FFBF00] text-[#00575A] px-4 py-2 rounded-full mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00575A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00575A]" />
                </span>
                <span className="text-sm font-bold uppercase tracking-wider">
                  {CONTENT.pricing.badge}
                </span>
              </div>

              {/* Title & Price */}
              <div className="relative z-10 mb-8">
                <div className="flex items-baseline gap-4 mb-2">
                  <h3 className="text-4xl font-black text-white font-display">
                    {CONTENT.pricing.title}
                  </h3>
                  <Crown className="w-8 h-8 text-[#FFBF00]" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-[#FFBF00] font-display">
                    {CONTENT.pricing.price}
                  </span>
                  <span className="text-white/60 text-lg">
                    {CONTENT.pricing.priceNote}
                  </span>
                </div>
              </div>

              {/* Benefits */}
              <div className="relative z-10 space-y-4 mb-10">
                {CONTENT.pricing.benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#FFBF00] flex-shrink-0" />
                    <span className="text-white/90 text-lg">
                      {benefit}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                onClick={handleJoin}
                className="relative z-10 w-full bg-[#FFBF00] text-[#00575A] px-8 py-5 rounded-xl font-black text-xl shadow-xl flex items-center justify-center gap-3 font-display"
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 30px 60px rgba(255, 191, 0, 0.5)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                Tham gia ngay
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* FOOTER */}
        {/* ================================================================== */}
        <footer className="bg-[#00575A] text-white pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {/* Main Footer Content */}
            <div className="grid md:grid-cols-2 gap-12 mb-16">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#FFBF00] rounded-xl flex items-center justify-center text-[#00575A] font-display font-black text-xl">
                    W
                  </div>
                  <span className="font-display font-bold text-xl">
                    {CONTENT.footer.logo}
                  </span>
                </div>
                <p className="text-white/70 leading-relaxed mb-6 max-w-md">
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
                        className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all"
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
                    className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#FFBF00]/50 transition-colors"
                  />
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-[#FFBF00] text-[#00575A] font-bold shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-white/50 text-sm pt-8 border-t border-white/10">
              {CONTENT.footer.copyright}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
