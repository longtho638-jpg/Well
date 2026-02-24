import { createClient } from '@supabase/supabase-js';
import { systemLogger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  systemLogger.warn('Supabase credentials not found in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
