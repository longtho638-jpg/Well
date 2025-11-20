
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Wallet, LogOut, Sparkles, Bot, 
  CheckCircle2, Circle, Menu, ArrowRight, ShieldAlert, Users, Wrench, 
  Fingerprint, Star, Trophy, Copy, Zap, TrendingUp, CalendarClock, 
  ArrowUpRight, Info, Share2, Loader2, Search, Package, ShieldCheck, ChevronDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WELLNEXUS SINGLE FILE APP (GOLDEN COPY)
 * 
 * This file contains the entire frontend logic, mock data, and UI components 
 * required to run the WellNexus MVP. 
 * 
 * DEPENDENCIES: react, lucide-react, recharts, framer-motion
 * SETUP: Copy this file to your project, import it, and render it.
 */

// --- 1. CONSTANTS & MOCK DATA ---

const MOCK_USER = {
  id: 'VN-888',
  name: 'Nguyen Van An',
  rank: 'Partner',
  totalSales: 15500000,
  teamVolume: 45000000,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  referralLink: 'wellnexus.vn/ref/VN-888',
  nextPayoutDate: '15/06/2024',
  estimatedBonus: 2400000,
};

const MOCK_PRODUCTS = [
  {
    id: 'PROD-119',
    name: 'Combo ANIMA 119',
    price: 1500000,
    commissionRate: 0.25,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    desc: 'Energy & Focus Supplement. Boosts daily performance naturally. Best seller.',
    stock: 50,
    sales: 124
  },
  {
    id: 'PROD-120',
    name: 'WellNexus Starter Kit',
    price: 3500000,
    commissionRate: 0.20,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
    desc: 'Business Starter Kit. Everything you need to launch your journey.',
    stock: 20,
    sales: 85
  },
  {
    id: 'PROD-121',
    name: 'Immune Boost Pack',
    price: 900000,
    commissionRate: 0.15,
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=400&q=80',
    desc: 'Daily Vitamin C+ for family health protection.',
    stock: 100,
    sales: 56
  }
];

const MOCK_TRANSACTIONS = [
  { id: 'TX-01', date: '2024-05-20', amount: 5000000, type: 'Team Bonus', status: 'completed' },
  { id: 'TX-02', date: '2024-05-22', amount: 375000, type: 'Direct Sale', status: 'completed' },
];

const MOCK_QUESTS = [
  { id: 'Q1', title: 'Connect: Share link with 5 friends', xp: 50, isCompleted: false },
  { id: 'Q2', title: 'Educate: Read "Compliance 101"', xp: 20, isCompleted: true },
];

const REVENUE_DATA = [
  { name: 'Mon', value: 2000000 }, { name: 'Tue', value: 4500000 },
  { name: 'Wed', value: 3000000 }, { name: 'Thu', value: 8000000 },
  { name: 'Fri', value: 5500000 }, { name: 'Sat', value: 9000000 },
  { name: 'Sun', value: 12000000 },
];

// --- 2. UTILITIES ---

const formatVND = (amount: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount).replace('₫', 'đ');

const calculateTax = (amount: number) => {
  const THRESHOLD = 2000000;
  const isTaxable = amount >= THRESHOLD;
  const tax = isTaxable ? amount * 0.1 : 0;
  return { gross: amount, tax, net: amount - tax, isTaxable };
};

// --- 3. COMPONENTS ---

// > 3.1 LANDING PAGE
const LandingPage = ({ onLogin }: { onLogin: () => void }) => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[#00575A] font-bold text-xl">
          <div className="w-8 h-8 bg-[#00575A] rounded-lg flex items-center justify-center text-white">W</div>
          WellNexus
        </div>
        <button onClick={onLogin} className="bg-gray-100 hover:bg-gray-200 text-[#00575A] px-4 py-2 rounded-lg font-bold text-sm transition">
          Đăng nhập
        </button>
      </nav>

      <header className="pt-32 pb-20 bg-gradient-to-b from-[#00575A] to-[#003F42] text-white relative overflow-hidden">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#FFBF00]/10 rounded-full blur-[100px]"></div>
         <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#FFBF00] animate-pulse"></span>
                <span className="text-sm font-medium text-[#FFBF00]">Tuyển 200 Đối tác Hạt giống</span>
              </div>
              <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                Vững Tin Vươn Tầm <br/>
                <span className="text-[#FFBF00]">Kinh Doanh Sức Khỏe 4.0</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8 max-w-xl">
                Nền tảng Social Commerce kết hợp **AI Coach**, sản phẩm **Minh bạch** và **Cộng đồng** hỗ trợ. Khởi nghiệp không rủi ro.
              </p>
              <div className="flex gap-4">
                <button onClick={onLogin} className="bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg shadow-[#FFBF00]/20 transition transform hover:-translate-y-1">
                  Đăng Ký Ngay <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="hidden lg:block relative">
                <div className="bg-gray-900 rounded-[2.5rem] p-4 w-[300px] h-[600px] border-[8px] border-gray-800 shadow-2xl mx-auto relative">
                   <div className="bg-white h-full w-full rounded-[1.8rem] overflow-hidden relative">
                      <div className="bg-[#00575A] h-32 p-4 pt-10 text-white">
                         <div className="text-xs opacity-80">Tổng thu nhập</div>
                         <div className="text-2xl font-bold">15.000.000 đ</div>
                      </div>
                      <div className="p-4 space-y-3">
                         <div className="bg-gray-100 h-20 rounded-xl"></div>
                         <div className="bg-gray-100 h-20 rounded-xl"></div>
                         <div className="bg-gray-100 h-20 rounded-xl"></div>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-[#FFBF00] p-3 rounded-full shadow-lg">
                         <Bot className="w-6 h-6 text-[#00575A]" />
                      </div>
                   </div>
                </div>
            </motion.div>
         </div>
      </header>

      <section className="py-20 bg-gray-50">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { icon: Users, title: "Cô đơn", desc: "Không người dẫn dắt, thiếu lộ trình." },
                 { icon: Wrench, title: "Thiếu công cụ", desc: "Quản lý thủ công, không biết Marketing." },
                 { icon: ShieldAlert, title: "Mất niềm tin", desc: "Sản phẩm kém chất lượng gây mất uy tín." }
               ].map((item, i) => (
                 <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100 text-center">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><item.icon /></div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-500">{item.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      <footer className="bg-white py-10 border-t border-gray-200 text-center text-gray-500 text-sm">
         © 2024 WellNexus MVP. All rights reserved.
      </footer>
    </div>
  );
};

// > 3.2 SIDEBAR
const Sidebar = ({ view, setView, user, onLogout }: any) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAdvice = () => {
    setLoading(true);
    setTimeout(() => {
      setAdvice("Hãy tập trung chia sẻ link cho 3 người bạn mới hôm nay. Doanh số sẽ đến từ sự kết nối! 🚀");
      setLoading(false);
    }, 1500);
  };

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#00575A] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">W</div>
        <div>
          <h1 className="font-bold text-xl text-[#00575A]">WellNexus</h1>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Seed Stage</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
          { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace' },
          { id: 'wallet', icon: Wallet, label: 'My Wallet' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition ${
              view === item.id ? 'bg-[#00575A] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <item.icon className={`w-5 h-5 ${view === item.id ? 'text-[#FFBF00]' : ''}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4">
        <div className="bg-[#00575A] rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBF00] opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="flex items-center gap-2 font-bold text-sm"><Bot className="w-4 h-4 text-[#FFBF00]" /> The Coach</div>
            <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full">Day 3/30</span>
          </div>
          <div className="space-y-2 mb-4 relative z-10">
            {MOCK_QUESTS.map(q => (
              <div key={q.id} className="flex items-start gap-2 text-xs">
                {q.isCompleted ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <Circle className="w-4 h-4 text-[#FFBF00] shrink-0" />}
                <span className={q.isCompleted ? 'line-through text-gray-400' : ''}>{q.title}</span>
                <span className="ml-auto text-[#FFBF00] font-bold">+{q.xp}XP</span>
              </div>
            ))}
          </div>
          {advice ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/10 p-2 rounded text-xs italic border border-white/10">"{advice}"</motion.div>
          ) : (
            <button onClick={getAdvice} disabled={loading} className="w-full py-2 bg-[#FFBF00] text-[#00575A] font-bold text-xs rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400 transition">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Get AI Advice
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
        <div className="flex-1 min-w-0">
           <p className="text-sm font-bold truncate">{user.name}</p>
           <p className="text-xs text-[#00575A] font-medium">{user.rank}</p>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"><LogOut className="w-4 h-4" /></button>
      </div>
    </aside>
  );
};

// > 3.3 DASHBOARD VIEW
const DashboardView = ({ user }: any) => {
  const progress = 75; // Mock progress
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-[#00575A] to-teal-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
         <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-12 -mt-12"></div>
         <div className="flex flex-col md:flex-row justify-between items-end gap-8 relative z-10">
            <div className="flex-1 w-full">
               <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#FFBF00] text-[#00575A] text-[10px] font-extrabold px-2 py-1 rounded uppercase flex items-center gap-1">
                     <Zap className="w-3 h-3 fill-current" /> 30-Day Challenge
                  </span>
                  <span className="text-teal-200 text-xs">Day 12 of 30</span>
               </div>
               <h2 className="text-3xl font-bold mb-2">Road to Founder Club</h2>
               <p className="text-teal-100 text-sm mb-6 opacity-90">Hit <span className="font-bold text-white">100M Team Volume</span> to unlock 2% Global Bonus.</p>
               <div className="flex justify-between text-xs font-bold uppercase mb-1">
                  <span className="text-teal-200">Progress</span>
                  <span className="text-[#FFBF00]">{progress}%</span>
               </div>
               <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full bg-[#FFBF00]" />
               </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[260px]">
               <p className="text-teal-200 text-[10px] uppercase font-bold mb-2">Your Referral Link</p>
               <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg mb-3">
                  <code className="text-xs text-white truncate flex-1">{user.referralLink}</code>
                  <Copy className="w-3 h-3 text-[#FFBF00]" />
               </div>
               <button className="w-full bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] font-bold py-2 rounded-lg text-sm transition">Share Now</button>
            </div>
         </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between mb-4">
               <div className="w-10 h-10 bg-[#00575A]/10 rounded-xl flex items-center justify-center text-[#00575A]"><TrendingUp className="w-5 h-5" /></div>
               <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full h-fit flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 12%</span>
            </div>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Personal Sales</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatVND(user.totalSales)}</h3>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between mb-4">
               <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Users className="w-5 h-5" /></div>
               <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full h-fit flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 8%</span>
            </div>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Team Volume</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatVND(user.teamVolume)}</h3>
         </div>
         <div className="bg-[#1F2937] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
             <div className="absolute right-0 top-0 w-20 h-20 bg-[#00575A] opacity-20 rounded-bl-full"></div>
             <div className="flex justify-between mb-4 relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#FFBF00] border border-white/5"><CalendarClock className="w-5 h-5" /></div>
                <div className="text-right">
                   <p className="text-gray-400 text-[10px] uppercase font-bold">Payout</p>
                   <p className="font-bold text-[#FFBF00] text-sm">{user.nextPayoutDate}</p>
                </div>
             </div>
             <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider relative z-10">Est. Bonus</p>
             <h3 className="text-2xl font-bold text-white relative z-10">{formatVND(user.estimatedBonus)}</h3>
             <div className="mt-2 inline-flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded text-[10px] text-red-200 border border-red-500/20">
                <Info className="w-3 h-3" /> Includes 10% PIT deduction
             </div>
         </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
         <h3 className="font-bold text-lg text-gray-800 mb-6">Revenue Growth</h3>
         <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={REVENUE_DATA}>
               <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#00575A" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#00575A" stopOpacity={0}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} dy={10} />
               <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} tickFormatter={(val) => `${val/1000000}M`} dx={-10} />
               <Tooltip contentStyle={{backgroundColor: '#1F2937', border:'none', borderRadius:'8px', color:'#fff'}} itemStyle={{color:'#FFBF00'}} formatter={(val:number) => [formatVND(val), 'Revenue']} />
               <Area type="monotone" dataKey="value" stroke="#00575A" strokeWidth={3} fill="url(#colorRev)" />
            </AreaChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
};

// > 3.4 WALLET VIEW
const WalletView = ({ transactions }: { transactions: any[] }) => {
  // Calculate Totals with Tax Logic
  const processed = transactions.map(t => {
     const { tax, isTaxable } = calculateTax(t.amount);
     return { ...t, taxDeducted: tax, isTaxable };
  });

  const totalGross = processed.reduce((sum, t) => sum + t.amount, 0);
  const totalTax = processed.reduce((sum, t) => sum + t.taxDeducted, 0);
  const totalNet = totalGross - totalTax;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Commission Wallet</h2>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-gradient-to-br from-[#00575A] to-teal-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                  <p className="text-teal-200 text-sm uppercase tracking-wider font-medium mb-1">Withdrawable Balance</p>
                  <h2 className="text-4xl font-bold">{formatVND(totalNet)}</h2>
               </div>
               <div className="bg-white/10 p-3 rounded-xl"><Wallet className="w-6 h-6 text-[#FFBF00]" /></div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6 relative z-10">
               <div>
                  <p className="text-teal-300 text-xs mb-1">Total Earnings (Gross)</p>
                  <p className="font-semibold text-lg">{formatVND(totalGross)}</p>
               </div>
               <div>
                  <p className="text-red-300 text-xs mb-1 flex items-center gap-1">Withheld Tax (PIT 10%) <Info className="w-3 h-3" /></p>
                  <p className="font-semibold text-lg text-red-200">-{formatVND(totalTax)}</p>
               </div>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center text-center gap-4">
             <div className="bg-yellow-50 p-3 rounded-full w-fit mx-auto"><ShieldAlert className="w-6 h-6 text-yellow-600" /></div>
             <div>
                <h4 className="font-bold text-gray-800">Tax Compliance Mode</h4>
                <p className="text-xs text-gray-500 mt-1">Automatically deducts 10% PIT for income > 2,000,000 VNĐ according to Vietnam Law.</p>
             </div>
             <button className="bg-[#FFBF00] hover:bg-yellow-400 text-[#00575A] font-bold py-3 rounded-xl w-full">Request Withdrawal</button>
         </div>
      </motion.div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-gray-50">
               <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Gross</th>
                  <th className="px-6 py-4 text-right">Tax (10%)</th>
                  <th className="px-6 py-4 text-right">Net</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {processed.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4 font-medium text-gray-900">{t.date}</td>
                     <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{t.type}</span></td>
                     <td className="px-6 py-4 text-right text-gray-600">{formatVND(t.amount)}</td>
                     <td className="px-6 py-4 text-right text-red-500">{t.taxDeducted > 0 ? `-${formatVND(t.taxDeducted)}` : '-'}</td>
                     <td className="px-6 py-4 text-right font-bold text-[#00575A]">{formatVND(t.amount - t.taxDeducted)}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

// > 3.5 MARKETPLACE VIEW
const MarketplaceView = ({ onBuy }: { onBuy: (product: any) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-20">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Marketplace</h2>
          <div className="relative">
             <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
             <input 
                type="text" 
                placeholder="Search products..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00575A]/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
       </div>
       <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((p, idx) => (
             <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition group cursor-pointer">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                   <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                   <div className="absolute top-2 right-2 bg-[#00575A] text-white text-[10px] font-bold px-2 py-1 rounded">
                      Earn {formatVND(p.price * p.commissionRate)}
                   </div>
                </div>
                <div className="p-4">
                   <h3 className="font-bold text-gray-800 mb-1 truncate">{p.name}</h3>
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-[#00575A] font-bold text-sm">{formatVND(p.price)}</span>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">Stock: {p.stock}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <button className="flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"><Share2 className="w-3 h-3" /> Share</button>
                      <button onClick={() => onBuy(p)} className="flex items-center justify-center gap-1 bg-[#FFBF00] rounded-lg py-2 text-xs font-bold text-[#00575A] hover:bg-yellow-400"><ShoppingBag className="w-3 h-3" /> Buy Now</button>
                   </div>
                </div>
             </motion.div>
          ))}
       </div>
    </div>
  );
};

// --- 4. MAIN APP CONTROLLER ---

const SingleFileApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(MOCK_USER);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  // Simulate Order Logic
  const handleBuy = async (product: any) => {
     if (product.stock <= 0) return;
     // Simulate API delay
     await new Promise(resolve => setTimeout(resolve, 600));
     
     const commission = product.price * product.commissionRate;
     const newTx = {
        id: `TX-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: commission,
        type: 'Direct Sale',
        status: 'completed'
     };

     // Update State
     setTransactions([newTx, ...transactions]);
     setUser(prev => ({
        ...prev,
        totalSales: prev.totalSales + product.price,
        teamVolume: prev.teamVolume + (product.price * 0.2)
     }));
     alert(`Successfully bought ${product.name}. Earned ${formatVND(commission)}! Check your Wallet.`);
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6] font-sans text-gray-900">
       <div className="hidden md:block flex-shrink-0">
          <Sidebar view={currentView} setView={setCurrentView} user={user} onLogout={() => setIsAuthenticated(false)} />
       </div>
       <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
          {/* Mobile Header */}
          <div className="md:hidden flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
             <span className="font-bold text-[#00575A]">WellNexus</span>
             <button><Menu className="w-6 h-6 text-gray-600" /></button>
          </div>

          {currentView === 'dashboard' && <DashboardView user={user} />}
          {currentView === 'marketplace' && <MarketplaceView onBuy={handleBuy} />}
          {currentView === 'wallet' && <WalletView transactions={transactions} />}
       </main>
    </div>
  );
};

export default SingleFileApp;
