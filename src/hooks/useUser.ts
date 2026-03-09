/**
 * useUser Hook
 *
 * Provides current authenticated user from Supabase Auth.
 * Uses the project's auth pattern with useAuth hook.
 */

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { useStore } from '@/store'
import type { User } from '@/types'

export interface UseUserResult {
  user: User | null
  isLoading: boolean
  error: Error | null
}

export function useUser(): UseUserResult {
  const { signIn, signOut } = useAuth()
  const user = useStore((state) => state.user)
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Loading state is managed by the store initialization
    setIsLoading(false)
  }, [])

  return {
    user: isAuthenticated ? user : null,
    isLoading,
    error: null,
  }
}

export default useUser
