import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  Bot,
  Lock,
  TrendingUp,
  BarChart3,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Sparkles,
  Globe,
  Crown,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

// ============================================================================
// CMS-READY CONTENT ARCHITECTURE
// ============================================================================
// All text content centralized for easy API integration
const LANDING_CONTENT = {
  header: {
    logo: 'WellNexus',
    navigation: [
      { label: 'Về chúng tôi', href: '#about' },
      { label: 'Tính năng', href: '#features' },
      { label: 'Cộng đồng', href: '#community' },
      { label: 'Bảng giá', href: '#pricing' }
    ],
    cta: {
      login: 'Đăng nhập',
      signup: 'Tham gia ngay'
    }
  },

  hero: {
    badge: 'Đang mở tuyển 200 Partner đầu tiên',
    headline: 'Kinh Doanh Sức Khỏe',
    headlineAccent: 'Thời Đại AI Agentic',
    subheadline: 'Nền tảng Social Commerce trang bị cho bạn một AI Coach riêng biệt, sản phẩm Minh bạch nguồn gốc và Quy trình bán hàng tự động hóa.',
    primaryCta: 'Truy cập Dashboard Demo',
    secondaryCta: 'Tìm hiểu mô hình'
  },

  features: {
    sectionBadge: 'Tại sao chọn WellNexus?',
    sectionTitle: 'Công cụ mạnh mẽ cho người tiên phong',
    items: [
      {
        title: 'Agentic AI Coach',
        description: 'Không còn cô đơn. AI phân tích dữ liệu bán hàng và gợi ý chiến lược mỗi ngày.',
        icon: 'bot'
      },
      {
        title: 'Minh Bạch Tuyệt Đối',
        description: 'Truy xuất nguồn gốc sản phẩm bằng Blockchain. Tự động khấu trừ thuế TNCN đúng luật.',
        icon: 'shield'
      },
      {
        title: 'Cộng Đồng Hỗ Trợ',
        description: 'Học hỏi từ những Leader hàng đầu. Gamification biến việc bán hàng thành trò chơi thú vị.',
        icon: 'users'
      },
      {
        title: 'Phân Tích Thông Minh',
        description: 'Dashboard theo dõi real-time với insights từ AI để tối ưu doanh thu.',
        icon: 'chart'
      },
      {
        title: 'Tăng Trưởng Bền Vững',
        description: 'Hệ thống MLM công bằng với hoa hồng minh bạch đến từng giao dịch.',
        icon: 'trending'
      },
      {
        title: 'Founder Club Elite',
        description: 'Chia sẻ 2% doanh thu toàn cầu khi đạt team volume 100 triệu VND.',
        icon: 'crown'
      }
    ]
  },

  testimonials: {
    sectionBadge: 'Câu chuyện thành công',
    sectionTitle: 'Những người tiên phong đã làm được',
    items: [
      {
        quote: 'Chỉ sau 2 tháng, tôi đã đạt rank Partner với thu nhập ổn định 15 triệu/tháng. AI Coach như một mentor 24/7.',
        author: 'Lan Nguyễn',
        role: 'Partner tại Hà Nội',
        avatar: '👩‍💼'
      },
      {
        quote: 'WellNexus giúp tôi xây dựng team 50 người mà không phải lo về quản lý hoa hồng. Hệ thống lo hết!',
        author: 'Minh Trần',
        role: 'Founder Club Member',
        avatar: '👨‍💼'
      }
    ]
  },

  cta: {
    badge: 'Quyền lợi giới hạn',
    headline: 'Sẵn sàng bắt đầu hành trình?',
    subheadline: 'Tham gia ngay hôm nay để nhận gói quà tặng Founder trị giá 3.000.000đ và quyền lợi chia sẻ 2% doanh thu toàn cầu.',
    buttonText: 'Đăng Ký Ngay'
  },

  footer: {
    tagline: 'Nền tảng Social Commerce thế hệ mới cho thị trường Việt Nam',
    newsletter: {
      title: 'Nhận tin tức mới nhất',
      placeholder: 'Email của bạn',
      buttonText: 'Đăng ký'
    },
    columns: {
      product: {
        title: 'Sản Phẩm',
        links: ['Dashboard', 'AI Coach', 'Marketplace', 'Wallet', 'Analytics']
      },
      company: {
        title: 'Công Ty',
        links: ['Về chúng tôi', 'Blog', 'Careers', 'Press Kit', 'Partners']
      },
      resources: {
        title: 'Tài Nguyên',
        links: ['Documentation', 'Tutorials', 'Webinars', 'Community', 'Success Stories']
      },
      legal: {
        title: 'Pháp Lý',
        links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Disclaimer']
      }
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  // Icon mapping
  const iconMap = {
    bot: Bot,
    shield: ShieldCheck,
    users: Users,
    chart: BarChart3,
    trending: TrendingUp,
    crown: Crown
  };

  return (
    <>
      {/* ====================================================================== */}
      {/* CUSTOM FONTS IMPORT */}
      {/* ====================================================================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .font-heading {
          font-family: 'Outfit', sans-serif;
        }

        .font-body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Noise Texture */
        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        }

        /* Grid Pattern */
        .grid-pattern {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="min-h-screen bg-[#00575A] font-body text-gray-900 overflow-x-hidden">

        {/* ================================================================== */}
        {/* STICKY GLASSMORPHIC HEADER */}
        {/* ================================================================== */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/5 border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFBF00] to-yellow-500 rounded-xl flex items-center justify-center text-[#00575A] font-heading font-black text-xl shadow-lg shadow-[#FFBF00]/20">
                W
              </div>
              <span className="font-heading font-bold text-xl text-white tracking-tight">
                {LANDING_CONTENT.header.logo}
              </span>
            </motion.div>

            {/* Navigation Menu - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              {LANDING_CONTENT.header.navigation.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors font-body"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleJoin}
                className="hidden md:block text-sm font-semibold text-white/80 hover:text-white px-5 py-2.5 rounded-xl transition-colors font-body"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {LANDING_CONTENT.header.cta.login}
              </motion.button>

              <motion.button
                onClick={handleJoin}
                className="text-sm font-bold bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#FFBF00]/20 font-body"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 20px 40px rgba(255, 191, 0, 0.3)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                {LANDING_CONTENT.header.cta.signup}
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {/* ================================================================== */}
        {/* HERO SECTION - WORLD CLASS */}
        {/* ================================================================== */}
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0 z-0">
            {/* Noise Texture */}
            <div className="absolute inset-0 noise-texture opacity-50" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 grid-pattern opacity-30" />

            {/* Gradient Orbs */}
            <motion.div
              animate={{
                x: [0, 50, 0],
                y: [0, 30, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 right-[10%] w-[600px] h-[600px] bg-[#FFBF00] opacity-10 rounded-full blur-[150px]"
            />

            <motion.div
              animate={{
                x: [0, -30, 0],
                y: [0, 50, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-0 left-[5%] w-[500px] h-[500px] bg-cyan-400 opacity-8 rounded-full blur-[130px]"
            />

            <motion.div
              animate={{
                x: [0, 40, 0],
                y: [0, -40, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4
              }}
              className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-purple-500 opacity-6 rounded-full blur-[140px]"
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-5xl mx-auto"
            >
              {/* Badge */}
              <motion.div variants={itemVariants} className="mb-8 inline-flex">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBF00] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFBF00]" />
                  </span>
                  <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                  <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider font-heading">
                    {LANDING_CONTENT.hero.badge}
                  </span>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={itemVariants}
                className="font-heading font-black text-6xl md:text-7xl lg:text-8xl mb-6 leading-[0.95] tracking-tighter text-white"
              >
                {LANDING_CONTENT.hero.headline}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] via-yellow-300 to-[#FFBF00] animate-gradient">
                  {LANDING_CONTENT.hero.headlineAccent}
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl lg:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed font-light font-body"
              >
                {LANDING_CONTENT.hero.subheadline}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.button
                  onClick={handleJoin}
                  className="group relative bg-[#FFBF00] text-[#00575A] px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl shadow-[#FFBF00]/30 font-heading overflow-hidden"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 25px 60px rgba(255, 191, 0, 0.5)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">{LANDING_CONTENT.hero.primaryCta}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-200%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  />
                </motion.button>

                <motion.button
                  className="group px-10 py-5 rounded-2xl font-bold text-lg text-white border-2 border-white/20 hover:border-white/40 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 font-heading"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-5 h-5" />
                  {LANDING_CONTENT.hero.secondaryCta}
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
              >
                {[
                  { value: '200+', label: 'Active Partners' },
                  { value: '15M+', label: 'VND Paid Out' },
                  { value: '98%', label: 'Satisfaction' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-3xl md:text-4xl font-black text-[#FFBF00] font-heading mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/60 font-medium font-body">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* BENTO GRID FEATURES SECTION */}
        {/* ================================================================== */}
        <section className="relative py-32 bg-gradient-to-b from-[#00575A] via-[#004144] to-[#003335]">
          {/* Background */}
          <div className="absolute inset-0 noise-texture opacity-40" />
          <div className="absolute inset-0 grid-pattern opacity-20" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center gap-2 bg-[#FFBF00]/10 backdrop-blur-md border border-[#FFBF00]/20 rounded-full px-5 py-2 mb-6">
                <Globe className="w-4 h-4 text-[#FFBF00]" />
                <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider font-heading">
                  {LANDING_CONTENT.features.sectionBadge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 font-heading tracking-tight">
                {LANDING_CONTENT.features.sectionTitle}
              </h2>
            </motion.div>

            {/* Bento Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {LANDING_CONTENT.features.items.map((feature, idx) => {
                const Icon = iconMap[feature.icon as keyof typeof iconMap];
                const isLarge = idx === 0 || idx === 3; // First and fourth items are larger

                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className={`
                      group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8
                      hover:bg-white/10 hover:border-white/20 transition-all duration-500
                      ${isLarge ? 'md:col-span-2 lg:col-span-1' : ''}
                    `}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {/* Glow Effect on Hover */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#FFBF00]/0 via-[#FFBF00]/0 to-[#FFBF00]/0 group-hover:from-[#FFBF00]/10 group-hover:via-[#FFBF00]/5 group-hover:to-transparent transition-all duration-500" />

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFBF00]/20 to-[#FFBF00]/5 backdrop-blur-sm border border-[#FFBF00]/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <Icon className="w-8 h-8 text-[#FFBF00]" />
                      </div>

                      {/* Content */}
                      <h3 className="text-2xl font-bold text-white mb-3 font-heading">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 leading-relaxed font-body">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* TESTIMONIALS SECTION */}
        {/* ================================================================== */}
        <section className="relative py-32 bg-[#003335]">
          <div className="absolute inset-0 noise-texture opacity-30" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 mb-6">
                <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider font-heading">
                  {LANDING_CONTENT.testimonials.sectionBadge}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white font-heading">
                {LANDING_CONTENT.testimonials.sectionTitle}
              </h2>
            </motion.div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {LANDING_CONTENT.testimonials.items.map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-5xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-bold text-white text-lg font-heading">{testimonial.author}</div>
                      <div className="text-white/60 text-sm font-body">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-white/80 leading-relaxed italic font-body text-lg">
                    "{testimonial.quote}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* CTA SECTION */}
        {/* ================================================================== */}
        <section className="relative py-32 bg-gradient-to-b from-[#003335] to-[#00575A]">
          <div className="absolute inset-0 noise-texture opacity-40" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-[3rem] p-12 lg:p-16 text-center overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFBF00]/10 rounded-full blur-[150px]" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#FFBF00]/10 backdrop-blur-md border border-[#FFBF00]/20 rounded-full px-5 py-2 mb-6">
                  <Lock className="w-4 h-4 text-[#FFBF00]" />
                  <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider font-heading">
                    {LANDING_CONTENT.cta.badge}
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 font-heading tracking-tight">
                  {LANDING_CONTENT.cta.headline}
                </h2>

                <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto font-body leading-relaxed">
                  {LANDING_CONTENT.cta.subheadline}
                </p>

                <motion.button
                  onClick={handleJoin}
                  className="bg-[#FFBF00] text-[#00575A] px-12 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-[#FFBF00]/30 font-heading inline-flex items-center gap-3"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 30px 70px rgba(255, 191, 0, 0.5)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {LANDING_CONTENT.cta.buttonText}
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* FAT FOOTER - TECH STYLE */}
        {/* ================================================================== */}
        <footer className="relative bg-[#001A1C] text-white pt-24 pb-12">
          <div className="absolute inset-0 noise-texture opacity-20" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
              {/* Brand Column */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFBF00] to-yellow-500 rounded-xl flex items-center justify-center text-[#00575A] font-heading font-black text-xl">
                    W
                  </div>
                  <span className="font-heading font-bold text-xl">
                    {LANDING_CONTENT.header.logo}
                  </span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-6 font-body">
                  {LANDING_CONTENT.footer.tagline}
                </p>

                {/* Social Links */}
                <div className="flex items-center gap-3">
                  <motion.a
                    href={LANDING_CONTENT.footer.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Facebook className="w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href={LANDING_CONTENT.footer.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Instagram className="w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href={LANDING_CONTENT.footer.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Linkedin className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>

              {/* Product Links */}
              <div>
                <h3 className="font-heading font-bold text-white mb-4">
                  {LANDING_CONTENT.footer.columns.product.title}
                </h3>
                <ul className="space-y-3">
                  {LANDING_CONTENT.footer.columns.product.links.map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-body">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h3 className="font-heading font-bold text-white mb-4">
                  {LANDING_CONTENT.footer.columns.company.title}
                </h3>
                <ul className="space-y-3">
                  {LANDING_CONTENT.footer.columns.company.links.map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-body">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources Links */}
              <div>
                <h3 className="font-heading font-bold text-white mb-4">
                  {LANDING_CONTENT.footer.columns.resources.title}
                </h3>
                <ul className="space-y-3">
                  {LANDING_CONTENT.footer.columns.resources.links.map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-body">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h3 className="font-heading font-bold text-white mb-4">
                  {LANDING_CONTENT.footer.columns.legal.title}
                </h3>
                <ul className="space-y-3">
                  {LANDING_CONTENT.footer.columns.legal.links.map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-body">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="border-t border-white/10 pt-12 pb-8">
              <div className="max-w-md mx-auto text-center">
                <h3 className="font-heading font-bold text-xl text-white mb-3">
                  {LANDING_CONTENT.footer.newsletter.title}
                </h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder={LANDING_CONTENT.footer.newsletter.placeholder}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#FFBF00]/50 font-body"
                  />
                  <motion.button
                    className="px-6 py-3 rounded-xl bg-[#FFBF00] text-[#00575A] font-bold font-body"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center text-white/40 text-sm font-body">
              {LANDING_CONTENT.footer.copyright}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
