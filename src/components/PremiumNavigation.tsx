/**
 * Premium Navigation Components - Phase 26
 * MAX LEVEL 2026 East Asian Brand Navigation
 * 
 * Features:
 * - Glassmorphism dropdowns with premium blur
 * - Zen divider aesthetics 
 * - Enhanced micro-interactions
 * - Smart auth-aware routing
 * - Living notification badge
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, ChevronDown, ChevronRight,
    Facebook, Instagram, Linkedin, Youtube, Twitter,
    Mail, Phone, MapPin, Send, ArrowUpRight,
    Sparkles, Users, Award, Globe, ShoppingBag,
    LogIn, LogOut, User, LayoutDashboard, Shield, Zap,
    Star, Heart, Crown, Gem
} from 'lucide-react';
import { useStore } from '../store';

// ============================================================================
// NAVIGATION ITEMS - Real Routes with Auth-Aware Logic
// ============================================================================

interface NavChild {
    label: string;
    href: string;
    icon: React.ReactNode;
    description: string;
    badge?: string;
    badgeColor?: string;
}

interface NavItem {
    label: string;
    href?: string;
    children?: NavChild[];
    highlight?: boolean;
}

// Dynamic navigation based on auth state
const getNavItems = (isAuth: boolean): NavItem[] => [
    {
        label: 'Sản Phẩm',
        children: [
            {
                label: 'Marketplace',
                href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace',
                icon: <ShoppingBag className="w-5 h-5" />,
                description: 'Siêu thị Wellness với 500+ sản phẩm độc quyền',
                badge: 'Hot',
                badgeColor: 'from-rose-500 to-orange-500'
            },
            {
                label: 'AI Health Coach',
                href: isAuth ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach',
                icon: <Sparkles className="w-5 h-5" />,
                description: 'Huấn luyện viên AI cá nhân hoá 24/7',
                badge: 'New',
                badgeColor: 'from-cyan-500 to-blue-500'
            },
        ]
    },
    {
        label: 'Partner',
        children: [
            {
                label: 'Venture Program',
                href: '/venture',
                icon: <Gem className="w-5 h-5" />,
                description: 'Gia nhập đội ngũ 200+ Co-Founders',
                badge: '🔥',
            },
            {
                label: 'Leader Dashboard',
                href: isAuth ? '/dashboard/team' : '/login?redirect=/dashboard/team',
                icon: <Crown className="w-5 h-5" />,
                description: 'Quản lý đội nhóm & Network',
            },
        ]
    },
    {
        label: 'Marketplace',
        href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace',
        highlight: true
    },
];

// ============================================================================
// PREMIUM HEADER - MAX LEVEL 2026
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
                        ? 'bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/50 shadow-2xl shadow-black/20'
                        : 'bg-gradient-to-b from-zinc-950/80 to-transparent backdrop-blur-md'
                    }
                `}
            >
                {/* Premium top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                                    W
                                </div>
                                {/* Subtle glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                            </motion.div>
                            <div className="hidden sm:block">
                                <div className="font-bold text-xl text-white tracking-tight">WellNexus</div>
                                <div className="text-[10px] text-emerald-400/80 font-medium tracking-widest uppercase">Social Commerce 2.0</div>
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
                                                flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl
                                                transition-all duration-300
                                                ${item.highlight
                                                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 text-emerald-400 border border-emerald-500/30'
                                                    : location.pathname === item.href
                                                        ? 'text-emerald-400 bg-emerald-500/10'
                                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            {item.highlight && <ShoppingBag className="w-4 h-4" />}
                                            {item.label}
                                            {item.highlight && (
                                                <motion.div
                                                    className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
                                                    animate={{ scale: [1, 1.3, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            )}
                                        </Link>
                                    ) : (
                                        <button
                                            className={`
                                                flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl
                                                transition-all duration-300
                                                ${activeDropdown === item.label
                                                    ? 'text-white bg-zinc-800'
                                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}
                                            `}
                                        >
                                            {item.label}
                                            {item.children && (
                                                <motion.div
                                                    animate={{ rotate: activeDropdown === item.label ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </motion.div>
                                            )}
                                        </button>
                                    )}

                                    {/* Premium Dropdown */}
                                    <AnimatePresence>
                                        {item.children && activeDropdown === item.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                className="absolute top-full left-0 pt-3 w-80"
                                            >
                                                <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl p-2 shadow-2xl shadow-black/40">
                                                    {/* Top accent */}
                                                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                                                    {item.children.map((child, idx) => (
                                                        <Link
                                                            key={child.label}
                                                            to={child.href}
                                                            className={`
                                                                flex items-start gap-4 p-4 rounded-xl transition-all duration-200 group
                                                                ${location.pathname === child.href
                                                                    ? 'bg-emerald-500/10'
                                                                    : 'hover:bg-zinc-800/50'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`
                                                                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                                                ${location.pathname === child.href
                                                                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-black'
                                                                    : 'bg-zinc-800 border border-zinc-700 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30'
                                                                }
                                                            `}>
                                                                {child.icon}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`
                                                                        text-sm font-semibold transition-colors
                                                                        ${location.pathname === child.href ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'}
                                                                    `}>
                                                                        {child.label}
                                                                    </span>
                                                                    {child.badge && (
                                                                        <span className={`
                                                                            px-2 py-0.5 text-[10px] font-bold rounded-full
                                                                            ${child.badgeColor
                                                                                ? `bg-gradient-to-r ${child.badgeColor} text-white`
                                                                                : 'bg-zinc-700 text-zinc-300'
                                                                            }
                                                                        `}>
                                                                            {child.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                                                    {child.description}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </nav>

                        {/* Auth Section */}
                        <div className="flex items-center gap-3">
                            {user ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800/50"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
                                            whileHover={{ scale: 1.02 }}
                                        >
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-black">
                                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                {/* Online indicator */}
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-900" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white max-w-[100px] truncate">
                                                    {user.email?.split('@')[0] || 'User'}
                                                </span>
                                                <span className="text-[10px] text-emerald-400">Premium Member</span>
                                            </div>
                                        </motion.div>
                                        <motion.button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
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
                                    <Link
                                        to="/login"
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-xl hover:bg-zinc-800/50"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Đăng Nhập
                                    </Link>
                                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            to="/login"
                                            className="relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all overflow-hidden group"
                                        >
                                            {/* Shine effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                            <Zap className="w-4 h-4" />
                                            Bắt Đầu Ngay
                                        </Link>
                                    </motion.div>
                                </>
                            )}

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/50 transition-colors"
                                aria-label="Toggle menu"
                            >
                                <motion.div
                                    animate={{ rotate: mobileOpen ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </motion.div>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 lg:hidden"
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 bg-zinc-950/98 backdrop-blur-2xl pt-24 px-6"
                        >
                            <nav className="flex flex-col gap-2">
                                {NAV_ITEMS.map((item) => (
                                    <div key={item.label}>
                                        {item.href ? (
                                            <Link
                                                to={item.href}
                                                className={`
                                                    flex items-center justify-between px-4 py-4 text-lg font-medium border-b border-zinc-800/50
                                                    ${location.pathname === item.href ? 'text-emerald-400' : 'text-white'}
                                                `}
                                            >
                                                {item.label}
                                                {item.highlight && (
                                                    <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg">Hot</span>
                                                )}
                                            </Link>
                                        ) : (
                                            <div className="border-b border-zinc-800/50">
                                                <div className="px-4 py-4 text-lg font-medium text-white flex items-center justify-between">
                                                    {item.label}
                                                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                                                </div>
                                                {item.children && (
                                                    <div className="pl-4 pb-4 space-y-2">
                                                        {item.children.map((child) => (
                                                            <Link
                                                                key={child.label}
                                                                to={child.href}
                                                                className={`
                                                                    flex items-center gap-3 px-4 py-3 rounded-xl
                                                                    ${location.pathname === child.href
                                                                        ? 'text-emerald-400 bg-emerald-500/10'
                                                                        : 'text-zinc-400 hover:bg-zinc-800/50'
                                                                    }
                                                                `}
                                                            >
                                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">
                                                                    {child.icon}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-white">{child.label}</div>
                                                                    <div className="text-xs text-zinc-500">{child.description}</div>
                                                                </div>
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
                                            <div className="flex items-center gap-4 px-4 py-4 bg-zinc-800/50 rounded-xl mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-lg font-bold text-black">
                                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{user.email?.split('@')[0]}</div>
                                                    <div className="text-sm text-emerald-400">Premium Member</div>
                                                </div>
                                            </div>
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
                                        <Link
                                            to="/login"
                                            className="flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-black bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Bắt Đầu Ngay
                                        </Link>
                                    )}
                                </div>
                            </nav>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ============================================================================
// PREMIUM FOOTER - MAX LEVEL 2026 East Asian Brand
// ============================================================================

const getFooterLinks = (isAuth: boolean) => [
    {
        title: 'Sản Phẩm',
        icon: <ShoppingBag className="w-4 h-4" />,
        links: [
            { label: 'Marketplace', href: isAuth ? '/dashboard/marketplace' : '/login?redirect=/dashboard/marketplace' },
            { label: 'AI Health Coach', href: isAuth ? '/dashboard/health-coach' : '/login?redirect=/dashboard/health-coach' },
        ]
    },
    {
        title: 'Partner',
        icon: <Users className="w-4 h-4" />,
        links: [
            { label: 'Venture Program', href: '/venture' },
            { label: 'Leader Dashboard', href: isAuth ? '/dashboard/team' : '/login?redirect=/dashboard/team' },
        ]
    },
    {
        title: 'Company',
        icon: <Globe className="w-4 h-4" />,
        links: [
            { label: 'About Us', href: '/venture' },
            { label: 'Careers', href: '/venture' },
        ]
    }
];

const SOCIAL_LINKS = [
    { icon: Facebook, href: 'https://facebook.com/wellnexus', label: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: Instagram, href: 'https://instagram.com/wellnexus', label: 'Instagram', color: 'hover:bg-pink-600' },
    { icon: Linkedin, href: 'https://linkedin.com/company/wellnexus', label: 'LinkedIn', color: 'hover:bg-blue-700' },
    { icon: Youtube, href: 'https://youtube.com/@wellnexus', label: 'YouTube', color: 'hover:bg-red-600' },
    { icon: Twitter, href: 'https://twitter.com/wellnexus', label: 'Twitter', color: 'hover:bg-sky-500' },
];

export function PremiumFooter() {
    const { isAuthenticated } = useStore();
    const FOOTER_LINKS = getFooterLinks(isAuthenticated);

    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubscribed(true);
            setEmail('');
            setTimeout(() => setSubscribed(false), 3000);
        }
    };

    return (
        <footer className="relative bg-zinc-950 overflow-hidden">
            {/* Ambient gradient */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

            {/* Zen divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                </div>
                <div className="relative flex justify-center">
                    <div className="bg-zinc-950 px-6">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Newsletter Section */}
            <div className="relative border-b border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                                <Mail className="w-4 h-4" />
                                Newsletter
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-3">
                                Nhận Thông Tin <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Độc Quyền</span>
                            </h3>
                            <p className="text-zinc-400 max-w-md">
                                Đăng ký để nhận tin tức, ưu đãi đặc biệt và insights từ đội ngũ WellNexus
                            </p>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex gap-3 w-full max-w-lg">
                            <div className="relative flex-1">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                                    required
                                />
                            </div>
                            <motion.button
                                type="submit"
                                className={`
                                    px-8 py-4 font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all min-w-[140px] justify-center
                                    ${subscribed
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-emerald-500/25'
                                    }
                                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {subscribed ? (
                                    <>
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring' }}
                                        >
                                            ✓
                                        </motion.span>
                                        Đã Đăng Ký
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Đăng Ký
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-4 mb-8 group">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-black font-bold text-2xl shadow-lg group-hover:shadow-emerald-500/40 transition-shadow">
                                    W
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                            </motion.div>
                            <div>
                                <div className="font-bold text-2xl text-white">WellNexus</div>
                                <div className="text-xs text-emerald-400/80 font-medium tracking-widest uppercase">Social Commerce 2.0</div>
                            </div>
                        </Link>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
                            Hệ sinh thái Social Commerce tiên phong tại Đông Nam Á với AI-driven technology. Đồng hành cùng 50,000+ Partners.
                        </p>

                        {/* Contact */}
                        <div className="space-y-4">
                            <a href="mailto:hello@wellnexus.vn" className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="text-sm">hello@wellnexus.vn</span>
                            </a>
                            <a href="tel:+84901234567" className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <span className="text-sm">+84 901 234 567</span>
                            </a>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="text-sm">Q1, TP.HCM, Vietnam</span>
                            </div>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {FOOTER_LINKS.map((section) => (
                        <div key={section.title}>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center text-emerald-400">
                                    {section.icon}
                                </div>
                                <h4 className="font-bold text-white">{section.title}</h4>
                            </div>
                            <ul className="space-y-4">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group"
                                        >
                                            <ChevronRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Copyright */}
                        <div className="text-sm text-zinc-500 text-center md:text-left">
                            © {new Date().getFullYear()} WellNexus. All rights reserved.
                            <span className="text-zinc-600 mx-2">|</span>
                            <span className="text-emerald-400/60">Made with 💚 in Vietnam</span>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-2">
                            {SOCIAL_LINKS.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`
                                            w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/50 
                                            flex items-center justify-center text-zinc-400 
                                            ${social.color} hover:text-white hover:border-transparent
                                            transition-all
                                        `}
                                        whileHover={{ scale: 1.1, y: -3 }}
                                        whileTap={{ scale: 0.95 }}
                                        aria-label={social.label}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </motion.a>
                                );
                            })}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-zinc-400">SSL Secured</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                <Award className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-zinc-400">Top 10 East Asia</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
