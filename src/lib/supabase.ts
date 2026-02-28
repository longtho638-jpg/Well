import { createClient } from '@supabase/supabase-js';
import { authLogger } from '@/utils/logger';
import { secureTokenStorage } from '@/utils/secure-token-storage';
import { ENV, isSupabaseConfigured as checkConfig } from '@/config/env';

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

if (checkConfig()) {
  // Configured
} else {
  authLogger.warn('Credentials not found. App will use mock data.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureTokenStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = checkConfig;
