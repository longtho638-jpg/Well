import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  icon: React.ReactNode;
  links: FooterLink[];
}

interface FooterContentProps {
  footerLinks: FooterSection[];
}

/**
 * Footer Content Component
 * Brand column, link columns, and contact info
 */
export default function FooterContent({ footerLinks }: FooterContentProps) {
  const { t } = useTranslation();

  return (
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
              <div className="font-bold text-2xl text-white">{t('premiumnavigation.wellnexus_1')}</div>
              <div className="text-xs text-emerald-400/80 font-medium tracking-widest uppercase">{t('premiumnavigation.social_commerce_2_0_1')}</div>
            </div>
          </Link>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
            {t('premiumnavigation.h_sinh_th_i_social_commerce_t')}
          </p>

          {/* Contact */}
          <div className="space-y-4">
            <a href="mailto:wellnexusvn@gmail.com" className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm">{t('premiumnavigation.hello_wellnexus_vn')}</span>
            </a>
            <a href="tel:+84918876586" className="flex items-center gap-3 text-zinc-400 hover:text-emerald-400 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-sm">{t('premiumnavigation.84_901_234_567')}</span>
            </a>
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm">{t('premiumnavigation.q1_tp_hcm_vietnam')}</span>
            </div>
          </div>
        </div>

        {/* Link Columns */}
        {footerLinks.map((section) => (
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
  );
}
