import { useEffect } from 'react';
import { useStore } from '@/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, UserRank } from '@/types';
import { authLogger } from '@/utils/logger';

// Demo email for testing (works even in production)
const DEMO_EMAIL = 'demo@wellnexus.vn';

// Mock user for development/demo mode - matches User type exactly
const MOCK_USER: User = {
  id: 'mock-dev-user-001',
  name: 'Dev User',
  email: 'dev@wellnexus.vn',
  rank: UserRank.DAI_SU_DIAMOND,
  roleId: 2,
  sponsorId: undefined,
  totalSales: 150000000,
  teamVolume: 500000000,
  shopBalance: 5000000,
  growBalance: 2500000,
  pendingCashback: 1200000,
  pointBalance: 15000,
  stakedGrowBalance: 10000000,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevUser',
  joinedAt: '2024-01-01',
  kycStatus: true,
  referralLink: 'wellnexus.vn/ref/mock-dev-user',
  role: 'admin',
  isAdmin: true,
  monthlyProfit: 30000000,
  businessValuation: 1800000000,
  projectedAnnualProfit: 360000000,
  equityValue: 125000000,
  cashflowValue: 5000000,
  assetGrowthRate: 15,
  accumulatedBonusRevenue: 75000000,
  estimatedBonus: 0,
};

export function useAuth() {
  const { setUser, setIsAuthenticated, fetchRealData } = useStore();

  useEffect(() => {
    // Skip Supabase auth if not configured (dev mode)
    if (!isSupabaseConfigured()) {
      authLogger.debug('Dev mode - Supabase not configured, skipping auth listener');
      return;
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch full user data from database
        fetchUserData(session.user.id);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        // Map Supabase user to app User type
        const user: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          rank: (data.role_id as UserRank) || UserRank.CTV,
          roleId: data.role_id || 8,
          sponsorId: data.sponsor_id,
          totalSales: data.total_sales || 0,
          teamVolume: data.team_volume || 0,
          shopBalance: data.shop_balance || 0,
          growBalance: data.pending_cashback || 0,
          pendingCashback: data.pending_cashback || 0,
          pointBalance: data.point_balance || 0,
          stakedGrowBalance: data.staked_grow_balance || 0,
          avatarUrl: data.avatar_url || '',
          joinedAt: data.created_at || '',
          kycStatus: true,
          referralLink: `wellnexus.vn/ref/${data.id}`,
        };

        setUser(user);
        setIsAuthenticated(true);

        // Load real data from Supabase after login
        fetchRealData();
      }
    } catch (error) {
      authLogger.error('Error fetching user', error);
    }
  };

  return {
    signIn: async (email: string, password: string) => {
      // DEMO MODE: Allow demo login even in production
      if (email.toLowerCase() === DEMO_EMAIL) {
        authLogger.info('Demo mode - logging in as demo user');
        setUser({ ...MOCK_USER, email: DEMO_EMAIL });
        setIsAuthenticated(true);
        return { data: { user: MOCK_USER, session: { access_token: 'demo-token' } }, error: null };
      }

      // DEV MODE: Return mock success when Supabase not configured
      if (!isSupabaseConfigured()) {
        authLogger.debug('Dev mode - using mock login for:', email);
        setUser({ ...MOCK_USER, email });
        setIsAuthenticated(true);
        return { data: { user: MOCK_USER, session: { access_token: 'mock-token' } }, error: null };
      }
      return supabase.auth.signInWithPassword({ email, password });
    },

    signUp: async (email: string, password: string, name: string) => {
      // 1. Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }, // Store name in auth metadata
        },
      });

      if (error) throw error;

      // 2. Create user record in users table
      if (data.user) {
        await supabase.from('users').insert([
          {
            id: data.user.id,
            email,
            name,
            rank: 'Member',
          },
        ]);
      }

      return data;
    },

    signOut: () => supabase.auth.signOut(),
  };
}