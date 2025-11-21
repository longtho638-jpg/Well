
import React, { useState } from 'react';
import { User } from '../../types';
import { formatVND } from '../../utils/format';
import { useTranslation } from '../../hooks';
import { motion } from 'framer-motion';
import { Copy, Trophy, Zap, ChevronRight, Check } from 'lucide-react';

interface Props {
  user: User;
}

export const HeroCard: React.FC<Props> = ({ user }) => {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);

  // Gamification Logic: Founder Club Quest
  const TARGET_VOLUME = 100000000; // 100M VND
  const progressRaw = (user.teamVolume / TARGET_VOLUME) * 100;
  const progressPercent = Math.min(progressRaw, 100);
  const remaining = Math.max(TARGET_VOLUME - user.teamVolume, 0);

  const referralLink = user.referralLink || `wellnexus.vn/ref/${user.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(`Copy this link: ${referralLink}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join WellNexus',
          text: 'Join me on WellNexus and start earning!',
          url: referralLink,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 relative overflow-hidden rounded-2xl shadow-xl group"
    >
        {/* Design System: Primary Gradient Background using Tailwind tokens */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-teal-900 z-0"></div>

        {/* Glassmorphism & Abstract Shapes */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-12 -mt-12 z-0"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-brand-accent opacity-10 rounded-full blur-3xl z-0"></div>

        <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="flex-1 w-full">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-brand-accent text-brand-primary text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                        <Zap className="w-3 h-3 fill-current" />
                        30-Day Challenge
                    </div>
                    <span className="text-teal-200/80 text-xs font-medium">
                      {t('dashboard.hero.daysLeft', { days: 18 })}
                    </span>
                </div>

                <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">
                  {t('dashboard.hero.roadToFounder')}
                </h2>
                <p className="text-teal-100 text-sm mb-8 max-w-lg leading-relaxed opacity-90">
                    Hit <span className="font-bold text-white">100M {t('dashboard.hero.teamVolume')}</span> to unlock the "Founder" badge and receive 2% Global Bonus Pool sharing.
                </p>

                {/* Progress Section */}
                <div className="mb-2 flex justify-between items-end text-xs font-semibold uppercase tracking-wide">
                    <span className="text-teal-200">{t('dashboard.hero.currentProgress')}</span>
                    <span className="text-brand-accent">{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="bg-black/30 rounded-full h-3 w-full max-w-lg mb-3 overflow-hidden border border-white/10 backdrop-blur-sm">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-brand-accent relative"
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </motion.div>
                </div>
                <p className="text-xs text-teal-200">
                    <span className="text-white font-bold">{formatVND(remaining)}</span> {t('dashboard.hero.remaining')}
                </p>
            </div>

            {/* Referral Action (Glassmorphism) */}
            <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl min-w-[280px] transition-transform hover:translate-y-[-2px]">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-teal-200 text-[10px] uppercase font-bold tracking-widest">
                      {t('referral.link.title')}
                    </p>
                    <Trophy className="w-4 h-4 text-brand-accent" />
                </div>

                <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl mb-4 border border-white/5 group-hover:border-white/20 transition-colors">
                    <code className="text-xs text-white truncate flex-1 font-mono">{referralLink}</code>
                    <button
                      onClick={handleCopyLink}
                      className="text-brand-accent hover:text-white transition-colors p-1"
                      aria-label={t('referral.link.copy')}
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>

                <button
                  onClick={handleShare}
                  className="w-full bg-brand-accent hover:bg-yellow-400 text-brand-primary font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 group-hover:shadow-yellow-500/20"
                >
                    {copied ? t('referral.link.copied') : t('referral.link.share')}
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    </motion.div>
  );
};
