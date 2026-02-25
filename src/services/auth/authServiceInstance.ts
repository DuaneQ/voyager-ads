import { auth } from '../../config/firebaseConfig'
import { FirebaseAuthService } from './AuthService'

/**
 * App-wide singleton for authentication.
 * Import this wherever auth actions are needed — do not instantiate FirebaseAuthService directly.
 * In tests, mock this module: vi.mock('../../services/auth/authServiceInstance')
 */
export const authService = new FirebaseAuthService(auth)
