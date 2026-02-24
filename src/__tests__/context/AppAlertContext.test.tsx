import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../styles/theme'
import { AppAlertProvider, useAppAlert } from '../../context/AppAlertContext'
import React from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppAlertProvider>{children}</AppAlertProvider>
    </ThemeProvider>
  )
}

/**
 * A simple consumer component that exposes all alert methods via data-testid
 * buttons, so tests can trigger each method without internal implementation
 * knowledge.
 */
function Consumer() {
  const { showError, showSuccess, showInfo, showWarning, dismiss } = useAppAlert()
  return (
    <div>
      <button onClick={() => showError('Something failed')}>show-error</button>
      <button onClick={() => showSuccess('Saved successfully')}>show-success</button>
      <button onClick={() => showInfo('Did you know?')}>show-info</button>
      <button onClick={() => showWarning('Heads up!')}>show-warning</button>
      <button onClick={dismiss}>dismiss</button>
    </div>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppAlertProvider', () => {
  it('renders children without showing any alert initially', () => {
    render(<Consumer />, { wrapper: Wrapper })
    // Snackbar is mounted but closed — no alert role should be visible
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('showError displays a filled error alert with the correct message', async () => {
    render(<Consumer />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('show-error'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
    expect(screen.getByRole('alert').textContent).toContain('Something failed')
  })

  it('showSuccess displays a success alert with the correct message', async () => {
    render(<Consumer />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('show-success'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
    expect(screen.getByRole('alert').textContent).toContain('Saved successfully')
  })

  it('showInfo displays an info alert with the correct message', async () => {
    render(<Consumer />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('show-info'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
    expect(screen.getByRole('alert').textContent).toContain('Did you know?')
  })

  it('showWarning displays a warning alert with the correct message', async () => {
    render(<Consumer />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('show-warning'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
    expect(screen.getByRole('alert').textContent).toContain('Heads up!')
  })

  it('dismiss closes the alert', async () => {
    render(<Consumer />, { wrapper: Wrapper })

    // Open an alert first
    fireEvent.click(screen.getByText('show-error'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())

    // Now dismiss
    act(() => {
      fireEvent.click(screen.getByText('dismiss'))
    })

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull()
    })
  })

  it('calling show twice replaces the previous alert message', async () => {
    render(<Consumer />, { wrapper: Wrapper })

    fireEvent.click(screen.getByText('show-error'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())

    fireEvent.click(screen.getByText('show-success'))
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Saved successfully')
    })
    expect(screen.queryByText('Something failed')).toBeNull()
  })

  it('trims leading/trailing whitespace from the message', async () => {
    function TrimConsumer() {
      const { showError } = useAppAlert()
      return <button onClick={() => showError('   spaced message   ')}>show</button>
    }

    render(<TrimConsumer />, { wrapper: Wrapper })
    fireEvent.click(screen.getByText('show'))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('spaced message')
    })
    // Should not have leading/trailing spaces
    expect(screen.getByRole('alert').textContent).not.toMatch(/^\s|\s$/)
  })
})

// ── useAppAlert outside provider ──────────────────────────────────────────────

describe('useAppAlert outside AppAlertProvider', () => {
  beforeEach(() => {
    // Suppress React's error boundary console output for this test block
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws an error when called outside the provider', () => {
    function BadConsumer() {
      useAppAlert()
      return null
    }

    // React will throw during render — wrap in an ErrorBoundary-like try
    expect(() => render(<BadConsumer />)).toThrow(
      'useAppAlert must be used within an <AppAlertProvider>',
    )
  })
})
