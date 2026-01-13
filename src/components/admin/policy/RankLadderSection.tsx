import React from 'react';
import { Target } from 'lucide-react';
import { RankUpgrade } from '@/services/policyService';

interface RankLadderSectionProps {
    rankUpgrades: RankUpgrade[];
    updateRankUpgrade: (index: number, updates: Partial<RankUpgrade['conditions']>) => void;
}

export const RankLadderSection: React.FC<RankLadderSectionProps> = ({ rankUpgrades, updateRankUpgrade }) => {
    return (
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-xl font-black text-purple-400 mb-8 flex items-center gap-3 uppercase tracking-tighter italic">
                <Target size={24} /> Rank Migration Ladder
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Target Rank</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Sales REQ (VND)</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Team Volume</th>
                            <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Downlines</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-bold">
                        {rankUpgrades.map((upgrade, index) => (
                            <tr key={index} className="group hover:bg-white/[0.02] transition-all duration-500">
                                <td className="py-4 text-white uppercase tracking-tighter italic">{upgrade.name}</td>
                                <td className="py-2">
                                    <input
                                        type="number"
                                        value={upgrade.conditions.salesRequired || 0}
                                        onChange={(e) => updateRankUpgrade(index, { salesRequired: Number(e.target.value) })}
                                        className="bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none w-32 font-mono text-xs text-zinc-300 transition-all"
                                    />
                                </td>
                                <td className="py-2">
                                    <input
                                        type="number"
                                        value={upgrade.conditions.teamVolumeRequired || 0}
                                        onChange={(e) => updateRankUpgrade(index, { teamVolumeRequired: Number(e.target.value) })}
                                        className="bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none w-32 font-mono text-xs text-zinc-300 transition-all"
                                    />
                                </td>
                                <td className="py-2">
                                    <input
                                        type="number"
                                        value={upgrade.conditions.directDownlinesRequired || 0}
                                        onChange={(e) => updateRankUpgrade(index, { directDownlinesRequired: Number(e.target.value) })}
                                        className="bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-1.5 focus:border-purple-500 outline-none w-20 font-mono text-xs text-zinc-300 transition-all"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
