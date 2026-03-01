import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * Renders children only when the current user's UID is in VITE_ADMIN_UIDS
 * (comma-separated list of admin Firebase UIDs).
 * Falls back to the home page for everyone else, leaking no information.
 *
 * Server-side enforcement: the `reviewCampaign` Cloud Function independently
 * validates the caller UID, so this guard is defence-in-depth only.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const adminUids = (import.meta.env.VITE_ADMIN_UIDS as string | undefined)
    ?.split(',')
    .map((uid) => uid.trim())
    .filter(Boolean) ?? []

  if (!isInitialized) return null

  if (!user || adminUids.length === 0 || !adminUids.includes(user.uid)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute
