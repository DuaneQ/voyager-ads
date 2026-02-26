import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { HelmetProvider } from 'react-helmet-async'
import theme from './styles/theme'
import App from './App.tsx'
import { AppAlertProvider } from './context/AppAlertContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import { authService } from './services/auth/authServiceInstance'

async function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppAlertProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </AppAlertProvider>
          </ThemeProvider>
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>,
  )
}

// E2E-only: optional Playwright bypass for auth to stabilize E2E.
// Enabled at build time via VITE_E2E_AUTH_BYPASS=true (injected by CI preview
// build only — never set in the production deploy step).
if (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true' && typeof window !== 'undefined') {
  const bypass = window.localStorage.getItem('PLAYWRIGHT_BYPASS_AUTH')
  const email = window.localStorage.getItem('PLAYWRIGHT_BYPASS_EMAIL')
  const password = window.localStorage.getItem('PLAYWRIGHT_BYPASS_PASSWORD')
  if (bypass === '1' && email && password) {
    // Try to sign in before rendering so the app boots in an authenticated state.
    authService
      .signInWithEmail(email, password)
      .then(() => {
        console.log('E2E: bypass auth sign-in succeeded')
        renderApp()
      })
      .catch((err) => {
        console.warn('E2E: bypass auth sign-in failed', err)
        // continue to render app (tests can fall back to UI sign-in)
        renderApp()
      })
  } else {
    renderApp()
  }
} else {
  renderApp()
}
