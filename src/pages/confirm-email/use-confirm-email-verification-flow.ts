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

        // Strategy 2: hash fragment (implicit flow) or PKCE code param
        const hash = window.location.hash;
        const code = searchParams.get('code');

        if ((hash && hash.includes('access_token')) || code) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                subscription.unsubscribe();
                if (timeoutId) clearTimeout(timeoutId);
                setState('success');
                setTimeout(() => navigate('/login'), 2000);
              }
            }
          );
          authSubscription = subscription;

          // Check if Supabase already processed the URL before listener was attached
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            subscription.unsubscribe();
            authSubscription = null;
            setState('success');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }

          // Timeout after 10s if session never establishes
          timeoutId = setTimeout(() => {
            subscription.unsubscribe();
            authSubscription = null;
            setState('error');
            setErrorMessage('Confirmation timed out. Please try again.');
          }, 10000);
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
