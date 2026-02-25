import { describe, it, expect, beforeEach } from 'vitest'
import useAuthStore from '../../store/authStore'

const initialState = useAuthStore.getState()

beforeEach(() => {
  // reset the store between tests
  useAuthStore.setState(initialState, true)
})

describe('authStore (new API)', () => {
  it('starts uninitialized with no user', () => {
    const { user, isAuthenticated, isInitialized } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
    expect(isInitialized).toBe(false)
  })

  it('setUser updates state and marks authenticated', () => {
    const testUser = { uid: 'u1', email: 'a@b.com' } as any
    useAuthStore.getState().setUser(testUser)

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toEqual(testUser)
    expect(isAuthenticated).toBe(true)
  })

  it('init subscribes to authService and sets initialized', () => {
    const fakeUser = { uid: 'init-uid' } as any
    const authService = {
      onAuthStateChanged: (cb: (u: any) => void) => {
        // call callback immediately to simulate initialized state
        cb(fakeUser)
        return () => {}
      },
    } as any

    const unsubscribe = useAuthStore.getState().init(authService)
    const state = useAuthStore.getState()
    expect(state.isInitialized).toBe(true)
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual(fakeUser)
    expect(typeof unsubscribe).toBe('function')
  })
})
