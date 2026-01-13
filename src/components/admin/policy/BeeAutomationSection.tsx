import React from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface BeeAutomationSectionProps {
    beeAgent: {
        ctvCommission: number;
        setCtvCommission: (val: number) => void;
        startupCommission: number;
        setStartupCommission: (val: number) => void;
        sponsorBonus: number;
        setSponsorBonus: (val: number) => void;
        rankUpThreshold: number;
        setRankUpThreshold: (val: number) => void;
    };
}

export const BeeAutomationSection: React.FC<BeeAutomationSectionProps> = ({ beeAgent }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <Zap size={120} className="text-amber-500" />
            </div>

            <h3 className="text-xl font-black text-amber-500 mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                <Zap size={24} className="animate-pulse" />
                {t('beeautomationsection.bee_engine_automation')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-3 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('beeautomationsection.ctv_commission_r_8')}</label>
                            <span className="text-xl font-black text-amber-500">{beeAgent.ctvCommission}%</span>
                        </div>
                        <input type="range" min="15" max="25" value={beeAgent.ctvCommission} onChange={(e) => beeAgent.setCtvCommission(Number(e.target.value))} className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer" />
                    </div>
                    <div>
                        <div className="flex justify-between mb-3 px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('beeautomationsection.sponsor_bonus_amb')}</label>
                            <span className="text-xl font-black text-purple-400">{beeAgent.sponsorBonus}%</span>
                        </div>
                        <input type="range" min="5" max="12" value={beeAgent.sponsorBonus} onChange={(e) => beeAgent.setSponsorBonus(Number(e.target.value))} className="w-full accent-purple-500 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer" />
                    </div>
                </div>

                <div className="bg-zinc-950/50 p-6 rounded-3xl border border-white/5 space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('beeautomationsection.auto_upgrade_threshold')}</label>
                    <div className="text-3xl font-black text-white tracking-widest font-mono">
                        <input
                            type="number"
                            value={beeAgent.rankUpThreshold}
                            onChange={(e) => beeAgent.setRankUpThreshold(Number(e.target.value))}
                            className="bg-transparent w-full border-b border-amber-500/20 focus:border-amber-500 outline-none transition-all py-2"
                        />
                        <div className="text-[10px] text-amber-500 mt-2">{t('beeautomationsection.vnd_sales_ctv_startup')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
