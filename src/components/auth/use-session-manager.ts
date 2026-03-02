/**
 * useSessionManager hook
 * Encapsulates state and handlers for SessionManager component
 */

import { useState, useEffect, useRef } from 'react';
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

interface UseSessionManagerProps {
    sessions: Session[];
    onRevokeSession?: (sessionId: string) => Promise<void>;
    onRevokeAllOthers?: () => Promise<void>;
}

export function useSessionManager({
    sessions,
    onRevokeSession,
    onRevokeAllOthers,
}: UseSessionManagerProps) {
    const { t } = useTranslation();
    const [localSessions, setLocalSessions] = useState<Session[]>(sessions);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [revokingAll, setRevokingAll] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setLocalSessions(sessions);
    }, [sessions]);

    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

    const handleRevoke = async (sessionId: string) => {
        setRevoking(sessionId);
        try {
            if (onRevokeSession) {
                await onRevokeSession(sessionId);
            }
            setLocalSessions(prev => prev.filter(s => s.id !== sessionId));
            setSuccess(t('sessionmanager.revoked_success'));
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setSuccess(null), 3000);
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
            setLocalSessions(prev => prev.filter(s => s.isCurrent));
            setSuccess(t('sessionmanager.revoked_all_success'));
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setSuccess(null), 3000);
        } catch (error) {
            authLogger.error('Failed to revoke sessions', error);
        } finally {
            setRevokingAll(false);
        }
    };

    const otherSessions = localSessions.filter(s => !s.isCurrent);

    return {
        localSessions,
        revoking,
        revokingAll,
        success,
        otherSessions,
        handleRevoke,
        handleRevokeAll,
    };
}
