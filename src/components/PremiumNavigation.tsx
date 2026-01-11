/**
 * Premium Navigation Components - Phase 22
 * 2026 East Asian Enterprise Brand Design
 * 
 * Features:
 * - Glass morphism header
 * - Mega menu dropdown
 * - Premium footer with sitemap
 * - Social links with hover effects
 * - Newsletter with validation
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, ChevronDown, ChevronRight,
    Facebook, Instagram, Linkedin, Youtube, Twitter,
    Mail, Phone, MapPin, Send, ArrowUpRight,
    Sparkles, Users, TrendingUp, Award, Globe
} from 'lucide-react';

// ============================================================================
// PREMIUM HEADER - 2026 EAST ASIA STYLE
// ============================================================================

interface NavItem {
    label: string;
    href?: string;
    children?: { label: string; href: string; icon?: React.ReactNode; description?: string }[];
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Về Chúng Tôi',
        children: [
            { label: 'Câu Chuyện', href: '/about', icon: <Sparkles className="w-4 h-4" />, description: 'Hành trình phát triển' },
            { label: 'Đội Ngũ', href: '/team', icon: <Users className="w-4 h-4" />, description: 'Những con người tuyệt vời' },
            { label: 'Tầm Nhìn 2028', href: '/vision', icon: <Globe className="w-4 h-4" />, description: 'Chiến lược mở rộng SEA' },
        ]
    },
    {
        label: 'Sản Phẩm',
        children: [
            { label: 'Wellness Products', href: '/products', icon: <Award className="w-4 h-4" />, description: 'Sản phẩm cao cấp' },
            { label: 'AI Coach', href: '/ai-coach', icon: <Sparkles className="w-4 h-4" />, description: 'Huấn luyện viên AI' },
        ]
    },
    { label: 'Partner', href: '/partner' },
    { label: 'Blog', href: '/blog' },
];

export function PremiumHeader() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500
          ${scrolled
                        ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50 shadow-xl'
                        : 'bg-transparent'
                    }
        `}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <a href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                                W
                            </div>
                            <div className="hidden sm:block">
                                <div className="font-bold text-xl text-white tracking-tight">WellNexus</div>
                                <div className="text-xs text-zinc-500 font-medium">Social Commerce 2.0</div>
                            </div>
                        </a>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {NAV_ITEMS.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <a
                                        href={item.href || '#'}
                                        className={`
                      flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl
                      transition-colors duration-200
                      ${activeDropdown === item.label ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}
                    `}
                                    >
                                        {item.label}
                                        {item.children && <ChevronDown className="w-4 h-4" />}
                                    </a>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {item.children && activeDropdown === item.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full left-0 pt-2 w-72"
                                            >
                                                <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-2 shadow-2xl">
                                                    {item.children.map((child) => (
                                                        <a
                                                            key={child.label}
                                                            href={child.href}
                                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors group"
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                                                {child.icon}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
                                                                    {child.label}
                                                                </div>
                                                                {child.description && (
                                                                    <div className="text-xs text-zinc-500 mt-0.5">{child.description}</div>
                                                                )}
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </nav>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-3">
                            <a
                                href="/login"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Đăng Nhập
                            </a>
                            <motion.a
                                href="/signup"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Bắt Đầu Ngay
                                <ArrowUpRight className="w-4 h-4" />
                            </motion.a>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2 text-zinc-400 hover:text-white"
                            >
                                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 lg:hidden"
                    >
                        <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl pt-24 px-6">
                            <nav className="flex flex-col gap-2">
                                {NAV_ITEMS.map((item) => (
                                    <a
                                        key={item.label}
                                        href={item.href || '#'}
                                        className="flex items-center justify-between px-4 py-4 text-lg font-medium text-white border-b border-zinc-800"
                                    >
                                        {item.label}
                                        {item.children && <ChevronRight className="w-5 h-5 text-zinc-500" />}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================================================
// PREMIUM FOOTER - 2026 EAST ASIA STYLE
// ============================================================================

const FOOTER_LINKS = [
    {
        title: 'Sản Phẩm',
        links: [
            { label: 'Wellness Products', href: '/products' },
            { label: 'AI Coach', href: '/ai-coach' },
            { label: 'Marketplace', href: '/marketplace' },
            { label: 'Mobile App', href: '/app' },
        ]
    },
    {
        title: 'Partner',
        links: [
            { label: 'Trở Thành Partner', href: '/partner' },
            { label: 'Founders Club', href: '/founders' },
            { label: 'Bảng Hoa Hồng', href: '/commission' },
            { label: 'Đào Tạo', href: '/training' },
        ]
    },
    {
        title: 'Công Ty',
        links: [
            { label: 'Về Chúng Tôi', href: '/about' },
            { label: 'Tuyển Dụng', href: '/careers' },
            { label: 'Blog', href: '/blog' },
            { label: 'Liên Hệ', href: '/contact' },
        ]
    },
    {
        title: 'Pháp Lý',
        links: [
            { label: 'Điều Khoản', href: '/terms' },
            { label: 'Bảo Mật', href: '/privacy' },
            { label: 'Cookie', href: '/cookies' },
            { label: 'DMCA', href: '/dmca' },
        ]
    }
];

const SOCIAL_LINKS = [
    { icon: Facebook, href: 'https://facebook.com/wellnexus', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/wellnexus', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/wellnexus', label: 'LinkedIn' },
    { icon: Youtube, href: 'https://youtube.com/@wellnexus', label: 'YouTube' },
    { icon: Twitter, href: 'https://twitter.com/wellnexus', label: 'Twitter' },
];

export function PremiumFooter() {
    const [email, setEmail] = useState('');

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle newsletter subscription
        console.log('Subscribe:', email);
        setEmail('');
    };

    return (
        <footer className="relative bg-zinc-950 border-t border-zinc-800">
            {/* Newsletter Section */}
            <div className="border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="text-center lg:text-left">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Nhận Thông Tin Mới Nhất
                            </h3>
                            <p className="text-zinc-400">
                                Đăng ký để nhận tin tức, ưu đãi đặc biệt và insights từ WellNexus
                            </p>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex gap-3 w-full max-w-md">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="flex-1 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                required
                            />
                            <motion.button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:inline">Đăng Ký</span>
                            </motion.button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-2xl shadow-lg">
                                W
                            </div>
                            <div>
                                <div className="font-bold text-xl text-white">WellNexus</div>
                                <div className="text-xs text-zinc-500">Social Commerce 2.0</div>
                            </div>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xs">
                            Hệ sinh thái Social Commerce tiên phong tại Đông Nam Á với AI-driven technology và equity ownership.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3 text-sm text-zinc-400">
                            <a href="mailto:hello@wellnexus.vn" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                                <Mail className="w-4 h-4" />
                                hello@wellnexus.vn
                            </a>
                            <a href="tel:+84901234567" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                                <Phone className="w-4 h-4" />
                                +84 901 234 567
                            </a>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>123 Innovation St, Q1, TP.HCM, Vietnam</span>
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {FOOTER_LINKS.map((section) => (
                        <div key={section.title}>
                            <h4 className="font-bold text-white mb-4">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Copyright */}
                        <div className="text-sm text-zinc-500">
                            © {new Date().getFullYear()} WellNexus. All rights reserved.
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {SOCIAL_LINKS.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </motion.a>
                                );
                            })}
                        </div>

                        {/* Certifications */}
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>🔒 SSL Secured</span>
                            <span>📜 ISO 27001</span>
                            <span>🏆 Forbes 30</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
