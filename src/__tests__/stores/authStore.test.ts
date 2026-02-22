import { describe, it, expect, beforeEach } from 'vitest'
import useAuthStore from '../../store/authStore'

const initialState = useAuthStore.getState()

beforeEach(() => {
  useAuthStore.setState(initialState, true)
})

describe('authStore', () => {
  it('starts with no user and unauthenticated', () => {
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('login sets user and marks authenticated', () => {
    const testUser = { id: '1', email: 'test@test.com', displayName: 'Tester' }
    useAuthStore.getState().login(testUser)

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toEqual(testUser)
    expect(isAuthenticated).toBe(true)
  })

  it('logout clears user and marks unauthenticated', () => {
    const testUser = { id: '1', email: 'test@test.com', displayName: 'Tester' }
    useAuthStore.getState().login(testUser)
    useAuthStore.getState().logout()

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('login replaces an existing user', () => {
    const firstUser = { id: '1', email: 'a@a.com', displayName: 'User A' }
    const secondUser = { id: '2', email: 'b@b.com', displayName: 'User B' }

    useAuthStore.getState().login(firstUser)
    useAuthStore.getState().login(secondUser)

    expect(useAuthStore.getState().user).toEqual(secondUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
