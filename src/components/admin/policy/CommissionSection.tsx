import React from 'react';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface CommissionSectionProps {
    commissions: {
        retailComm: number;
        setRetailComm: (val: number) => void;
        agencyBonus: number;
        setAgencyBonus: (val: number) => void;
        elitePool: number;
        setElitePool: (val: number) => void;
        totalPayoutPercent: number;
        isRisk: boolean;
    };
}

export const CommissionSection: React.FC<CommissionSectionProps> = ({ commissions }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl">
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                    <DollarSign size={20} />
                </div>
                {t('commissionsection.commission_architecture')}</h3>

            <div className="space-y-8">
                {[
                    { label: 'Retail Discount', value: commissions.retailComm, setter: commissions.setRetailComm, min: 20, max: 35, color: 'text-teal-400', accent: 'accent-teal-500' },
                    { label: 'Agency Bonus', value: commissions.agencyBonus, setter: commissions.setAgencyBonus, min: 5, max: 15, color: 'text-blue-400', accent: 'accent-blue-500' },
                    { label: 'Elite Zodiac Pool', value: commissions.elitePool, setter: commissions.setElitePool, min: 1, max: 5, color: 'text-purple-400', accent: 'accent-purple-500' }
                ].map((item, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">{item.label}</label>
                            <span className={`text-2xl font-black tracking-tighter ${item.color}`}>{item.value}%</span>
                        </div>
                        <input
                            type="range"
                            min={item.min}
                            max={item.max}
                            value={item.value}
                            onChange={(e) => item.setter(Number(e.target.value))}
                            className={`w-full ${item.accent} h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer`}
                        />
                    </div>
                ))}

                <div className={`mt-10 p-6 rounded-3xl border transition-all duration-500 ${commissions.isRisk ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t('commissionsection.total_system_payout_threshold')}</span>
                        <span className={`text-4xl font-black tracking-tighter ${commissions.isRisk ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {commissions.totalPayoutPercent}%
                        </span>
                    </div>
                    {commissions.isRisk && (
                        <div className="flex items-center gap-3 text-rose-500 font-bold text-xs mt-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 animate-pulse">
                            <AlertTriangle size={16} />
                            {t('commissionsection.max_risk_operational_margin_c')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};
