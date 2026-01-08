
import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Cpu, Wifi, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

interface LogEntry {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    status: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

export const LiveConsole: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulate "The Bee" activity for WOW effect (since real traffic might be low)
    // In production, this would connect to Supabase Realtime
    useEffect(() => {
        const activities = [
            { agent: 'The Bee', action: 'SCAN_NETWORK', message: 'Scanning for new transactions...', status: 'info' },
            { agent: 'The Bee', action: 'HEARTBEAT', message: 'System healthy. Latency: 45ms', status: 'info' },
            { agent: 'The Bee', action: 'SYNC', message: 'Synchronizing with Edge Network...', status: 'info' },
            { agent: 'Gemini Coach', action: 'IDLE', message: 'Waiting for user interaction', status: 'warning' },
            { agent: 'Sales Copilot', action: 'TRAINING', message: 'Updating objection handling model...', status: 'info' },
        ];

        const addLog = () => {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 999),
                agent: randomActivity.agent,
                action: randomActivity.action,
                status: randomActivity.status as any,
                message: randomActivity.message
            };

            setLogs(prev => [...prev.slice(-20), newLog]); // Keep last 20 logs
        };

        // Initial population
        addLog();

        // Random interval
        const interval = setInterval(() => {
            if (Math.random() > 0.6) addLog();
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="w-full bg-black/90 rounded-xl border border-teal-500/30 overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.1)] font-mono text-xs md:text-sm relative group">
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>

            {/* Header */}
            <div className="bg-teal-950/50 border-b border-teal-500/30 p-3 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <div className="flex items-center gap-2 text-teal-400">
                        <Terminal className="w-4 h-4" />
                        <span className="font-bold tracking-wider">LIVE OPERATIONS // THE BEE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-teal-500/70 uppercase font-bold">
                    <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span>CPU: {Math.floor(Math.random() * 20 + 10)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        <span>NET: 12ms</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>ONLINE</span>
                    </div>
                </div>
            </div>

            {/* Console Body */}
            <div
                ref={scrollRef}
                className="h-64 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-teal-900 scrollbar-track-transparent"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-3 border-l-2 border-transparent hover:border-teal-500/50 pl-2 transition-colors"
                        >
                            <span className="text-teal-500/50 shrink-0">[{log.timestamp}]</span>
                            <div className="flex-1 break-all">
                                <span className={`font-bold mr-2 ${log.agent === 'The Bee' ? 'text-yellow-400' : 'text-purple-400'
                                    }`}>
                                    {log.agent}
                                </span>
                                <span className="text-teal-300/70 mr-2">::{log.action}</span>
                                <span className={`${log.status === 'error' ? 'text-red-400' :
                                        log.status === 'warning' ? 'text-yellow-400' : 'text-teal-100'
                                    }`}>
                                    {log.message}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Cursor Blinking */}
                <div className="flex items-center gap-2 text-teal-500 animate-pulse mt-2">
                    <span>_</span>
                </div>
            </div>
        </div>
    );
};
