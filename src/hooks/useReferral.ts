/**
 * WellNexus Referral Engine Hook
 * Orchestrates social sharing, network telemetry, and recursive growth state.
 * Refactored to use real Supabase data.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '@/store';
import { Referral, ReferralStats } from '@/types';
import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';

export const useReferral = () => {
    const { user } = useStore();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Fetch Real Referrals from Supabase
    useEffect(() => {
        if (!user.id) return;

        const fetchReferrals = async () => {
            setLoading(true);
            try {
                // Fetch F1s (Direct Referrals)
                const { data: f1Data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('sponsor_id', user.id);

                if (error) throw error;

                // Map Supabase data to Referral type
                const mappedReferrals: Referral[] = (f1Data || []).map((u: any) => ({
                    id: u.id,
                    referrerId: user.id || '',
                    referredUserId: u.id,
                    referredName: u.name,
                    referredEmail: u.email,
                    rank: u.rank || 'Member', // Extra field, might need casting if strict
                    createdAt: u.created_at, // Correct field name
                    status: u.kyc_status ? 'active' : 'pending',
                    avatar: u.avatar_url, // Extra field
                    level: 1,
                    totalRevenue: u.total_sales || 0,
                    referralBonus: 0, 
                } as unknown as Referral)); // Cast to avoid strict excess property checks for UI fields

                setReferrals(mappedReferrals);
            } catch (err) {
                uiLogger.error('Failed to fetch referrals', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReferrals();
    }, [user.id]);

    // Derived Statistics (Calculated from Real Data)
    const stats: ReferralStats = useMemo(() => {
        const totalReferrals = referrals.length;
        const activeReferrals = referrals.filter(r => r.status === 'active').length;
        // Mocking conversion rate for now as we don't track clicks yet
        const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0; 
        
        // Volume calculation (using totalRevenue from Referral type)
        const networkVolume = referrals.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);

        return {
            totalReferrals,
            activeReferrals,
            totalCommission: networkVolume * 0.1, // Example: 10% commission logic
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            totalBonus: 0,
            monthlyReferrals: referrals.filter(r => {
                const created = new Date(r.createdAt); // Corrected field access
                const now = new Date();
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
            }).length,
            referralLink: user.referralLink || ''
        };
    }, [referrals, user.referralLink]);

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

    // Derived Lists
    const f1Referrals = useMemo(() => referrals.filter(r => r.level === 1), [referrals]);
    // Note: F2 fetching would require a more complex query or recursive fetch
    const f2Referrals = useMemo(() => referrals.filter(r => r.level === 2), [referrals]);

    return {
        // State
        copiedLink,
        selectedTab,
        setSelectedTab,
        showQRCode,
        setShowQRCode,
        referralUrl,
        qrCodeUrl,
        stats,
        referrals,
        f1Referrals,
        f2Referrals,
        loading,

        // Actions
        copyReferralLink,
        shareViaZalo,
        shareViaFacebook,
        shareViaTelegram,
        shareViaEmail,
        downloadQRCode
    };
};
