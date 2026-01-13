/**
 * Live Console - Real-time Telemetry (Refactored)
 * Phase 4: Mission Control surveillance for VC/IPO readiness.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Wifi, Activity, ShieldCheck } from 'lucide-react';

// Hooks
import { useLiveConsole, LogEntry } from '@/hooks/useLiveConsole';
import { useTranslation } from '@/hooks';

// ============================================================
// SUB-COMPONENTS
// ============================================================

const LogLine: React.FC<{ log: LogEntry }> = ({ log }) => {
    const { t } = useTranslation();
    const statusColors = {
        info: 'text-teal-400/80',
        success: 'text-emerald-400',
        warning: 'text-amber-400',
        error: 'text-rose-400'
    };

    const agentColor = log.agent === 'The Bee' ? 'text-teal-300' : 'text-purple-400';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4 py-1.5 border-l-2 border-transparent hover:border-teal-500/30 pl-3 transition-all group font-mono"
        >
            <span className="text-[10px] text-zinc-600 shrink-0 font-black">[{log.timestamp}]</span>
            <div className="flex-1 text-[11px] leading-relaxed break-all">
                <span className={`font-black mr-2 uppercase tracking-tighter ${agentColor}`}>
                    {log.agent}
                </span>
                <span className="text-zinc-700 mr-2">::{log.action}</span>
                <span className={`font-medium ${statusColors[log.status]}`}>
                    {log.message}
                </span>
            </div>
            {log.status === 'success' && <ShieldCheck size={12} className="text-emerald-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </motion.div>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const LiveConsole: React.FC = () => {
    const { t } = useTranslation();
    const { logs } = useLiveConsole();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full bg-zinc-950 rounded-[2rem] border border-teal-500/20 overflow-hidden shadow-2xl shadow-teal-500/5 relative group">
            {/* CRT Overlay Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-10"></div>

            {/* Header Stage */}
            <div className="bg-zinc-900/50 border-b border-teal-500/10 p-5 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50"></div>
                    </div>
                    <div className="flex items-center gap-3 text-teal-500">
                        <Terminal size={18} />
                        <span className="font-black tracking-[0.2em] text-[10px] uppercase italic text-teal-400">{t('liveconsole.live_operations_node_agent')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-[9px] font-black text-teal-500/50 uppercase tracking-widest hidden sm:flex">
                    <div className="flex items-center gap-2"><Cpu size={12} /> {t('liveconsole.sync_active')}</div>
                    <div className="flex items-center gap-2"><Wifi size={12} /> {t('liveconsole.lat_4ms')}</div>
                    <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        {t('liveconsole.encrypted')}</div>
                </div>
            </div>

            {/* Console Output */}
            <div
                ref={scrollRef}
                className="h-72 overflow-y-auto p-6 scroll-smooth scrollbar-thin scrollbar-thumb-teal-500/10 scrollbar-track-transparent"
            >
                <div className="space-y-1">
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <LogLine key={log.id} log={log} />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Blinking Prompt */}
                <div className="flex items-center gap-2 text-teal-500 mt-4 px-3">
                    <span className="text-[10px] font-black">{t('liveconsole.wellnexus_bee')}</span>
                    <motion.div
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-2 h-4 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                    />
                </div>
            </div>

            {/* Footer Telemetry */}
            <div className="bg-teal-500/5 border-t border-teal-500/10 px-6 py-2 flex justify-between items-center text-[8px] font-black text-teal-500/30 uppercase tracking-[0.3em]">
                {/* <div>BEE-AGENT CORE V4.2.0-STABLE</div> */}
                <span>{t('liveconsole.bee_agent_core_v4_2_0_stable')}</span>
                <span>{t('liveconsole.tx')}{Math.floor(Math.random() * 9999)} {t('liveconsole.bps')}</span>
            </div>
        </div>
    );
};
