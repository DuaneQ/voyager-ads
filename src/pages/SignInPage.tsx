import React, { useState } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Nav from '../components/common/Nav'
import { authService } from '../services/auth/authServiceInstance'
import useAuthStore from '../store/authStore'

type Mode = 'signin' | 'signup' | 'reset'

const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
    <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
  </svg>
)

const SignInPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/dashboard'
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  // Redirect away immediately if already signed in
  React.useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isInitialized, isAuthenticated, navigate, from])

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const clearMessages = () => { setError(null); setInfo(null) }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      if (mode === 'reset') {
        await authService.sendPasswordReset(email)
        setInfo('Password reset email sent. Check your inbox.')
        setMode('signin')
      } else if (mode === 'signup') {
        await authService.signUpWithEmail(email, password)
        navigate(from, { replace: true })
      } else {
        await authService.signInWithEmail(email, password)
        navigate(from, { replace: true })
      }
    } catch (err: unknown) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    clearMessages()
    setLoading(true)
    try {
      await authService.signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Nav />
      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          px: 2,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            p: { xs: 3, sm: 4 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h2" fontWeight={700} mb={3} textAlign="center">
            {mode === 'reset' ? 'Reset password' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {info  && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

          {mode !== 'reset' && (
            <>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogle}
                disabled={loading}
                sx={{ mb: 2, textTransform: 'none' }}
                aria-label="Sign in with Google"
              >
                Continue with Google
              </Button>

              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">or</Typography>
              </Divider>
            </>
          )}

          <Stack component="form" onSubmit={handleEmailSubmit} spacing={2}>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              inputProps={{ 'aria-label': 'Email address' }}
            />
            {mode !== 'reset' && (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                inputProps={{ 'aria-label': 'Password' }}
              />
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              aria-label={mode === 'reset' ? 'Send reset email' : mode === 'signup' ? 'Create account' : 'Sign in'}
            >
              {loading
                ? <CircularProgress size={20} color="inherit" />
                : mode === 'reset' ? 'Send reset email'
                : mode === 'signup' ? 'Create account'
                : 'Sign in'}
            </Button>
          </Stack>

          <Stack spacing={0.5} mt={2} alignItems="center">
            {mode === 'signin' && (
              <>
                <Link component="button" variant="body2" onClick={() => { clearMessages(); setMode('reset') }}>
                  Forgot password?
                </Link>
                <Typography variant="body2">
                  No account?{' '}
                  <Link component="button" onClick={() => { clearMessages(); setMode('signup') }}>
                    Sign up
                  </Link>
                </Typography>
              </>
            )}
            {mode === 'signup' && (
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component="button" onClick={() => { clearMessages(); setMode('signin') }}>
                  Sign in
                </Link>
              </Typography>
            )}
            {mode === 'reset' && (
              <Link component="button" variant="body2" onClick={() => { clearMessages(); setMode('signin') }}>
                Back to sign in
              </Link>
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
            By continuing you agree to our{' '}
            <Link component={RouterLink} to="/products">Terms of Service</Link>.
          </Typography>
        </Box>
      </Box>
    </>
  )
}

/** Maps Firebase Auth error codes to user-friendly messages. */
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}

export default SignInPage
