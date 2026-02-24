import React from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
  /**
   * Custom fallback UI. When provided it replaces the default Alert fallback.
   * Tip: if you need access to the error or a reset callback, use
   * `fallbackRender` instead.
   */
  fallback?: React.ReactNode
  /**
   * Render-prop variant of `fallback` — receives the thrown error and a
   * `reset` callback so the fallback UI can offer a retry action.
   */
  fallbackRender?: (props: { error: Error | null; reset: () => void }) => React.ReactNode
  /**
   * Called after the error is caught. Use this to forward the error to an
   * external logging service (e.g. Sentry, Datadog RUM).
   */
  onError?: (error: Error, info: React.ErrorInfo) => void
}

// ── State ─────────────────────────────────────────────────────────────────────

interface State {
  hasError: boolean
  error: Error | null
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ErrorBoundary — wraps a subtree and renders a fallback when an uncaught
 * render-time error occurs in any descendant.
 *
 * Error boundaries do NOT catch:
 *  • errors inside event handlers
 *  • async code (setTimeout, promises)
 *  • server-side rendering
 *  • errors thrown by the boundary component itself
 *
 * Place this component at meaningful recovery points (e.g. around a route
 * page or complex widget), not around every leaf component.
 *
 * @example
 * <ErrorBoundary onError={(err) => logger.capture(err)}>
 *   <CreateCampaignPage />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  /**
   * React calls this static method before re-rendering the tree. Return the
   * state update that will trigger the fallback render.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  /**
   * React calls this after the error has been logged to the component stack.
   * This is the right place to call an external logging service.
   */
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.props.onError?.(error, info)
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, fallbackRender } = this.props

    if (!hasError) return children

    // Priority: fallbackRender > fallback > default Alert
    if (fallbackRender) return fallbackRender({ error, reset: this.reset })
    if (fallback) return fallback

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: '40vh',
          p: 4,
        }}
      >
        <Alert
          severity="error"
          sx={{ maxWidth: 520, width: '100%' }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={this.reset}
              aria-label="Retry loading this section"
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2" fontWeight={600} component="p">
            Something went wrong
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {error?.message ?? 'An unexpected error occurred. Please try again.'}
          </Typography>
        </Alert>
      </Box>
    )
  }
}

export default ErrorBoundary
