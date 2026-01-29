import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin, Youtube, Twitter, Shield, Award } from 'lucide-react';
import { useTranslation } from '@/hooks';

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/wellnexus', label: 'Facebook', color: 'hover:bg-blue-600' },
  { icon: Instagram, href: 'https://instagram.com/wellnexus', label: 'Instagram', color: 'hover:bg-pink-600' },
  { icon: Linkedin, href: 'https://linkedin.com/company/wellnexus', label: 'LinkedIn', color: 'hover:bg-blue-700' },
  { icon: Youtube, href: 'https://youtube.com/@wellnexus', label: 'YouTube', color: 'hover:bg-red-600' },
  { icon: Twitter, href: 'https://twitter.com/wellnexus', label: 'Twitter', color: 'hover:bg-sky-500' },
];

/**
 * Footer Bottom Bar Component
 * Copyright, social links, and trust badges
 */
export default function FooterBottomBar() {
  const { t } = useTranslation();

  return (
    <div className="border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <div className="text-sm text-zinc-500 text-center md:text-left">
            © {new Date().getFullYear()} {t('premiumnavigation.wellnexus_all_rights_reserved')}
            <span className="text-zinc-600 mx-2">|</span>
            <span className="text-emerald-400/60">{t('premiumnavigation.made_with_in_vietnam')}</span>
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
              <span className="text-xs text-zinc-400">{t('premiumnavigation.ssl_secured')}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-400">{t('premiumnavigation.top_10_east_asia')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
