import { create } from 'zustand'

export interface User {
  id: string
  email: string
  displayName: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  // Actions
  login: (user: User) => void
  logout: () => void
}

/**
 * Tracks the authenticated user.
 * Expand with token/session handling when the auth service is integrated.
 */
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))

export default useAuthStore
