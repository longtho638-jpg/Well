import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { userAPI } from '../services/api';
import { User, UserRank } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for Firebase Authentication
 * Manages authentication state and provides auth actions
 */
export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            // Fetch user data from Firestore
            const userData = await userAPI.getUser(firebaseUser.uid);
            setUser(userData);
            setFirebaseUser(firebaseUser);
          } catch (err) {
            console.error('Error fetching user data:', err);
            setError('Failed to load user data');
            setUser(null);
          }
        } else {
          setUser(null);
          setFirebaseUser(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user document in Firestore
      await userAPI.createUser(userCredential.user.uid, {
        id: userCredential.user.uid,
        name: displayName,
        email: email,
        rank: UserRank.MEMBER,
        totalSales: 0,
        teamVolume: 0,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`,
        joinedAt: new Date().toISOString(),
        kycStatus: false,
      });
    } catch (err: unknown) {
      console.error('Sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Check if user document exists, if not create one
      const existingUser = await userAPI.getUser(userCredential.user.uid);
      if (!existingUser) {
        await userAPI.createUser(userCredential.user.uid, {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || 'User',
          email: userCredential.user.email || '',
          rank: UserRank.MEMBER,
          totalSales: 0,
          teamVolume: 0,
          avatarUrl:
            userCredential.user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userCredential.user.displayName || 'User')}`,
          joinedAt: new Date().toISOString(),
          kycStatus: false,
        });
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out
   */
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err: unknown) {
      console.error('Sign out error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error
   */
  const clearError = (): void => {
    setError(null);
  };

  return {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
  };
}
