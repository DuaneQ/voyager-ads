import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import React from 'react'
import theme from '../../styles/theme'
import ErrorBoundary from '../../components/common/ErrorBoundary'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wraps ErrorBoundary in a ThemeProvider so MUI components render correctly.
 */
function wrap(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

/**
 * A component controlled by a module-level flag that throws on demand.
 * Using a module-level variable lets tests toggle throwing behaviour
 * between the initial render and a reset() triggered re-render.
 */
let shouldBombThrow = false
function Bomb({ message = 'Intentional test error' }: { message?: string }) {
  if (shouldBombThrow) throw new Error(message)
  return <div>Children rendered successfully</div>
}

// Suppress React's own error logging so test output stays clean
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  shouldBombThrow = false
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary — no error', () => {
  it('renders children when no error is thrown', () => {
    shouldBombThrow = false
    wrap(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Children rendered successfully')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('ErrorBoundary — error caught', () => {
  it('renders the default fallback when a child throws', () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })

  it('displays the thrown error message in the fallback', () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary>
        <Bomb message="Custom error detail" />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Custom error detail')).toBeTruthy()
  })

  it('hides children and shows fallback when error occurs', () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.queryByText('Children rendered successfully')).toBeNull()
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })

  it('Retry button resets the boundary and re-renders children', async () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()

    // Allow recovery on next render
    shouldBombThrow = false
    fireEvent.click(screen.getByText('Retry'))

    await waitFor(() => {
      expect(screen.getByText('Children rendered successfully')).toBeTruthy()
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('ErrorBoundary — custom fallback prop', () => {
  it('renders the custom fallback node when provided', () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary fallback={<div>Custom static fallback</div>}>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Custom static fallback')).toBeTruthy()
    expect(screen.queryByText('Something went wrong')).toBeNull()
  })
})

describe('ErrorBoundary — fallbackRender prop', () => {
  it('calls fallbackRender with the error and a reset function', () => {
    shouldBombThrow = true
    const fallbackRender = vi.fn(({ error, reset }: { error: Error | null; reset: () => void }) => (
      <div>
        <span>Render prop fallback: {error?.message}</span>
        <button onClick={reset}>Custom retry</button>
      </div>
    ))

    wrap(
      <ErrorBoundary fallbackRender={fallbackRender}>
        <Bomb message="render-prop error" />
      </ErrorBoundary>,
    )

    expect(fallbackRender).toHaveBeenCalled()
    expect(fallbackRender.mock.calls[0][0].error?.message).toBe('render-prop error')
    expect(typeof fallbackRender.mock.calls[0][0].reset).toBe('function')
    expect(screen.getByText('Render prop fallback: render-prop error')).toBeTruthy()
  })

  it('fallbackRender reset function restores children', async () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary
        fallbackRender={({ reset }) => (
          <button onClick={reset}>Render prop retry</button>
        )}
      >
        <Bomb />
      </ErrorBoundary>,
    )

    shouldBombThrow = false
    fireEvent.click(screen.getByText('Render prop retry'))

    await waitFor(() => {
      expect(screen.getByText('Children rendered successfully')).toBeTruthy()
    })
  })

  it('fallbackRender takes priority over fallback', () => {
    shouldBombThrow = true
    wrap(
      <ErrorBoundary
        fallback={<div>Static fallback</div>}
        fallbackRender={() => <div>Render prop wins</div>}
      >
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Render prop wins')).toBeTruthy()
    expect(screen.queryByText('Static fallback')).toBeNull()
  })
})

describe('ErrorBoundary — onError callback', () => {
  it('calls onError with the thrown error and component info', () => {
    shouldBombThrow = true
    const onError = vi.fn()

    wrap(
      <ErrorBoundary onError={onError}>
        <Bomb message="callback test error" />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledOnce()
    const [error, info] = onError.mock.calls[0]
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('callback test error')
    expect(info).toHaveProperty('componentStack')
  })

  it('does not throw if onError is not provided', () => {
    shouldBombThrow = true
    // Should not throw even without onError prop
    expect(() =>
      wrap(
        <ErrorBoundary>
          <Bomb />
        </ErrorBoundary>,
      ),
    ).not.toThrow()
  })
})

describe('ErrorBoundary — console.error forwarding', () => {
  it('logs the error to console.error', () => {
    // Re-configure mock to be trackable for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    shouldBombThrow = true
    wrap(
      <ErrorBoundary>
        <Bomb message="logged error" />
      </ErrorBoundary>,
    )

    // React calls console.error; so does our componentDidCatch
    expect(consoleSpy).toHaveBeenCalled()
    const allArgs = consoleSpy.mock.calls.flat().join(' ')
    expect(allArgs).toContain('logged error')
  })
})
