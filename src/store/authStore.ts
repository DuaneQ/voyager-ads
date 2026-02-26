import type { User } from 'firebase/auth'
import { create } from 'zustand'
import type { IAuthService } from '../services/auth/AuthService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  /** False until the first onAuthStateChanged callback fires — prevents flash-of-redirect. */
  isInitialized: boolean

  // Actions
  setUser: (user: User | null) => void
  /**
   * Starts the Firebase Auth listener. Call once at app startup (e.g. in App.tsx useEffect).
   * Returns the unsubscribe function — call it on cleanup to avoid memory leaks.
   */
  init: (authService: IAuthService) => () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: user !== null }),

  init: (authService) => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      set({ user, isAuthenticated: user !== null, isInitialized: true })
    })
    return unsubscribe
  },
}))

export default useAuthStore
