/**
 * WellNexus Referral Engine Hook
 * Orchestrates social sharing, network telemetry, and recursive growth state.
 */

import { useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store';
import { Referral } from '@/types';
import { REFERRALS, REFERRAL_STATS } from '@/data/mockData';

export const useReferral = () => {
    const { user } = useStore();
    const [copiedLink, setCopiedLink] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'network'>('overview');
    const [showQRCode, setShowQRCode] = useState(false);

    const referralUrl = useMemo(() =>
        `https://${user.referralLink || `wellnexus.vn/ref/${user.id}`}`,
        [user.referralLink, user.id]
    );

    const qrCodeUrl = useMemo(() =>
        `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralUrl)}&margin=20&qzone=2&color=00575A`,
        [referralUrl]
    );

    const copyReferralLink = useCallback(() => {
        navigator.clipboard.writeText(referralUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    }, [referralUrl]);

    const shareViaZalo = useCallback(() => {
        const text = encodeURIComponent(
            `🌟 Tham gia WellNexus cùng tôi! Nền tảng chăm sóc sức khỏe và kinh doanh thông minh.\n\n👉 ${referralUrl}\n\nĐăng ký ngay để nhận ưu đãi đặc biệt!`
        );
        window.open(`https://zalo.me/share?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
    }, [referralUrl]);

    const shareViaFacebook = useCallback(() => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank');
    }, [referralUrl]);

    const shareViaTelegram = useCallback(() => {
        const text = encodeURIComponent(`Tham gia WellNexus cùng tôi! ${referralUrl}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
    }, [referralUrl]);

    const shareViaEmail = useCallback(() => {
        const subject = encodeURIComponent('Join WellNexus - Transform Your Health & Income!');
        const body = encodeURIComponent(
            `Hi! I've been using WellNexus and thought you'd love it too.\n\nJoin me here: ${referralUrl}\n\nLet's grow together!`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }, [referralUrl]);

    const downloadQRCode = useCallback(() => {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'wellnexus-referral-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [qrCodeUrl]);

    // Derived Statistics
    const f1Referrals = useMemo(() => REFERRALS.filter(r => r.level === 1), []);
    const f2Referrals = useMemo(() => REFERRALS.filter(r => r.level === 2), []);

    return {
        // State
        copiedLink,
        selectedTab,
        setSelectedTab,
        showQRCode,
        setShowQRCode,
        referralUrl,
        qrCodeUrl,
        stats: REFERRAL_STATS,
        referrals: REFERRALS,
        f1Referrals,
        f2Referrals,

        // Actions
        copyReferralLink,
        shareViaZalo,
        shareViaFacebook,
        shareViaTelegram,
        shareViaEmail,
        downloadQRCode
    };
};
