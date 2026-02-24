import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, LayoutDashboard, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { User } from '@/types';

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

interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
}

/**
 * Mobile Menu Component
 * Full-screen mobile navigation with auth section
 */
export default function MobileMenu({ isOpen, navItems, isAuthenticated, user, onLogout }: MobileMenuProps) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <AnimatePresence>
      {isOpen && (
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
            <nav className="flex flex-col gap-2" aria-label={t('premiumnavigation.mobileNavigation')}>
              {navItems.map((item) => (
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
                        <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg">{t('premiumnavigation.hot')}</span>
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
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-4 px-4 py-4 bg-zinc-800/50 rounded-xl mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-lg font-bold text-black">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.email?.split('@')[0]}</div>
                        <div className="text-sm text-emerald-400">{t('premiumnavigation.premium_member_1')}</div>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-white"
                    >
                      <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
                      {t('premiumnavigation.dashboard')}
                    </Link>
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-3 px-4 py-4 text-lg font-medium text-red-400 w-full"
                      aria-label={t('premiumnavigation.ng_xu_t')}
                    >
                      <LogOut className="w-5 h-5" aria-hidden="true" />
                      {t('premiumnavigation.ng_xu_t')}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-black bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl"
                  >
                    <Zap className="w-5 h-5" aria-hidden="true" />
                    {t('premiumnavigation.b_t_u_ngay')}
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
