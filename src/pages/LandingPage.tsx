import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-scroll';
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  Bot,
  TrendingUp,
  BarChart3,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  Sparkles,
  Crown,
  CheckCircle2,
  Globe,
  Lightbulb,
  Target,
  Heart,
  Wallet,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useStore();

  const handleJoin = () => {
    login();
    navigate('/dashboard');
  };

  return (
    <>
      {/* Custom Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap');

        .font-manrope {
          font-family: 'Manrope', sans-serif;
        }

        .font-jakarta {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        html {
          scroll-behavior: smooth;
        }

        .noise-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
        }

        .gradient-text {
          background: linear-gradient(135deg, #FFBF00 0%, #FFD966 50%, #FFBF00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glow-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glow-hover:hover {
          box-shadow: 0 20px 60px rgba(255, 191, 0, 0.3);
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">

        {/* ================================================================== */}
        {/* STICKY NAVIGATION BAR */}
        {/* ================================================================== */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 w-full z-50 backdrop-blur-2xl bg-white/80 border-b border-slate-200 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-11 h-11 bg-gradient-to-br from-[#00575A] to-teal-700 rounded-2xl flex items-center justify-center text-white font-manrope font-black text-xl shadow-xl">
                W
              </div>
              <span className="font-manrope font-extrabold text-2xl text-slate-900 tracking-tight">
                WellNexus
              </span>
            </motion.div>

            {/* Navigation Menu - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="about"
                smooth={true}
                duration={800}
                offset={-80}
                className="text-sm font-semibold text-slate-700 hover:text-[#00575A] transition-colors cursor-pointer font-jakarta"
              >
                Về chúng tôi
              </Link>
              <Link
                to="features"
                smooth={true}
                duration={800}
                offset={-80}
                className="text-sm font-semibold text-slate-700 hover:text-[#00575A] transition-colors cursor-pointer font-jakarta"
              >
                Tính năng
              </Link>
              <Link
                to="community"
                smooth={true}
                duration={800}
                offset={-80}
                className="text-sm font-semibold text-slate-700 hover:text-[#00575A] transition-colors cursor-pointer font-jakarta"
              >
                Cộng đồng
              </Link>
              <Link
                to="pricing"
                smooth={true}
                duration={800}
                offset={-80}
                className="text-sm font-semibold text-slate-700 hover:text-[#00575A] transition-colors cursor-pointer font-jakarta"
              >
                Bảng giá
              </Link>
            </div>

            {/* Action Button */}
            <motion.button
              onClick={handleJoin}
              className="px-6 py-3 bg-gradient-to-r from-[#00575A] to-teal-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all font-jakarta"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Đăng nhập
            </motion.button>
          </div>
        </motion.nav>

        {/* ================================================================== */}
        {/* HERO SECTION - Visual First */}
        {/* ================================================================== */}
        <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50">
          {/* Background Effects */}
          <div className="absolute inset-0 noise-texture opacity-40" />

          {/* Floating Orbs */}
          <motion.div
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-[#FFBF00]/20 to-yellow-300/20 rounded-full blur-3xl"
          />

          <motion.div
            animate={{
              y: [0, 40, 0],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-br from-[#00575A]/15 to-teal-400/15 rounded-full blur-3xl"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-[#FFBF00]/10 border border-[#FFBF00]/30 rounded-full px-5 py-2 mb-8"
                >
                  <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                  <span className="text-sm font-bold text-[#00575A] uppercase tracking-wider font-jakarta">
                    Powered by AI Agentic
                  </span>
                </motion.div>

                <h1 className="font-manrope font-black text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-6 leading-[0.95] tracking-tight text-slate-900">
                  Kinh Doanh Sức Khỏe{' '}
                  <span className="gradient-text">
                    Thời Đại AI Agentic
                  </span>
                </h1>

                <p className="text-xl text-slate-600 mb-10 leading-relaxed font-jakarta max-w-xl">
                  Nền tảng Social Commerce trang bị cho bạn một{' '}
                  <span className="font-bold text-[#00575A]">AI Coach riêng biệt</span>,{' '}
                  công cụ thông minh, và cộng đồng hỗ trợ để xây dựng sự nghiệp kinh doanh wellness.
                </p>

                <motion.button
                  onClick={handleJoin}
                  className="group relative bg-gradient-to-r from-[#FFBF00] to-yellow-400 text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl font-jakarta overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">Tham gia Founders Club</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />

                  {/* Pulse Animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-[#FFBF00]"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </motion.button>

                {/* Stats */}
                <div className="mt-12 grid grid-cols-3 gap-6">
                  {[
                    { value: '2K+', label: 'Members' },
                    { value: '₫50M+', label: 'Payouts' },
                    { value: '4.8⭐', label: 'Rating' }
                  ].map((stat, idx) => (
                    <div key={idx}>
                      <div className="text-3xl font-black text-[#00575A] font-manrope">{stat.value}</div>
                      <div className="text-sm text-slate-500 font-jakarta">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right: Hero Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://source.unsplash.com/800x900/?abstract,3d,technology,wellness"
                    alt="AI Technology"
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#00575A]/60 via-transparent to-[#FFBF00]/40" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PROBLEM SECTION - Visual Cards (Flip Cards) */}
        {/* ================================================================== */}
        <section id="about" className="relative py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="font-manrope font-black text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-4">
                Bạn Đang Gặp Phải Vấn Đề Này?
              </h2>
              <p className="text-xl text-slate-600 font-jakarta">
                Chúng tôi hiểu rõ thách thức của người bán hàng độc lập
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Cô Đơn',
                  description: 'Không có cộng đồng hỗ trợ, tự mình vật lộn với khó khăn',
                  image: 'https://source.unsplash.com/600x400/?lonely,dark,person',
                  icon: Heart
                },
                {
                  title: 'Mất Phương Hướng',
                  description: 'Không biết chiến lược nào hiệu quả, lãng phí thời gian',
                  image: 'https://source.unsplash.com/600x400/?maze,lost,confused',
                  icon: Target
                },
                {
                  title: 'Thiếu Công Cụ',
                  description: 'Dùng công cụ thủ công lỗi thời, không có AI hỗ trợ',
                  image: 'https://source.unsplash.com/600x400/?old,tools,vintage',
                  icon: Lightbulb
                }
              ].map((problem, idx) => {
                const Icon = problem.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
                    whileHover={{ y: -10 }}
                  >
                    <div className="relative h-64">
                      <img
                        src={problem.image}
                        alt={problem.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <Icon className="w-10 h-10 mb-3 text-[#FFBF00]" />
                      <h3 className="font-manrope font-bold text-2xl mb-2">{problem.title}</h3>
                      <p className="text-white/80 font-jakarta text-sm">{problem.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* SOLUTION SECTION - BENTO GRID (CRITICAL) */}
        {/* ================================================================== */}
        <section id="features" className="relative py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-manrope font-black text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-4">
                Giải Pháp Toàn Diện
              </h2>
              <p className="text-xl text-slate-600 font-jakarta">
                Công nghệ AI tiên tiến kết hợp cộng đồng mạnh mẽ
              </p>
            </motion.div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Large Card 1 - AI Coach */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="lg:col-span-2 lg:row-span-2 glass-card rounded-3xl overflow-hidden shadow-xl glow-hover relative group"
              >
                <div className="absolute inset-0">
                  <img
                    src="https://source.unsplash.com/800x800/?artificial-intelligence,robot,future"
                    alt="AI Coach"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00575A]/80 to-teal-900/80" />
                </div>

                <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                  <Bot className="w-16 h-16 text-[#FFBF00] mb-4" />
                  <h3 className="font-manrope font-black text-4xl text-white mb-3">AI Coach</h3>
                  <p className="text-white/90 text-lg font-jakarta">
                    Trợ lý AI cá nhân hóa phân tích dữ liệu bán hàng và đưa ra gợi ý chiến lược thông minh 24/7
                  </p>
                </div>
              </motion.div>

              {/* Medium Card 2 - Minh Bạch */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="lg:row-span-1 glass-card rounded-3xl overflow-hidden shadow-xl glow-hover relative group"
              >
                <div className="absolute inset-0">
                  <img
                    src="https://source.unsplash.com/600x400/?blockchain,transparency,qrcode"
                    alt="Transparency"
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFBF00]/70 to-yellow-600/70" />
                </div>

                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                  <ShieldCheck className="w-12 h-12 text-slate-900 mb-3" />
                  <h3 className="font-manrope font-black text-2xl text-slate-900 mb-2">100% Minh Bạch</h3>
                  <p className="text-slate-800 font-jakarta text-sm">
                    Hoa hồng rõ ràng, thuế tự động
                  </p>
                </div>
              </motion.div>

              {/* Medium Card 3 - Cộng Đồng */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="lg:row-span-1 glass-card rounded-3xl overflow-hidden shadow-xl glow-hover relative group"
              >
                <div className="absolute inset-0">
                  <img
                    src="https://source.unsplash.com/600x400/?community,happy,people,team"
                    alt="Community"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-teal-800/80" />
                </div>

                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                  <Users className="w-12 h-12 text-[#FFBF00] mb-3" />
                  <h3 className="font-manrope font-black text-2xl text-white mb-2">Cộng Đồng Mạnh</h3>
                  <p className="text-white/90 font-jakarta text-sm">
                    2,000+ thành viên hỗ trợ lẫn nhau
                  </p>
                </div>
              </motion.div>

              {/* Small Card 4 - Thu Nhập */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 glass-card rounded-3xl overflow-hidden shadow-xl glow-hover relative group"
              >
                <div className="absolute inset-0">
                  <img
                    src="https://source.unsplash.com/800x400/?growth,chart,success,money"
                    alt="Income"
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80" />
                </div>

                <div className="relative z-10 p-6 h-full flex items-center justify-between">
                  <div>
                    <Wallet className="w-12 h-12 text-[#FFBF00] mb-3" />
                    <h3 className="font-manrope font-black text-3xl text-white mb-2">Thu Nhập Thụ Động</h3>
                    <p className="text-white/80 font-jakarta">
                      Hoa hồng đến 25% • Không cần vốn đầu tư
                    </p>
                  </div>
                  <TrendingUp className="w-24 h-24 text-[#FFBF00]/20" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* COMMUNITY SECTION */}
        {/* ================================================================== */}
        <section id="community" className="relative py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-manrope font-black text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-4">
                Câu Chuyện Thành Công
              </h2>
              <p className="text-xl text-slate-600 font-jakarta">
                Từ người dùng thực tế của chúng tôi
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  quote: 'Tôi bắt đầu bán sản phẩm ANIMA 119 vì mình đã dùng và thấy hiệu quả. Trong 3 tháng đầu, tôi kiếm được ₫18 triệu hoa hồng từ 47 đơn hàng. AI Coach giúp tôi hiểu khách hàng nào quan tâm đến sản phẩm nào.',
                  author: 'Lan Nguyễn',
                  role: 'Wellness Advocate, Hà Nội',
                  avatar: '👩‍💼',
                  metrics: '3 tháng • 47 đơn • ₫18M'
                },
                {
                  quote: 'Tôi từng hoài nghi về bán hàng online. Nhưng WellNexus khác - không cần ép bạn bè mua, không cần tồn kho. Tôi chỉ chia sẻ sản phẩm tôi tin tưởng. Giờ đây, đây là thu nhập phụ ổn định ₫12-15 triệu/tháng.',
                  author: 'Minh Trần',
                  role: 'Former Office Worker, TP.HCM',
                  avatar: '👨‍💼',
                  metrics: '6 tháng • 89 đơn • ₫72M'
                }
              ].map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="glass-card rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-5xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-manrope font-bold text-xl text-slate-900">{testimonial.author}</div>
                      <div className="text-slate-600 text-sm font-jakarta">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed italic text-lg font-jakarta mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-2 text-sm text-[#00575A] font-semibold font-jakarta">
                    <CheckCircle2 className="w-5 h-5 text-[#FFBF00]" />
                    <span>{testimonial.metrics}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* THE ELITE PROTOCOL (PRICING) */}
        {/* ================================================================== */}
        <section id="pricing" className="relative py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-manrope font-black text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-4">
                The Elite Protocol
              </h2>
              <p className="text-xl text-slate-600 font-jakarta">
                Gia nhập đội ngũ Founders Club độc quyền
              </p>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00575A] via-teal-700 to-teal-900" />

              <div className="relative z-10 p-12">
                {/* Badge */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-manrope font-black text-4xl text-white mb-2">Founders Club</h3>
                    <p className="text-white/80 text-lg font-jakarta">Đặc quyền trọn đời</p>
                  </div>
                  <div className="bg-[#FFBF00] text-slate-900 px-4 py-2 rounded-full font-bold text-sm font-jakarta">
                    Chỉ còn 50 suất
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-4 mb-10">
                  {[
                    'AI Coach Premium với phân tích dữ liệu nâng cao',
                    'Hoa hồng cao nhất 25% trên mọi sản phẩm',
                    'Truy cập sớm vào sản phẩm mới độc quyền',
                    'Đào tạo 1-on-1 với Top Performers',
                    'Công cụ thuế tự động & báo cáo chi tiết',
                    'Hỗ trợ ưu tiên 24/7 qua Telegram VIP',
                    'Dashboard phân tích thời gian thực',
                    'Cộng đồng Private Forum chỉ dành cho Founders'
                  ].map((benefit, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-6 h-6 text-[#FFBF00] flex-shrink-0 mt-0.5" />
                      <span className="text-white text-lg font-jakarta">{benefit}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  onClick={handleJoin}
                  className="w-full bg-gradient-to-r from-[#FFBF00] to-yellow-400 text-slate-900 py-5 rounded-2xl font-black text-xl shadow-2xl font-manrope flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Crown className="w-6 h-6" />
                  Tham Gia Ngay
                  <ArrowRight className="w-6 h-6" />
                </motion.button>

                <p className="text-center text-white/60 text-sm mt-6 font-jakarta">
                  Miễn phí tham gia • Chỉ trả hoa hồng khi bán được hàng
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* FOOTER - Clean & Simple */}
        {/* ================================================================== */}
        <footer className="relative bg-slate-900 text-white pt-20 pb-10">
          <div className="absolute inset-0 noise-texture opacity-10" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFBF00] to-yellow-500 rounded-2xl flex items-center justify-center text-slate-900 font-manrope font-black text-xl">
                    W
                  </div>
                  <span className="font-manrope font-bold text-xl">WellNexus</span>
                </div>
                <p className="text-white/60 text-sm font-jakarta mb-6">
                  Nền tảng Social Commerce cho người bán wellness với AI Coach và công cụ thông minh.
                </p>

                {/* Social */}
                <div className="flex gap-3">
                  <motion.a
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    <Facebook className="w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    <Instagram className="w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href="#"
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    <Linkedin className="w-5 h-5" />
                  </motion.a>
                </div>
              </div>

              {/* Links Columns */}
              <div>
                <h3 className="font-manrope font-bold text-white mb-4">Nền Tảng</h3>
                <ul className="space-y-3">
                  {['Dashboard', 'AI Coach', 'Products', 'Analytics'].map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-jakarta">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-manrope font-bold text-white mb-4">Công Ty</h3>
                <ul className="space-y-3">
                  {['Về chúng tôi', 'Blog', 'Careers', 'Press Kit'].map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-jakarta">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-manrope font-bold text-white mb-4">Pháp Lý</h3>
                <ul className="space-y-3">
                  {['Privacy', 'Terms', 'Security', 'Compliance'].map((link, idx) => (
                    <li key={idx}>
                      <a href="#" className="text-white/60 hover:text-white transition-colors text-sm font-jakarta">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/10 pt-8 text-center">
              <p className="text-white/40 text-sm font-jakarta">
                © 2025 WellNexus Technology JSC. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
