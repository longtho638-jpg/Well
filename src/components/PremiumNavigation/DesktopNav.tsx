import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/hooks';

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

interface DesktopNavProps {
  navItems: NavItem[];
}

/**
 * Desktop Navigation with Premium Dropdowns
 * Glassmorphism dropdowns with smart hover interactions
 */
export default function DesktopNav({ navItems }: DesktopNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent, label: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveDropdown(activeDropdown === label ? null : label);
      } else if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };

  return (
    <nav className="hidden lg:flex items-center gap-1" aria-label={t('nav.desktop_navigation')}>
      <ul className="flex items-center gap-1" role="menubar">
        {navItems.map((item) => (
          <li
            key={item.label}
            className="relative"
            onMouseEnter={() => item.children && setActiveDropdown(item.label)}
            onMouseLeave={() => setActiveDropdown(null)}
            role="none"
          >
            {item.href ? (
              <Link
                to={item.href}
                role="menuitem"
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
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={activeDropdown === item.label}
                onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                onKeyDown={(e) => handleKeyDown(e, item.label)}
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
                  role="menu"
                >
                  <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl p-2 shadow-2xl shadow-black/40">
                    {/* Top accent */}
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        role="menuitem"
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
          </li>
        ))}
      </ul>
    </nav>
  );
}
