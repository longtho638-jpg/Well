import { useState, useEffect, useCallback } from 'react';

export interface LogEntry {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    status: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

const ACTIVITIES = [
    { agent: 'The Bee', action: 'SCAN_NETWORK', message: 'Scanning for new transactions...', status: 'info' },
    { agent: 'The Bee', action: 'HEARTBEAT', message: 'System healthy. Latency: 42ms', status: 'info' },
    { agent: 'The Bee', action: 'SYNC', message: 'Synchronizing with Edge Network...', status: 'info' },
    { agent: 'Gemini Coach', action: 'IDLE', message: 'Waiting for user interaction', status: 'warning' },
    { agent: 'Sales Copilot', action: 'TRAINING', message: 'Updating objection handling model...', status: 'info' },
    { agent: 'Cyber Sentinel', action: 'SHIELD', message: 'Deflecting unauthorized access attempt', status: 'success' },
];

export function useLiveConsole() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback(() => {
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        const newLog: LogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 999),
            agent: activity.agent,
            action: activity.action,
            status: activity.status as LogEntry['status'],
            message: activity.message
        };

        setLogs(prev => [...prev.slice(-24), newLog]);
    }, []);

    useEffect(() => {
        addLog();
        const interval = setInterval(() => {
            if (Math.random() > 0.5) addLog();
        }, 2200);
        return () => clearInterval(interval);
    }, [addLog]);

    return {
        logs,
        addLog
    };
}
