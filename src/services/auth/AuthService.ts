import {
  type Auth,
  GoogleAuthProvider,
  type User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'

// ─── Interface (Dependency Inversion) ────────────────────────────────────────

export interface IAuthService {
  signInWithEmail(email: string, password: string): Promise<User>
  signUpWithEmail(email: string, password: string): Promise<User>
  signInWithGoogle(): Promise<User>
  signOut(): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  /** Returns an unsubscribe function. Call it on cleanup. */
  onAuthStateChanged(callback: (user: User | null) => void): () => void
}

// ─── Firebase implementation ──────────────────────────────────────────────────

export class FirebaseAuthService implements IAuthService {
  constructor(private readonly auth: Auth) {}

  async signInWithEmail(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(this.auth, email, password)
    return user
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(this.auth, email, password)
    // Send verification email — do not block sign-up on this
    await sendEmailVerification(user).catch((err) =>
      console.warn('[AuthService] sendEmailVerification failed:', err),
    )
    return user
  }

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider()
    const { user } = await signInWithPopup(this.auth, provider)
    return user
  }

  async signOut(): Promise<void> {
    await signOut(this.auth)
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email)
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback)
  }
}
