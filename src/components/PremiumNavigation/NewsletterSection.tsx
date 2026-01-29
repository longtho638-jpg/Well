import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send } from 'lucide-react';
import { useTranslation } from '@/hooks';

/**
 * Newsletter Subscription Section
 * Email newsletter signup with success state
 */
export default function NewsletterSection() {
  const { t } = useTranslation();
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
    <div className="relative border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              {t('premiumnavigation.newsletter')}
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">
              {t('premiumnavigation.nh_n_th_ng_tin')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{t('premiumnavigation.c_quy_n')}</span>
            </h3>
            <p className="text-zinc-400 max-w-md">
              {t('premiumnavigation.ng_k_nh_n_tin_t_c_u')}
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
                  {t('premiumnavigation.ng_k')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('premiumnavigation.ng_k_1')}
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
