import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('LoginPage', () => {
  const mockInitialize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ initialize: mockInitialize });
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@wellnexus.vn')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('admin@wellnexus.vn');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('handles successful founder login', async () => {
    const mockUser = {
      id: '1',
      app_metadata: { role: 'founder' },
      user_metadata: {},
    };

    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null,
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@wellnexus.vn'), {
      target: { value: 'founder@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'founder@example.com',
        password: 'password',
      });
      expect(mockInitialize).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('denies access for non-founder users', async () => {
    const mockUser = {
      id: '2',
      app_metadata: { role: 'user' },
      user_metadata: {},
    };

    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null,
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@wellnexus.vn'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(screen.getByText('Access denied: Founder privileges required.')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles login error', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('admin@wellnexus.vn'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('displays loading state', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (supabase.auth.signInWithPassword as any).mockReturnValue(promise);

    render(<LoginPage />);
    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });

    // Fill in required fields to ensure form submits
    fireEvent.change(screen.getByPlaceholderText('admin@wellnexus.vn'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password' }
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Clean up by resolving the promise and waiting for the state update to settle
    await act(async () => {
      resolvePromise!({ data: { user: null }, error: { message: 'Done' } });
    });
  });
});
