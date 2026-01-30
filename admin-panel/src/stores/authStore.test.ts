import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, user: null, isFounder: false, isLoading: true });
    vi.clearAllMocks();

    // Default mock implementation for onAuthStateChange
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('should initialize with founder session', async () => {
    const mockUser = {
      id: '123',
      email: 'founder@example.com',
      app_metadata: { role: 'founder' },
      user_metadata: {}
    };
    const mockSession = { user: mockUser, access_token: 'token' };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.user).toEqual(mockUser);
    expect(state.isFounder).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should initialize with non-founder session', async () => {
    const mockUser = {
      id: '456',
      email: 'user@example.com',
      app_metadata: { role: 'user' },
      user_metadata: {}
    };
    const mockSession = { user: mockUser, access_token: 'token' };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.user).toEqual(mockUser);
    expect(state.isFounder).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should initialize with no session', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isFounder).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should handle signOut', async () => {
    // Setup initial logged in state
    useAuthStore.setState({
      session: { user: { id: '1' } } as any,
      user: { id: '1' } as any,
      isFounder: true,
      isLoading: false
    });

    await useAuthStore.getState().signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isFounder).toBe(false);
  });

  it('should update state on auth state change', async () => {
    // Setup initial empty state
    useAuthStore.setState({ session: null, isLoading: false });

    // Mock onAuthStateChange to immediately trigger callback
    const mockUser = {
      id: '123',
      app_metadata: { role: 'founder' }
    };
    const mockSession = { user: mockUser };

    (supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      callback('SIGNED_IN', mockSession);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Initialize triggers the listener setup
    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.session).toEqual(mockSession);
    expect(state.isFounder).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should handle auth state change to signed out', async () => {
    // Setup initial state as logged in
    const mockUser = { id: '123' };
    useAuthStore.setState({
      session: { user: mockUser } as any,
      user: mockUser as any,
      isFounder: true,
      isLoading: false
    });

    // Mock onAuthStateChange to trigger with null session
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback: any) => {
      callback('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isFounder).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should handle auth initialization error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (supabase.auth.getSession as any).mockRejectedValue(new Error('Auth error'));

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Auth initialization failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
