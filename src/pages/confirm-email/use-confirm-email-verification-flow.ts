/**
 * use-confirm-email-verification-flow — Supabase email confirmation state machine with token_hash, hash fragment, and PKCE strategies
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';

export type ConfirmationState = 'loading' | 'success' | 'error' | 'already_confirmed';

export function useConfirmEmailVerificationFlow() {
  const [state, setState] = useState<ConfirmationState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const confirmEmail = async () => {
      try {
        // Strategy 1: token_hash + type query params (Supabase email link format)
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (tokenHash && (type === 'signup' || type === 'email')) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'email',
          });

          if (error) {
            if (error.message.includes('already been confirmed') || error.message.includes('already registered')) {
              setState('already_confirmed');
            } else {
              authLogger.error('Email confirmation failed', error);
              setState('error');
              setErrorMessage(error.message);
            }
          } else {
            setState('success');
            setTimeout(() => navigate('/login'), 2000);
          }
          return;
        }

        // Strategy 2: PKCE code exchange (priority) or hash fragment (implicit flow)
        const code = searchParams.get('code');
        const hash = window.location.hash;

        // 2a. PKCE code exchange - explicit OAuth2 flow
        if (code) {
          authLogger.info('Exchanging PKCE code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            authLogger.error('PKCE code exchange failed', error);
            setState('error');
            setErrorMessage(error.message);
          } else {
            authLogger.info('PKCE code exchanged successfully');
            setState('success');
            setTimeout(() => navigate('/login'), 2000);
          }
          return;
        }

        // 2b. Hash fragment (implicit flow) - wait for session via listener
        if (hash && hash.includes('access_token')) {
          // Register listener FIRST to avoid race condition
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                authLogger.info('Auth state changed to SIGNED_IN via hash flow');
                subscription.unsubscribe();
                if (timeoutId) clearTimeout(timeoutId);
                setState('success');
                setTimeout(() => navigate('/login'), 2000);
              }
            }
          );
          authSubscription = subscription;

          // Check if session already exists (Supabase auto-processed URL)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            authLogger.info('Session already exists from hash');
            subscription.unsubscribe();
            authSubscription = null;
            setState('success');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }

          // Timeout after 60s (increased from 10s to handle slow email providers)
          timeoutId = setTimeout(() => {
            authLogger.warn('Hash fragment verification timed out');
            subscription.unsubscribe();
            authSubscription = null;
            setState('error');
            setErrorMessage('Confirmation timed out. Please try again.');
          }, 60000);
          return;
        }

        // Strategy 3: no URL tokens — check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setState('already_confirmed');
          return;
        }

        setState('error');
        setErrorMessage(t('auth.confirmEmail.invalidLink') || 'Invalid confirmation link');
      } catch (err) {
        authLogger.error('Confirmation error', err);
        setState('error');
        setErrorMessage(t('auth.confirmEmail.unexpectedError') || 'An unexpected error occurred');
      }
    };

    confirmEmail();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [searchParams, navigate, t]);

  return { state, errorMessage, navigate };
}
