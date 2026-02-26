import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import useAuthStore from '../../store/authStore'

interface Props {
  children: React.ReactElement
}

/**
 * Wraps any route that requires authentication.
 *
 * - While Firebase Auth is initializing (first page load), renders a centered
 *   spinner so there is no flash-of-redirect for users who are already signed in.
 * - Once initialized, unauthenticated users are redirected to /signin and the
 *   original destination is preserved in `location.state.from` so the user is
 *   returned there after sign-in.
 *
 * E2E bypass: when VITE_E2E_AUTH_BYPASS=true (CI preview builds only), the
 * auth guard is skipped entirely so Playwright tests can reach protected pages
 * without racing against Firebase onAuthStateChanged initialization. The actual
 * Firebase sign-in still happens in the background (via main.tsx bypass flow)
 * and will be ready by the time any Firestore writes are attempted.
 */
const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isInitialized, user } = useAuthStore()
  const location = useLocation()

  // In E2E preview builds, bypass the auth guard so protected pages render
  // immediately — avoids spinner timing issues in Playwright.
  // VITE_E2E_AUTH_BYPASS is a build-time constant; never 'true' in production.
  if (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true') {
    return children
  }

  if (!isInitialized) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
        aria-label="Loading…"
        role="status"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  }

  // Block email/password users who haven't verified their address yet.
  // Google sign-in always sets emailVerified=true, so this only affects email/pw signups.
  if (user?.emailVerified === false) {
    return <Navigate to="/signin" state={{ from: location.pathname, needsVerification: true }} replace />
  }

  return children
}

export default ProtectedRoute
