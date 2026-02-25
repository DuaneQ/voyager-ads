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
 */
const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

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

  return children
}

export default ProtectedRoute
