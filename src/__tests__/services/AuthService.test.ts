import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  // Use a real function (not an arrow) so it can be used as a constructor with `new`
  GoogleAuthProvider: function GoogleAuthProvider() { return {} },
}))

import { FirebaseAuthService } from '../../services/auth/AuthService'
import * as firebaseAuth from 'firebase/auth'

describe('FirebaseAuthService', () => {
  const fakeAuth = {} as any
  let svc: FirebaseAuthService

  beforeEach(() => {
    vi.clearAllMocks()
    svc = new FirebaseAuthService(fakeAuth)
  })

  it('signInWithEmail calls underlying firebase method and returns user', async () => {
    const fakeUser = { uid: 'u1', email: 'a@b.com' }
    ;(firebaseAuth.signInWithEmailAndPassword as any).mockResolvedValue({ user: fakeUser })

    const user = await svc.signInWithEmail('a@b.com', 'pw')
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(fakeAuth, 'a@b.com', 'pw')
    expect(user).toBe(fakeUser)
  })

  it('signUpWithEmail creates user and sends verification', async () => {
    const fakeUser = { uid: 'u2', email: 'c@d.com' }
    ;(firebaseAuth.createUserWithEmailAndPassword as any).mockResolvedValue({ user: fakeUser })
    ;(firebaseAuth.sendEmailVerification as any).mockResolvedValue(undefined)

    const user = await svc.signUpWithEmail('c@d.com', 'pw')
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalled()
    expect(firebaseAuth.sendEmailVerification).toHaveBeenCalledWith(fakeUser)
    expect(user).toBe(fakeUser)
  })

  it('signInWithGoogle uses signInWithPopup and returns user', async () => {
    const fakeUser = { uid: 'google-1' }
    // Ensure the mocked function is a proper function implementation
    ;(firebaseAuth as any).signInWithPopup = vi.fn().mockResolvedValue({ user: fakeUser })

    const user = await svc.signInWithGoogle()
    expect((firebaseAuth as any).signInWithPopup).toHaveBeenCalled()
    expect(user).toBe(fakeUser)
  })

  it('sendPasswordReset delegates to firebase', async () => {
    ;(firebaseAuth.sendPasswordResetEmail as any).mockResolvedValue(undefined)
    await expect(svc.sendPasswordReset('x@y.com')).resolves.toBeUndefined()
    expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalled()
  })

  it('onAuthStateChanged subscribes to auth changes and returns unsubscribe', () => {
    let cbRef: any = null
    let active = true
    ;(firebaseAuth.onAuthStateChanged as any) = vi.fn().mockImplementation((auth: any, cb: any) => {
      // expose a wrapper that respects `active` so unsubscribe can prevent future calls
      cbRef = (user: any) => { if (active) cb(user) }
      if (active) cbRef({ uid: 'init-user' })
      return () => { active = false }
    })

    const handler = vi.fn()
    const unsubscribe = svc.onAuthStateChanged(handler)

    expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(fakeAuth, expect.any(Function))
    expect(handler).toHaveBeenCalledWith({ uid: 'init-user' })

    // invoke callback again while active
    cbRef({ uid: 'second' })
    expect(handler).toHaveBeenCalledTimes(2)

    // call unsubscribe and ensure subsequent events are ignored
    unsubscribe()
    cbRef({ uid: 'after-unsub' })
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('signOut delegates to firebase signOut', async () => {
    ;(firebaseAuth.signOut as any).mockResolvedValue(undefined)
    await expect(svc.signOut()).resolves.toBeUndefined()
    expect(firebaseAuth.signOut).toHaveBeenCalledWith(fakeAuth)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
})
