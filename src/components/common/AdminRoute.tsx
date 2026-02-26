import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Renders children only when the current user's UID matches VITE_ADMIN_UID.
 * Falls back to the home page for everyone else, leaking no information.
 *
 * Server-side enforcement: the `reviewCampaign` Cloud Function independently
 * validates the caller UID, so this guard is defence-in-depth only.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const adminUid = import.meta.env.VITE_ADMIN_UID as string | undefined

  if (!isInitialized) return null

  if (!user || !adminUid || user.uid !== adminUid) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute
