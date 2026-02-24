import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { User } from '@/types';
import { uiLogger } from '@/utils/logger';
import { useTranslation } from './useTranslation';

export function useHeroCard(user: User) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    // Gamification Logic: Founder Club Quest
    const TARGET_VOLUME = 100000000; // 100M VND

    const progressPercent = useMemo(() => {
        const raw = (user.teamVolume / TARGET_VOLUME) * 100;
        return Math.min(raw, 100);
    }, [user.teamVolume]);

    const remaining = useMemo(() => {
        return Math.max(TARGET_VOLUME - user.teamVolume, 0);
    }, [user.teamVolume]);

    const referralLink = useMemo(() => {
        return user.referralLink || `wellnexus.vn/ref/${user.id}`;
    }, [user.referralLink, user.id]);

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            if (!mountedRef.current) return;
            setCopied(true);
            const timer = setTimeout(() => {
                if (mountedRef.current) setCopied(false);
            }, 2000);
            // Cleanup handled by mountedRef guard above — no need to return cleanup fn
            // (returning from useCallback is unused and causes TS7030)
        } catch (err) {
            uiLogger.error('Failed to copy', err);
        }
    }, [referralLink]);

    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('useHeroCard.share_title'),
                    text: t('useHeroCard.share_text'),
                    url: referralLink,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    handleCopyLink();
                }
            }
        } else {
            handleCopyLink();
        }
    }, [referralLink, handleCopyLink, t]);

    return {
        progressPercent,
        remaining,
        referralLink,
        copied,
        handleCopyLink,
        handleShare
    };
}
