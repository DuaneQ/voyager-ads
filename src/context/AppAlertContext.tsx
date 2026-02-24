import React, { createContext, useCallback, useContext, useState } from 'react'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success'

interface AppAlertState {
  message: string
  severity: AlertSeverity
}

export interface AppAlertContextValue {
  showError: (message: string) => void
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
  dismiss: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

export const AppAlertContext = createContext<AppAlertContextValue | null>(null)

/** How long a non-error alert stays visible before auto-dismissing. */
const AUTO_HIDE_MS = 6000

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AppAlertState | null>(null)

  const show = useCallback((severity: AlertSeverity, message: string) => {
    setAlert({ message: message.trim(), severity })
  }, [])

  const showError = useCallback((message: string) => show('error', message), [show])
  const showSuccess = useCallback((message: string) => show('success', message), [show])
  const showInfo = useCallback((message: string) => show('info', message), [show])
  const showWarning = useCallback((message: string) => show('warning', message), [show])

  const dismiss = useCallback(() => setAlert(null), [])

  /**
   * Snackbar's onClose fires for both user-initiated closes and autoHideDuration.
   * Ignore 'clickaway' so the banner stays until the user explicitly dismisses it
   * (or it times out normally).
   */
  const handleClose = useCallback(
    (_: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === 'clickaway') return
      dismiss()
    },
    [dismiss],
  )

  return (
    <AppAlertContext.Provider value={{ showError, showSuccess, showInfo, showWarning, dismiss }}>
      {children}
      <Snackbar
        open={alert !== null}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* Snackbar requires a single child element, not null */}
        {alert ? (
          <Alert
            severity={alert.severity}
            onClose={dismiss}
            variant="filled"
            sx={{ width: '100%' }}
            role="alert"
          >
            {alert.message}
          </Alert>
        ) : (
          <span />
        )}
      </Snackbar>
    </AppAlertContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the AppAlert API. Must be called inside an <AppAlertProvider>.
 * Throws if used outside — surfaces the misconfiguration at call time rather
 * than silently doing nothing.
 */
export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext)
  if (!ctx) {
    throw new Error('useAppAlert must be used within an <AppAlertProvider>')
  }
  return ctx
}
