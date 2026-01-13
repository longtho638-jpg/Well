import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { formatVND } from '@/utils/format';

interface SimulationPanelProps {
    simulation: {
        simPartners: number;
        setSimPartners: (val: number) => void;
        simAOV: number;
        setSimAOV: (val: number) => void;
        fixedCost: number;
        setFixedCost: (val: number) => void;
        simGMV: number;
        simTotalPayout: number;
        simProfit: number;
        profitMargin: number;
    };
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({ simulation }) => {
    return (
        <div className="bg-zinc-900 border border-zinc-100/10 p-8 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <BarChart3 size={100} className="text-[#FFBF00]" />
            </div>

            <h3 className="text-xl font-black text-[#FFBF00] mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                <TrendingUp size={24} /> VC Simulation Engine
            </h3>

            <div className="space-y-10">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active Distribution Node</label>
                        <span className="text-2xl font-black text-white">{simulation.simPartners.toLocaleString()} Nodes</span>
                    </div>
                    <input type="range" min="100" max="5000" step="100" value={simulation.simPartners} onChange={(e) => simulation.setSimPartners(Number(e.target.value))} className="w-full accent-white h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Target AOV</label>
                        <input type="number" value={simulation.simAOV} onChange={(e) => simulation.setSimAOV(Number(e.target.value))} className="bg-transparent text-xl font-black text-white w-full border-b border-white/10 focus:border-teal-500 outline-none" />
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Monthly Fixed</label>
                        <input type="number" value={simulation.fixedCost} onChange={(e) => simulation.setFixedCost(Number(e.target.value))} className="bg-transparent text-xl font-black text-white w-full border-b border-white/10 focus:border-teal-500 outline-none" />
                    </div>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-8">
                    <div className="flex justify-between items-center group">
                        <span className="text-xs font-bold text-zinc-400">PROJECTED GMV</span>
                        <span className="text-2xl font-black text-white tracking-tighter group-hover:text-[#FFBF00] transition-colors">{formatVND(simulation.simGMV)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-400">SYSTEM PAYOUT</span>
                        <span className="text-xl font-black text-rose-500 tracking-tighter">-{formatVND(simulation.simTotalPayout)}</span>
                    </div>

                    <div className="mt-8 p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex justify-between items-end relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Projected EBITDA</p>
                                <h4 className={`text-3xl font-black tracking-tighter ${simulation.simProfit > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                    {formatVND(simulation.simProfit)}
                                </h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Margin</p>
                                <span className="text-xl font-black text-white italic">{simulation.profitMargin.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
