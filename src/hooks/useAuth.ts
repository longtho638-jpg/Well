import { useEffect } from 'react';
import { useStore } from '@/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Mock user for development without Supabase
const MOCK_USER = {
  id: 'mock-dev-user-001',
  name: 'Dev User',
  email: 'dev@wellnexus.vn',
  rank: 'Diamond',
  roleId: 2,
  sponsorId: null,
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
};

export function useAuth() {
  const { setUser, setIsAuthenticated, fetchRealData } = useStore();

  useEffect(() => {
    // Skip Supabase auth if not configured (dev mode)
    if (!isSupabaseConfigured()) {
      console.log('[useAuth] Dev mode - Supabase not configured, skipping auth listener');
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
        const user = {
          id: data.id,
          name: data.name,
          email: data.email,
          rank: (data.role_id as any) || 'Cộng Tác Viên', // Fallback or map correctly if using enum
          roleId: data.role_id || 8,
          sponsorId: data.sponsor_id,
          totalSales: data.total_sales,
          teamVolume: data.team_volume,
          shopBalance: data.shop_balance,
          growBalance: data.pending_cashback || 0,
          pendingCashback: data.pending_cashback || 0,
          pointBalance: data.point_balance || 0,
          stakedGrowBalance: data.staked_grow_balance,
          avatarUrl: data.avatar_url,
          joinedAt: data.created_at,
          kycStatus: true, // Default
          referralLink: `wellnexus.vn/ref/${data.id}`,
        };

        setUser(user as any);
        setIsAuthenticated(true);

        // Load real data from Supabase after login
        fetchRealData();
      }
    } catch (error) {
      console.error('[useAuth] Error fetching user:', error);
    }
  };

  return {
    signIn: async (email: string, password: string) => {
      // DEV MODE: Return mock success when Supabase not configured
      if (!isSupabaseConfigured()) {
        console.log('[useAuth] Dev mode - using mock login for:', email);
        setUser({ ...MOCK_USER, email } as any);
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