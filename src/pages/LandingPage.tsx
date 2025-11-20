import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Users, Zap, CheckCircle2, Bot, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useStore();

  const handleJoin = () => {
    login(); // 1. Kích hoạt trạng thái đăng nhập trong Store
    navigate('/dashboard'); // 2. Chuyển hướng sang Dashboard
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00575A] rounded-lg flex items-center justify-center text-white font-bold shadow-lg">W</div>
          <span className="font-bold text-xl text-[#00575A] tracking-tight">WellNexus</span>
        </div>
        <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-gray-500 hover:text-[#00575A] hidden md:block">Về chúng tôi</button>
            <button 
            onClick={handleJoin}
            className="text-sm font-bold bg-gray-100 hover:bg-gray-200 text-[#00575A] px-5 py-2 rounded-full transition-colors"
            >
            Đăng nhập
            </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 bg-gradient-to-br from-[#00575A] to-[#003F42] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#FFBF00]/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Text Content */}
            <motion.div 
                initial="hidden" animate="visible" variants={fadeInUp}
                className="flex-1 text-center lg:text-left"
            >
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBF00] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFBF00]"></span>
                </span>
                <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wider">Đang mở tuyển 200 Partner đầu tiên</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                Kinh Doanh Sức Khỏe <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] to-yellow-200">
                    Thời Đại AI Agentic
                </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-teal-100/90 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                Nền tảng Social Commerce trang bị cho bạn một <strong>AI Coach</strong> riêng biệt, sản phẩm <strong>Minh bạch</strong> nguồn gốc và <strong>Quy trình</strong> bán hàng tự động hóa.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                    onClick={handleJoin}
                    className="bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,191,0,0.3)] hover:shadow-[0_0_50px_rgba(255,191,0,0.5)] transition-all transform hover:-translate-y-1"
                >
                    Truy cập Dashboard Demo <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> Tìm hiểu mô hình
                </button>
                </div>
            </motion.div>

            {/* Visual/Mockup */}
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 relative hidden lg:block"
            >
                <div className="relative z-10 bg-gray-900 rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl max-w-xs mx-auto overflow-hidden">
                    <div className="bg-white h-[550px] w-full flex flex-col">
                        <div className="bg-[#00575A] p-6 pt-10 text-white">
                             <div className="text-xs opacity-80 uppercase">Tổng thu nhập</div>
                             <div className="text-3xl font-bold">15.000.000 ₫</div>
                        </div>
                        <div className="p-4 space-y-3 bg-gray-50 flex-1">
                             <div className="bg-white p-3 rounded-xl shadow-sm flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users size={18}/></div>
                                <div>
                                    <div className="text-xs text-gray-500">Team Volume</div>
                                    <div className="font-bold text-gray-800">45.000.000 ₫</div>
                                </div>
                             </div>
                             <div className="bg-[#00575A] p-3 rounded-xl shadow-lg text-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <Bot size={16} className="text-[#FFBF00]" />
                                    <span className="text-xs font-bold uppercase text-[#FFBF00]">AI Coach</span>
                                </div>
                                <div className="text-xs italic opacity-90">"An ơi, hôm nay hãy chia sẻ link sản phẩm cho 3 người bạn nhé!"</div>
                             </div>
                        </div>
                    </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute top-20 -left-12 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle2 size={20}/></div>
                    <div>
                        <div className="text-xs text-gray-500">Vừa nhận hoa hồng</div>
                        <div className="text-sm font-bold text-gray-900">+ 375.000 ₫</div>
                    </div>
                </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-[#00575A] font-bold uppercase tracking-widest text-sm mb-2">Tại sao chọn WellNexus?</h2>
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">Công cụ mạnh mẽ cho người tiên phong</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Bot,
                title: "Agentic AI Coach",
                desc: "Không còn cô đơn. AI phân tích dữ liệu bán hàng và gợi ý chiến lược mỗi ngày."
              },
              {
                icon: ShieldCheck,
                title: "Minh Bạch Tuyệt Đối",
                desc: "Truy xuất nguồn gốc sản phẩm bằng Blockchain. Tự động khấu trừ thuế TNCN đúng luật."
              },
              {
                icon: Users,
                title: "Cộng Đồng Hỗ Trợ",
                desc: "Học hỏi từ những Leader hàng đầu. Gamification biến việc bán hàng thành trò chơi thú vị."
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-[#F3F4F6] rounded-2xl flex items-center justify-center text-[#00575A] mb-6 group-hover:bg-[#00575A] group-hover:text-[#FFBF00] transition-colors">
                  <item.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 bg-[#1F2937] rounded-3xl p-12 text-white relative overflow-hidden text-center lg:text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00575A] opacity-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 justify-center lg:justify-start mb-2 text-[#FFBF00]">
                <Lock size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Quyền lợi giới hạn</span>
              </div>
              <h3 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu hành trình?</h3>
              <p className="text-gray-400 max-w-md">Tham gia ngay hôm nay để nhận gói quà tặng Founder trị giá 3.000.000đ và quyền lợi chia sẻ 2% doanh thu toàn cầu.</p>
            </div>
            <button 
              onClick={handleJoin}
              className="bg-[#FFBF00] text-[#00575A] px-10 py-5 rounded-xl font-bold text-lg hover:bg-yellow-400 transition shadow-lg whitespace-nowrap"
            >
              Đăng Ký Ngay
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">© 2024 WellNexus Technology JSC. All rights reserved.</p>
      </footer>
    </div>
  );
}