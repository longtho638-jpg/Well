/**
 * Premium Navigation Components - Phase 23
 * FUNCTIONAL Navigation with Real Routing
 * 
 * Features:
 * - React Router Link integration
 * - Auth state integration
 * - Real working routes
 * - Newsletter with toast feedback
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, ChevronDown, ChevronRight,
    Facebook, Instagram, Linkedin, Youtube, Twitter,
    Mail, Phone, MapPin, Send, ArrowUpRight,
    Sparkles, Users, Award, Globe, ShoppingBag,
    LogIn, LogOut, User, LayoutDashboard
} from 'lucide-react';
import { useStore } from '../store';

// ============================================================================
// NAVIGATION ITEMS - Real Routes
// ============================================================================

interface NavChild {
    label: string;
    href: string;
    icon: React.ReactNode;
    description: string;
}

interface NavItem {
    label: string;
    href?: string;
    children?: NavChild[];
}

// Navigation items with valid routes
// - For authenticated users: direct dashboard routes
// - For guests: login with redirect
const getNavItems = (isAuth: boolean): NavItem[] => [
    {
        label: 'Sản Phẩm',
        children: [
            {
                label: 'Marketplace',
                href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace',
                icon: <ShoppingBag className="w-4 h-4" />,
                description: 'Mua sắm sản phẩm wellness'
            },
            {
                label: 'AI Coach',
                href: isAuth ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach',
                icon: <Sparkles className="w-4 h-4" />,
                description: 'Huấn luyện viên AI cá nhân'
            },
        ]
    },
    {
        label: 'Partner',
        children: [
            {
                label: 'Trở Thành Partner',
                href: '/venture',
                icon: <Users className="w-4 h-4" />,
                description: 'Gia nhập chương trình Partner'
            },
            {
                label: 'Leader Dashboard',
                href: isAuth ? '/dashboard/team' : '/login?redirect=/dashboard/team',
                icon: <Award className="w-4 h-4" />,
                description: 'Quản lý đội nhóm'
            },
        ]
    },
    { label: 'Marketplace', href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace' },
];

// ============================================================================
// PREMIUM HEADER - Functional with Auth
// ============================================================================

export function PremiumHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAuthenticated } = useStore();
    const NAV_ITEMS = getNavItems(isAuthenticated);

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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
                        {/* Logo - React Router Link */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                                W
                            </div>
                            <div className="hidden sm:block">
                                <div className="font-bold text-xl text-white tracking-tight">WellNexus</div>
                                <div className="text-xs text-zinc-500 font-medium">Social Commerce 2.0</div>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {NAV_ITEMS.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    {item.href ? (
                                        <Link
                                            to={item.href}
                                            className={`
                        flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl
                        transition-colors duration-200
                        ${location.pathname === item.href
                                                    ? 'text-emerald-400 bg-emerald-500/10'
                                                    : 'text-zinc-400 hover:text-white'
                                                }
                      `}
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <button
                                            className={`
                        flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl
                        transition-colors duration-200
                        ${activeDropdown === item.label ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white'}
                      `}
                                        >
                                            {item.label}
                                            {item.children && <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    )}

                                    {/* Dropdown with React Router Links */}
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
                                                        <Link
                                                            key={child.label}
                                                            to={child.href}
                                                            className={`
                                flex items-start gap-3 p-3 rounded-xl transition-colors group
                                ${location.pathname === child.href
                                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                                    : 'hover:bg-zinc-800'
                                                                }
                              `}
                                                        >
                                                            <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center transition-colors
                                ${location.pathname === child.href
                                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20'
                                                                }
                              `}>
                                                                {child.icon}
                                                            </div>
                                                            <div>
                                                                <div className={`
                                  text-sm font-medium transition-colors
                                  ${location.pathname === child.href ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}
                                `}>
                                                                    {child.label}
                                                                </div>
                                                                <div className="text-xs text-zinc-500 mt-0.5">{child.description}</div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </nav>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            {user ? (
                                <>
                                    {/* User is logged in */}
                                    <Link
                                        to="/dashboard"
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-black">
                                                {user.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <span className="text-sm text-zinc-300 max-w-[120px] truncate">
                                                {user.email?.split('@')[0] || 'User'}
                                            </span>
                                        </div>
                                        <motion.button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="hidden sm:inline">Đăng Xuất</span>
                                        </motion.button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* User is not logged in */}
                                    <Link
                                        to="/login"
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Đăng Nhập
                                    </Link>
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            to="/login"
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                                        >
                                            Bắt Đầu Ngay
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Link>
                                    </motion.div>
                                </>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2 text-zinc-400 hover:text-white"
                                aria-label="Toggle menu"
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
                                    <div key={item.label}>
                                        {item.href ? (
                                            <Link
                                                to={item.href}
                                                className={`
                          flex items-center justify-between px-4 py-4 text-lg font-medium border-b border-zinc-800
                          ${location.pathname === item.href ? 'text-emerald-400' : 'text-white'}
                        `}
                                            >
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <div className="border-b border-zinc-800">
                                                <div className="px-4 py-4 text-lg font-medium text-white flex items-center justify-between">
                                                    {item.label}
                                                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                                                </div>
                                                {item.children && (
                                                    <div className="pl-4 pb-2">
                                                        {item.children.map((child) => (
                                                            <Link
                                                                key={child.label}
                                                                to={child.href}
                                                                className={`
                                  flex items-center gap-3 px-4 py-3 text-base
                                  ${location.pathname === child.href ? 'text-emerald-400' : 'text-zinc-400'}
                                `}
                                                            >
                                                                {child.icon}
                                                                {child.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Mobile Auth */}
                                <div className="mt-6 pt-6 border-t border-zinc-800">
                                    {user ? (
                                        <>
                                            <Link
                                                to="/dashboard"
                                                className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-white"
                                            >
                                                <LayoutDashboard className="w-5 h-5" />
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-red-400 w-full"
                                            >
                                                <LogOut className="w-5 h-5" />
                                                Đăng Xuất
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-white"
                                            >
                                                <LogIn className="w-5 h-5" />
                                                Đăng Nhập
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </nav>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================================================
// PREMIUM FOOTER - Functional with React Router
// ============================================================================

// Footer links with valid routes
const getFooterLinks = (isAuth: boolean) => [
    {
        title: 'Sản Phẩm',
        links: [
            { label: 'Marketplace', href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace' },
            { label: 'AI Coach', href: isAuth ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach' },
        ]
    },
    {
        title: 'Partner',
        links: [
            { label: 'Trở Thành Partner', href: '/venture' },
            { label: 'Leader Dashboard', href: isAuth ? '/dashboard/team' : '/login?redirect=/dashboard/team' },
            { label: 'Đăng Nhập', href: '/login' },
        ]
    },
    {
        title: 'Hỗ Trợ',
        links: [
            { label: 'Liên Hệ', href: 'mailto:hello@wellnexus.vn', external: true },
            { label: 'Hotline', href: 'tel:+84901234567', external: true },
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
    const { isAuthenticated } = useStore();
    const FOOTER_LINKS = getFooterLinks(isAuthenticated);

    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // Simulate newsletter subscription
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 3000);
        }
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
                                Đăng ký để nhận tin tức và ưu đãi đặc biệt từ WellNexus
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
                                className={`px-6 py-3 font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all ${subscribed
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {subscribed ? (
                                    <>✓ Đã Đăng Ký</>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span className="hidden sm:inline">Đăng Ký</span>
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-3 mb-6 group">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-2xl shadow-lg group-hover:shadow-emerald-500/30 transition-shadow">
                                W
                            </div>
                            <div>
                                <div className="font-bold text-xl text-white">WellNexus</div>
                                <div className="text-xs text-zinc-500">Social Commerce 2.0</div>
                            </div>
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-xs">
                            Hệ sinh thái Social Commerce tiên phong tại Đông Nam Á với AI-driven technology.
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
                                <span>Q1, TP.HCM, Vietnam</span>
                            </div>
                        </div>
                    </div>

                    {/* Link Columns - Using React Router Link for internal */}
                    {FOOTER_LINKS.map((section) => (
                        <div key={section.title}>
                            <h4 className="font-bold text-white mb-4">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        {'external' in link && link.external ? (
                                            <a
                                                href={link.href}
                                                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.href}
                                                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
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
                            <span>🔒 SSL</span>
                            <span>📜 ISO 27001</span>
                            <span>🏆 Top 10</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
