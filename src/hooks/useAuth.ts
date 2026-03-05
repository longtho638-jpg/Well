import { useEffect } from 'react';
import { useStore } from '@/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, UserRank } from '@/types';
import { authLogger } from '@/utils/logger';

// Demo email for testing (works even in production)
const DEMO_EMAIL = 'demo@example.com';
const TEST_EMAIL = 'testuser@wellnexus.vn';

// Mock user for development/demo mode - matches User type exactly
const MOCK_USER: User = {
  id: 'mock-dev-user-001',
  name: 'Dev User',
  email: 'dev@example.com',
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
  const { setUser, setIsAuthenticated, setInitialized, fetchRealData, fetchUserFromDB } = useStore();

  useEffect(() => {
    // 1. Check for mock session first (DEV only — prevents production auth bypass)
    const hasMockSession = import.meta.env.DEV && localStorage.getItem('wellnexus_mock_session') === 'true';

    if (hasMockSession) {
      authLogger.info('Restoring mock session from localStorage');
      const storedEmail = localStorage.getItem('wellnexus_mock_email');
      const userToRestore = storedEmail === DEMO_EMAIL
        ? { ...MOCK_USER, email: DEMO_EMAIL }
        : MOCK_USER;

      setUser(userToRestore);
      setIsAuthenticated(true);
      setInitialized(true);
      return;
    }

    // 2. Skip Supabase auth if not configured (dev mode)
    if (!isSupabaseConfigured()) {
      authLogger.debug('Dev mode - Supabase not configured, and no mock session found');
      setInitialized(true);
      return;
    }

    // 3. Check active session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch full user data from database using store action
        await fetchUserFromDB();
        // Load other real data from Supabase after login
        fetchRealData();
      }
    }).catch((err) => {
      authLogger.error('Session initialization failed', err);
    }).finally(() => {
      setInitialized(true);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserFromDB();
          fetchRealData();
        } else if (event === 'SIGNED_OUT') {
          // Secure storage is cleared by Supabase client (via removeItem)
          // But we ensure local state is reset
          setIsAuthenticated(false);
          setUser(null);
          // Optional: Force clear if needed, but Supabase adapter handles it
          // secureTokenStorage.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchRealData, fetchUserFromDB, setIsAuthenticated, setUser, setInitialized]);

  return {
    signIn: async (email: string, password: string) => {
      // DEMO MODE: Allow demo login ONLY in development
      if (import.meta.env.DEV && (email.toLowerCase() === DEMO_EMAIL || email.toLowerCase() === TEST_EMAIL)) {
        authLogger.info('Demo mode - logging in as demo user');
        const user = { ...MOCK_USER, email: email.toLowerCase() };
        setUser(user);
        setIsAuthenticated(true);

        // Persist mock session
        localStorage.setItem('wellnexus_mock_session', 'true');
        localStorage.setItem('wellnexus_mock_email', email.toLowerCase());

        return { data: { user, session: { access_token: 'demo-token' } }, error: null };
      }

      // DEV MODE: Return mock success when Supabase not configured (DEV only)
      if (import.meta.env.DEV && !isSupabaseConfigured()) {
        authLogger.debug('Dev mode - using mock login for:', email);
        const user = { ...MOCK_USER, email };
        setUser(user);
        setIsAuthenticated(true);

        // Persist mock session
        localStorage.setItem('wellnexus_mock_session', 'true');
        localStorage.setItem('wellnexus_mock_email', email);

        return { data: { user, session: { access_token: 'mock-token' } }, error: null };
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

      // 2. User profile is auto-created by Postgres trigger `on_auth_user_created`
      //    on auth.users INSERT → public.users INSERT (SECURITY DEFINER)
      //    Name is passed via auth metadata above: options.data.name
      //    Sponsor assignment handled via sessionStorage (set during signup flow)
      if (data.user) {
        const sponsorId = sessionStorage.getItem('wellnexus_sponsor_id');
        if (sponsorId) {
          // Update sponsor after trigger creates the profile
          await supabase.from('users').update({ sponsor_id: sponsorId }).eq('id', data.user.id);
          sessionStorage.removeItem('wellnexus_sponsor_id');
        }
      }

      return data;
    },

    signOut: async () => {
      if (!isSupabaseConfigured()) {
        localStorage.removeItem('wellnexus_mock_session');
        localStorage.removeItem('wellnexus_mock_email');
        setIsAuthenticated(false);
        setUser(null);
        return { error: null };
      }
      return supabase.auth.signOut();
    },
  };
}