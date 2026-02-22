import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '../../../testUtils/test-utils'
import RotatingHeadline from '../../../components/landing/RotatingHeadline'

afterEach(() => {
  vi.useRealTimers()
})

describe('RotatingHeadline', () => {
  it('renders the first phrase on mount', () => {
    render(<RotatingHeadline phrases={['Drive bookings', 'Grow revenue']} />)
    expect(screen.getByText('Drive bookings')).toBeTruthy()
  })

  it('renders the default suffix', () => {
    render(<RotatingHeadline phrases={['Drive bookings']} />)
    expect(screen.getByText(/with TravalPass Ads/)).toBeTruthy()
  })

  it('renders a custom suffix', () => {
    render(<RotatingHeadline phrases={['Drive bookings']} suffix="on our platform" />)
    expect(screen.getByText(/on our platform/)).toBeTruthy()
  })

  it('has an aria-live polite region for screen readers', () => {
    const { container } = render(<RotatingHeadline phrases={['Drive bookings']} />)
    expect(container.querySelector('[aria-live="polite"]')).toBeTruthy()
  })

  it('rotates to the next phrase after the interval', () => {
    vi.useFakeTimers()
    render(
      <RotatingHeadline phrases={['Drive bookings', 'Grow revenue', 'Expand reach']} interval={1000} />
    )
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('Grow revenue')).toBeTruthy()
  })

  it('wraps back to the first phrase after the last', () => {
    vi.useFakeTimers()
    render(<RotatingHeadline phrases={['A', 'B']} interval={500} />)
    act(() => { vi.advanceTimersByTime(500) })  // → B
    act(() => { vi.advanceTimersByTime(500) })  // → A (wrap)
    expect(screen.getByText('A')).toBeTruthy()
  })

  it('does NOT start an interval when there is only one phrase', () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(globalThis, 'setInterval')
    render(<RotatingHeadline phrases={['Only phrase']} />)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('applies the default colour for a phrase index with no custom colour', () => {
    const { container } = render(
      <RotatingHeadline phrases={['Drive bookings']} />
    )
    const span = container.querySelector('.phrase') as HTMLElement
    // Default first colour is #1a73e8
    expect(span.style.color).toBe('rgb(26, 115, 232)')
  })

  it('applies a custom phraseColor when provided for that index', () => {
    const { container } = render(
      <RotatingHeadline phrases={['Drive bookings']} phraseColors={['#ff0000']} />
    )
    const span = container.querySelector('.phrase') as HTMLElement
    expect(span.style.color).toBe('rgb(255, 0, 0)')
  })

  it('falls back to default colour when phraseColors array has no entry for the index', () => {
    vi.useFakeTimers()
    const { container } = render(
      <RotatingHeadline
        phrases={['A', 'B']}
        phraseColors={['#ff0000']} // only index 0 has a custom colour
        interval={500}
      />
    )
    act(() => { vi.advanceTimersByTime(500) }) // advance to index 1
    const span = container.querySelector('.phrase') as HTMLElement
    // Index 1 has no custom colour → default second colour is #db4437
    expect(span.style.color).toBe('rgb(219, 68, 55)')
  })
})
