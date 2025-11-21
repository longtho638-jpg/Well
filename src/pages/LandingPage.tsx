import React from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  ShieldCheck,
  Users,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Heart,
  Frown,
  Wrench,
  Award,
  Zap,
  Globe,
  QrCode,
  UsersRound,
  Wallet
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
    <div className="min-h-screen bg-slate-50 font-['Inter'] text-gray-900 overflow-x-hidden">

      {/* NAVBAR */}
      <Navbar onJoin={handleJoin} />

      {/* HERO SECTION */}
      <HeroSection onJoin={handleJoin} />

      {/* SOCIAL PROOF TICKER */}
      <SocialProofTicker />

      {/* THE PROBLEM */}
      <ProblemSection />

      {/* THE SOLUTION - BENTO GRID */}
      <SolutionBentoGrid />

      {/* THE OFFER */}
      <OfferSection />

      {/* FINAL CTA */}
      <FinalCTA onJoin={handleJoin} />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

function Navbar({ onJoin }: { onJoin: () => void }) {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50 h-20 flex items-center justify-between px-6 lg:px-16">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#00575A] to-[#003F42] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl">
          W
        </div>
        <span className="font-black text-2xl bg-gradient-to-r from-[#00575A] to-[#003F42] bg-clip-text text-transparent tracking-tight">
          WellNexus
        </span>
      </div>
      <div className="flex items-center gap-6">
        <button className="text-sm font-semibold text-gray-600 hover:text-[#00575A] hidden md:block transition-colors">
          Về chúng tôi
        </button>
        <button
          onClick={onJoin}
          className="text-sm font-bold bg-[#00575A] hover:bg-[#003F42] text-white px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-xl"
        >
          Đăng nhập
        </button>
      </div>
    </nav>
  );
}

function HeroSection({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#00575A] via-[#004548] to-[#002D2F] text-white overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#FFBF00]/10 rounded-full blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-300/10 rounded-full blur-[120px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md">
            <motion.span
              className="relative flex h-3 w-3"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBF00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFBF00]"></span>
            </motion.span>
            <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider">
              🚀 Hệ sinh thái kinh doanh sức khỏe 4.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-[0.95] tracking-tighter">
            Vững Tin
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] via-yellow-300 to-[#FFBF00]">
              Vươn Tầm
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-teal-100/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Nền tảng <strong className="text-white font-bold">AI Agentic</strong> giúp bạn bán hàng thông minh,
            <br className="hidden md:block" />
            xây dựng cộng đồng vững mạnh và kiếm thu nhập bền vững
          </p>

          {/* CTA Button */}
          <motion.button
            onClick={onJoin}
            className="relative inline-flex items-center gap-3 bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] px-12 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-[#FFBF00]/30 transition-all transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.span>
            Tham gia Founders Club
            <ArrowRight className="w-6 h-6" />

            {/* Pulse effect */}
            <span className="absolute inset-0 rounded-2xl bg-[#FFBF00] animate-ping opacity-20"></span>
          </motion.button>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16">
            {[
              { label: 'Partners hoạt động', value: '200+' },
              { label: 'Đơn hàng thành công', value: '5.000+' },
              { label: 'Tổng hoa hồng', value: '2 tỷ+' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-black text-[#FFBF00] mb-2">{stat.value}</div>
                <div className="text-sm text-teal-200/80 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full"></div>
        </div>
      </motion.div>
    </section>
  );
}

function SocialProofTicker() {
  const partners = [
    { name: 'Vinamilk', logo: '🥛' },
    { name: 'Abbott', logo: '💊' },
    { name: 'Nestle', logo: '🍫' },
    { name: 'Nutifood', logo: '🥤' },
    { name: 'Blackmores', logo: '💚' },
    { name: 'DHC', logo: '✨' }
  ];

  return (
    <section className="py-12 bg-white border-y border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 justify-center">
        <Award className="w-5 h-5 text-[#00575A]" />
        <p className="text-sm font-bold text-[#00575A] uppercase tracking-wider">
          Đối tác chiến lược
        </p>
      </div>

      <motion.div
        className="flex gap-12"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        {[...partners, ...partners, ...partners].map((partner, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-xl border border-gray-200 whitespace-nowrap"
          >
            <span className="text-3xl">{partner.logo}</span>
            <span className="font-bold text-gray-700">{partner.name}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function ProblemSection() {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const problems = [
    {
      icon: Frown,
      title: 'Cô Đơn Trong Hành Trình',
      desc: 'Bán hàng online mà không có ai hướng dẫn, không có cộng đồng hỗ trợ.',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Wrench,
      title: 'Thiếu Công Cụ Chuyên Nghiệp',
      desc: 'Quản lý đơn hàng bằng Excel, tính thuế thủ công, mất nhiều thời gian.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Heart,
      title: 'Mất Niềm Tin Khách Hàng',
      desc: 'Sản phẩm không rõ nguồn gốc, khách hàng nghi ngờ và không quay lại.',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <section ref={ref} className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[#00575A] font-black uppercase tracking-widest text-sm mb-4">
            Bạn đang gặp phải?
          </h2>
          <h3 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
            Những Rào Cản <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
              Ngăn Bạn Thành Công
            </span>
          </h3>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, idx) => (
            <motion.div
              key={idx}
              className="group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-500 overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              whileHover={{ y: -10 }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${problem.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-br ${problem.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
                  <problem.icon className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{problem.title}</h4>
                <p className="text-gray-600 leading-relaxed">{problem.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionBentoGrid() {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 bg-[#00575A] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFBF00] rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-300 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[#FFBF00] font-black uppercase tracking-widest text-sm mb-4">
            Giải pháp toàn diện
          </h2>
          <h3 className="text-5xl md:text-6xl font-black text-white leading-tight">
            WellNexus - Tất Cả <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] to-yellow-300">
              Trong Một Nền Tảng
            </span>
          </h3>
        </motion.div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {/* Large Card - AI Coach */}
          <motion.div
            className="md:col-span-2 md:row-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 relative overflow-hidden group hover:bg-white/15 transition-all duration-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            {/* Glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFBF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFBF00] to-yellow-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <Bot className="w-9 h-9 text-[#00575A]" />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-white">Agentic OS</h4>
                  <p className="text-teal-200/80 text-sm">AI Coach 24/7</p>
                </div>
              </div>
              <p className="text-white/90 text-lg mb-8 leading-relaxed">
                Trợ lý AI phân tích hành vi khách hàng, gợi ý chiến lược bán hàng,
                và coaching bạn từng ngày. <strong className="text-[#FFBF00]">Không còn cô đơn!</strong>
              </p>

              {/* Mock AI Chat */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFBF00] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-[#00575A]" />
                  </div>
                  <div className="bg-white/20 rounded-2xl p-4 flex-1">
                    <p className="text-white text-sm italic">
                      "Chào An! Hôm nay có 3 người đã xem sản phẩm ANIMA 119 từ link của bạn.
                      Hãy nhắn tin chăm sóc họ ngay nhé! 🎯"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-teal-200/60 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>AI đang phân tích dữ liệu của bạn...</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Medium Card - Product Transparency */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-white mb-3">Sản Phẩm Minh Bạch</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Scan QR Code để truy xuất nguồn gốc 100%.
                <strong className="text-green-300"> Blockchain verified</strong>
              </p>

              {/* QR Mock */}
              <div className="mt-6 w-24 h-24 bg-white rounded-xl p-2 mx-auto">
                <div className="w-full h-full bg-gray-900 rounded opacity-80"></div>
              </div>
            </div>
          </motion.div>

          {/* Medium Card - Community */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <UsersRound className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-white mb-3">Cộng Đồng</h4>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                Kết nối với <strong className="text-purple-300">200+ Partners</strong> cùng chí hướng
              </p>

              {/* Avatar Group */}
              <div className="flex -space-x-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white/20"></div>
                ))}
                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/20 flex items-center justify-center text-white text-xs font-bold">
                  +195
                </div>
              </div>
            </div>
          </motion.div>

          {/* Small Card - Passive Income */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 relative overflow-hidden group hover:bg-white/15 transition-all duration-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-[#FFBF00] to-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                <Wallet className="w-8 h-8 text-[#00575A]" />
              </div>
              <h4 className="text-2xl font-black text-white mb-3">Thu Nhập Thụ Động</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Hoa hồng 15-25% + Team bonus <strong className="text-[#FFBF00]">tự động vào ví</strong>
              </p>

              <div className="mt-6 text-4xl font-black text-[#FFBF00]">
                +3.9M ₫
              </div>
              <div className="text-teal-200/60 text-xs mt-1">Hoa hồng trung bình/tháng</div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function OfferSection() {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const benefits = [
    'Truy cập toàn bộ Agentic AI Coach',
    'Catalog sản phẩm cao cấp (200+ SKU)',
    'Đào tạo miễn phí từ Top Leaders',
    'Quà tặng Founder trị giá 3.000.000đ',
    'Chia sẻ 2% doanh thu toàn cầu',
    'Ưu tiên hỗ trợ 24/7'
  ];

  return (
    <section ref={ref} className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[#00575A] font-black uppercase tracking-widest text-sm mb-4">
            Gói đặc biệt
          </h2>
          <h3 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
            Founders Club <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00575A] to-teal-600">
              Limited Edition
            </span>
          </h3>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {/* Pricing Card */}
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#00575A] overflow-hidden relative">
            {/* Badge */}
            <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Cam kết hoàn tiền 100%
            </div>

            {/* Header */}
            <div className="bg-gradient-to-br from-[#00575A] to-[#003F42] p-10 text-white">
              <div className="text-sm uppercase tracking-widest font-bold text-teal-200 mb-2">
                Founders Club
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-6xl font-black">FREE</span>
                <span className="text-2xl text-teal-200 mb-2">trong 30 ngày</span>
              </div>
              <p className="text-teal-100/90">
                Sau đó chỉ <strong className="text-white">299.000đ/tháng</strong>
                <br />
                <span className="text-sm">(Hủy bất cứ lúc nào)</span>
              </p>
            </div>

            {/* Benefits */}
            <div className="p-10">
              <h4 className="text-xl font-bold text-gray-900 mb-6">
                Quyền lợi đặc biệt:
              </h4>
              <ul className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <motion.li
                    key={idx}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <motion.button
                className="w-full mt-10 bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Zap className="w-6 h-6" />
                Kích hoạt ngay - Miễn phí 30 ngày
              </motion.button>

              <p className="text-center text-gray-500 text-sm mt-4">
                🎁 Chỉ còn <strong className="text-[#00575A]">47 suất</strong> trong tháng này
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FinalCTA({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-[#00575A] to-gray-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
        style={{
          backgroundImage: 'radial-gradient(circle, #FFBF00 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md">
            <Globe className="w-4 h-4 text-[#FFBF00]" />
            <span className="text-sm font-bold text-[#FFBF00] uppercase tracking-wider">
              Hệ sinh thái toàn cầu
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Sẵn Sàng Thay Đổi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] to-yellow-300">
              Cuộc Đời Bạn?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Tham gia cộng đồng 200+ Partners đang xây dựng sự nghiệp bền vững
            trong ngành kinh doanh sức khỏe với sự hỗ trợ của AI
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              onClick={onJoin}
              className="bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] px-12 py-6 rounded-2xl font-black text-xl shadow-2xl shadow-[#FFBF00]/30 transition-all flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-6 h-6" />
              Bắt Đầu Miễn Phí Ngay
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            <div className="text-gray-400 text-sm">
              ✓ Không cần thẻ tín dụng
              <br />
              ✓ Hủy bất cứ lúc nào
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-16 border-t border-white/10">
            {[
              { icon: ShieldCheck, label: 'Bảo mật SSL' },
              { icon: Users, label: 'Cộng đồng 5000+' },
              { icon: Award, label: 'Top rated 2024' },
              { icon: TrendingUp, label: 'Tăng trưởng 300%' }
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-400">
                <badge.icon className="w-5 h-5 text-[#FFBF00]" />
                <span className="text-sm">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 py-12 border-t border-gray-800 text-center">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00575A] to-[#003F42] rounded-xl flex items-center justify-center text-white font-black">
            W
          </div>
          <span className="font-black text-xl text-white">WellNexus</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Hệ sinh thái kinh doanh sức khỏe 4.0 - Powered by AI Agentic
        </p>
        <p className="text-gray-600 text-xs">
          © 2024 WellNexus Technology JSC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
