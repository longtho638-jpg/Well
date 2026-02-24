/**
 * Session Manager Component
 * Phase 1: Auth Max Level
 * 
 * Enterprise-grade session management displaying:
 * - Active sessions across devices
 * - Login timestamps and locations
 * - Ability to revoke sessions
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Monitor,
    Smartphone,
    Globe,
    Clock,
    Shield,
    LogOut,
    CheckCircle,
    AlertCircle,
    Loader2,
    MapPin,
} from 'lucide-react';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';

export interface Session {
    id: string;
    device: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    location: string;
    ip: string;
    lastActive: string;
    isCurrent: boolean;
    createdAt: string;
}

interface SessionManagerProps {
    sessions?: Session[];
    onRevokeSession?: (sessionId: string) => Promise<void>;
    onRevokeAllOthers?: () => Promise<void>;
}

// Mock sessions for demo mode
const MOCK_SESSIONS: Session[] = [
    {
        id: 'current-session',
        device: 'desktop',
        browser: 'Chrome on macOS',
        location: 'Ho Chi Minh City, VN',
        ip: '113.xxx.xxx.xxx',
        lastActive: 'Active now',
        isCurrent: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'mobile-session',
        device: 'mobile',
        browser: 'Safari on iOS',
        location: 'Hanoi, VN',
        ip: '14.xxx.xxx.xxx',
        lastActive: '2 hours ago',
        isCurrent: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
];

const DeviceIcon: React.FC<{ device: Session['device'] }> = ({ device }) => {
    switch (device) {
        case 'mobile':
            return <Smartphone className="w-5 h-5" />;
        case 'tablet':
            return <Monitor className="w-5 h-5" />;
        default:
            return <Monitor className="w-5 h-5" />;
    }
};

export function SessionManager({
    sessions = import.meta.env.DEV ? MOCK_SESSIONS : [],
    onRevokeSession,
    onRevokeAllOthers,
}: SessionManagerProps) {
    const { t } = useTranslation();
    const [localSessions, setLocalSessions] = useState<Session[]>(sessions);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        setLocalSessions(sessions);
    }, [sessions]);

    const handleRevoke = async (sessionId: string) => {
        setRevoking(sessionId);
        try {
            if (onRevokeSession) {
                await onRevokeSession(sessionId);
            }
            // Optimistically remove from UI
            setLocalSessions(prev => prev.filter(s => s.id !== sessionId));
            setSuccess(t('sessionmanager.revoked_success'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            authLogger.error('Failed to revoke session', error);
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeAll = async () => {
        setRevokingAll(true);
        try {
            if (onRevokeAllOthers) {
                await onRevokeAllOthers();
            }
            // Keep only current session
            setLocalSessions(prev => prev.filter(s => s.isCurrent));
            setSuccess(t('sessionmanager.revoked_all_success'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            authLogger.error('Failed to revoke sessions', error);
        } finally {
            setRevokingAll(false);
        }
    };

    const otherSessions = localSessions.filter(s => !s.isCurrent);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-100">{t('sessionmanager.active_sessions')}</h3>
                        <p className="text-sm text-zinc-500">
                            {localSessions.length} {t('sessionmanager.device')}{localSessions.length !== 1 ? 's' : ''} {t('sessionmanager.connected')}</p>
                    </div>
                </div>

                {otherSessions.length > 0 && (
                    <button
                        onClick={handleRevokeAll}
                        disabled={revokingAll}
                        className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {revokingAll ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t('sessionmanager.sign_out_all_others')
                        )}
                    </button>
                )}
            </div>

            {/* Success Message */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3"
                    >
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <p className="text-sm text-emerald-300">{success}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sessions List */}
            <div className="space-y-3">
                {localSessions.map((session) => (
                    <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl border transition-colors ${session.isCurrent
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                {/* Device Icon */}
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.isCurrent
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-zinc-800 text-zinc-400'
                                        }`}
                                >
                                    <DeviceIcon device={session.device} />
                                </div>

                                {/* Session Info */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-zinc-100">
                                            {session.browser}
                                        </span>
                                        {session.isCurrent && (
                                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded-full">
                                                {t('sessionmanager.this_device')}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {session.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Globe className="w-3.5 h-3.5" />
                                            {session.ip}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {session.isCurrent ? (
                                            <span className="text-emerald-400">{t('sessionmanager.active_now')}</span>
                                        ) : (
                                            <span>{t('sessionmanager.last_active')}{session.lastActive}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Revoke Button */}
                            {!session.isCurrent && (
                                <button
                                    onClick={() => handleRevoke(session.id)}
                                    disabled={revoking === session.id}
                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Sign out this device"
                                >
                                    {revoking === session.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <LogOut className="w-5 h-5" />
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Security Note */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="text-amber-200 font-medium">{t('sessionmanager.security_note')}</p>
                        <p className="text-zinc-400 mt-1">
                            {t('sessionmanager.if_you_don_t_recognize_a_sessi')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SessionManager;
