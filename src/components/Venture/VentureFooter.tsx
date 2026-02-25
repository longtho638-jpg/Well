import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface VentureFooterProps {
    content: {
        logo: string;
        tagline: string;
        newsletter: {
            title: string;
            placeholder: string;
        };
        social: {
            facebook: string;
            instagram: string;
            linkedin: string;
        };
        copyright: string;
    };
}

export const VentureFooter: React.FC<VentureFooterProps> = ({ content }) => {
    const { t } = useTranslation();
    return (
        <footer className="relative bg-zinc-950 text-white pt-32 pb-16 border-t border-white/5 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
                    <div className="lg:col-span-8 flex flex-col justify-between">
                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center text-zinc-950 font-black text-3xl italic shadow-2xl">
                                    W
                                </div>
                                <div>
                                    <div className="font-black text-2xl uppercase tracking-tighter italic">
                                        {content.logo}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic leading-none">
                                        {t('venture.footer.strategic_ecosystem_builder')}</div>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-2xl italic">
                                "{content.tagline}"
                            </p>
                        </div>

                        <div className="flex items-center gap-6 mt-12">
                            <SocialLink icon={Facebook} href={content.social.facebook} label="Facebook" />
                            <SocialLink icon={Instagram} href={content.social.instagram} label="Instagram" />
                            <SocialLink icon={Linkedin} href={content.social.linkedin} label="LinkedIn" />
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                        <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
                            {content.newsletter.title}
                        </h2>
                        <div className="relative group">
                            <input
                                type="email"
                                id="venture-newsletter-email"
                                aria-label={content.newsletter.placeholder}
                                placeholder={content.newsletter.placeholder}
                                className="w-full bg-zinc-900 border border-white/5 px-8 py-5 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:bg-zinc-800 transition-all font-mono text-sm"
                            />
                            <motion.button
                                whileHover={{ x: 5 }}
                                aria-label="Subscribe to newsletter"
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-zinc-950 shadow-xl"
                            >
                                <Mail size={18} />
                            </motion.button>
                        </div>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">
                            {t('venture.footer.subscribe_for_exclusive_intake')}</p>
                    </div>
                </div>

                <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
                        {content.copyright}
                    </div>
                    <div className="flex items-center gap-10">
                        <FooterLink label={t('venture.footer.privacy')} />
                        <FooterLink label={t('venture.footer.terms')} />
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialLink = ({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }) => (
    <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        whileHover={{ y: -5, scale: 1.1 }}
        className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:border-teal-500/30 transition-all shadow-xl"
    >
        <Icon className="w-6 h-6 text-zinc-400 hover:text-white transition-colors" />
    </motion.a>
);

const FooterLink = ({ label }: { label: string }) => (
    <button className="text-[10px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest italic transition-colors">
        {label}
    </button>
);
