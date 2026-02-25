import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store';
import { Referral, ReferralStats } from '@/types';
import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';
import { useSocialShare } from './useSocialShare';

interface ReferralTreeNode {
  id: string;
  sponsor_id: string | null;
  email: string;
  name: string;
  created_at: string;
  level?: number;
  rank?: string;
  avatar_url?: string;
  total_sales?: number;
  kyc_status?: boolean;
}

export const useReferral = () => {
    const { user } = useStore();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedLink, setCopiedLink] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'network'>('overview');
    const [showQRCode, setShowQRCode] = useState(false);

    const referralUrl = useMemo(() => {
        const link = user.referralLink || `wellnexus.vn/ref/${user.id}`;
        return link.startsWith('http') ? link : `https://${link}`;
    }, [user.referralLink, user.id]);

    // Use extracted hook
    const { 
        copyToClipboard, 
        shareViaZalo, 
        shareViaFacebook, 
        shareViaTelegram, 
        shareViaEmail, 
        generateQRCodeUrl 
    } = useSocialShare(referralUrl);

    const qrCodeUrl = useMemo(() => generateQRCodeUrl(), [generateQRCodeUrl]);

    // Fetch Real Referrals from Supabase (Optimized F1-F7 Tree)
    useEffect(() => {
        if (!user.id) return;

        const fetchReferrals = async () => {
            setLoading(true);
            try {
                // Try fetching full tree via Recursive RPC (F1-F7)
                const { data: treeData, error: rpcError } = await supabase
                    .rpc('get_downline_tree', { root_user_id: user.id });

                if (!rpcError && treeData) {
                    // Map RPC data
                    const mappedReferrals: Referral[] = treeData.map((u: ReferralTreeNode) => ({
                        id: u.id,
                        referrerId: u.sponsor_id || user.id,
                        referredUserId: u.id,
                        referredName: u.name,
                        referredEmail: u.email,
                        rank: u.rank || 'Member',
                        createdAt: u.created_at,
                        status: 'active' as const,
                        avatar: u.avatar_url,
                        level: u.level,
                        totalRevenue: u.total_sales || 0,
                        referralBonus: 0,
                    }));

                    setReferrals(mappedReferrals);
                    return; // Success, exit
                }

                // Fallback: Fetch only F1s (Direct Referrals) if RPC fails/missing
                if (rpcError) {
                    uiLogger.warn('RPC get_downline_tree failed, falling back to simple F1 fetch', rpcError);
                }

                const { data: f1Data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('sponsor_id', user.id);

                if (error) throw error;

                // Map Supabase data to Referral type
                const mappedReferrals: Referral[] = (f1Data || []).map((u: ReferralTreeNode) => ({
                    id: u.id,
                    referrerId: user.id || '',
                    referredUserId: u.id,
                    referredName: u.name,
                    referredEmail: u.email,
                    rank: u.rank || 'Member',
                    createdAt: u.created_at,
                    status: u.kyc_status ? 'active' as const : 'pending' as const,
                    avatar: u.avatar_url,
                    level: 1,
                    totalRevenue: u.total_sales || 0,
                    referralBonus: 0,
                }));

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

    // Wrappers for actions to maintain API compatibility
    const handleCopy = () => {
        copyToClipboard();
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleShareZalo = () => shareViaZalo(`🌟 Tham gia WellNexus cùng tôi!`);
    const handleShareTelegram = () => shareViaTelegram(`Tham gia WellNexus cùng tôi!`);
    const handleShareEmail = () => shareViaEmail('Join WellNexus', 'I thought you would love this!');

    const downloadQRCode = () => {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = 'wellnexus-referral-qr.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
        copyReferralLink: handleCopy,
        shareViaZalo: handleShareZalo,
        shareViaFacebook,
        shareViaTelegram: handleShareTelegram,
        shareViaEmail: handleShareEmail,
        downloadQRCode
    };
};
