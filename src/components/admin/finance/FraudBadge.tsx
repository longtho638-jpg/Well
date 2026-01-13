import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

export const FraudBadge: React.FC<{ score: number }> = ({ score }) => {
    if (score >= 70) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 shadow-lg shadow-rose-900/20 animate-pulse">
                <ShieldAlert size={12} />
                Critical Risk
            </div>
        );
    }
    if (score >= 40) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 shadow-lg shadow-amber-900/20">
                <AlertTriangle size={12} />
                Suspected
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-900/10">
            <CheckCircle size={12} />
            Verified
        </div>
    );
};
