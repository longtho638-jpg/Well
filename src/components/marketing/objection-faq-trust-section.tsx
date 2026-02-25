/**
 * ObjectionFaqTrustSection
 * CRO Phase 04: Preempt top 3 objections before CTA + cluster trust signals
 * Placed between TestimonialsCarousel and FeaturedProducts
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck, RefreshCw, Award, Users } from 'lucide-react';
import { useTranslation } from '../../hooks';

interface FaqItem {
  q: string;
  a: string;
}

export function ObjectionFaqTrustSection() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: t('landing.faq.q1'),
      a: t('landing.faq.a1'),
    },
    {
      q: t('landing.faq.q2'),
      a: t('landing.faq.a2'),
    },
    {
      q: t('landing.faq.q3'),
      a: t('landing.faq.a3'),
    },
  ];

  const trustItems = [
    { icon: ShieldCheck, label: t('landing.trust.noInventory') },
    { icon: RefreshCw, label: t('landing.trust.freeToJoin') },
    { icon: Award, label: t('landing.trust.certified') },
    { icon: Users, label: t('landing.trust.community') },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Trust cluster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16"
        >
          {trustItems.map(({ icon: Icon, label }, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-4 text-center"
            >
              <Icon className="w-6 h-6 text-emerald-400" />
              <span className="text-xs text-zinc-300 font-medium leading-tight">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* FAQ heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
            {t('landing.faq.title')}
          </h2>
          <p className="text-zinc-400 text-sm">{t('landing.faq.subtitle')}</p>
        </motion.div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left gap-4"
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                aria-expanded={openIdx === idx}
              >
                <span className="text-zinc-100 font-semibold text-sm sm:text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
