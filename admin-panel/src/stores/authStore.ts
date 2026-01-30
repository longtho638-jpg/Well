import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isFounder: boolean;
  initialize: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isFounder: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        // Check role in metadata
        const isFounder = user.app_metadata?.role === 'founder' || user.user_metadata?.role === 'founder';

        // If not found in metadata, could check profiles table here if needed
        // For now, assume metadata is populated correctly

        set({ session, user, isFounder });
      } else {
        set({ session: null, user: null, isFounder: false });
      }

      // Listen for changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
           const user = session.user;
           const isFounder = user.app_metadata?.role === 'founder' || user.user_metadata?.role === 'founder';
           set({ session, user, isFounder, isLoading: false });
        } else {
           set({ session: null, user: null, isFounder: false, isLoading: false });
        }
      });

    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async () => {
     // For now we might redirect to main app login or implement email login
     // Since this is admin panel, let's assume we want direct login here
     // or maybe we rely on shared session?
     // The plan says "Create Login Page".
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isFounder: false });
  },
}));
