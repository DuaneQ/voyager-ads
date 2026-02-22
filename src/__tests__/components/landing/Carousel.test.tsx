import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '../../../testUtils/test-utils'
import Carousel from '../../../components/landing/Carousel'

const SLIDES = [
  { src: '/a.jpg', alt: 'Slide A', description: 'First slide' },
  { src: '/b.jpg', alt: 'Slide B', description: 'Second slide' },
  { src: '/c.jpg', alt: 'Slide C' },
]

afterEach(() => {
  vi.useRealTimers()
})

describe('Carousel', () => {
  it('renders the carousel wrapper', () => {
    const { container } = render(<Carousel images={SLIDES} />)
    expect(container.querySelector('.carousel')).toBeTruthy()
  })

  it('returns null when images array is empty', () => {
    const { container } = render(<Carousel images={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all slides with correct alt text', () => {
    render(<Carousel images={SLIDES} />)
    expect(screen.getByAltText('Slide A')).toBeTruthy()
    expect(screen.getByAltText('Slide B')).toBeTruthy()
    expect(screen.getByAltText('Slide C')).toBeTruthy()
  })

  it('marks only the first slide as visible initially', () => {
    const { container } = render(<Carousel images={SLIDES} />)
    const slides = container.querySelectorAll('.carousel-slide')
    expect(slides[0].getAttribute('aria-hidden')).toBe('false')
    expect(slides[1].getAttribute('aria-hidden')).toBe('true')
    expect(slides[2].getAttribute('aria-hidden')).toBe('true')
  })

  it('has the correct accessible carousel role', () => {
    const { container } = render(<Carousel images={SLIDES} />)
    expect(container.querySelector('[aria-roledescription="carousel"]')).toBeTruthy()
  })

  it('renders the aria-live region announcing the first slide', () => {
    render(<Carousel images={SLIDES} />)
    expect(screen.getByText(/Showing slide 1 of 3/)).toBeTruthy()
    // Also renders the description of the first slide
    expect(screen.getByText(/First slide/)).toBeTruthy()
  })

  it('auto-advances to the next slide after the interval', () => {
    vi.useFakeTimers()
    const { container } = render(<Carousel images={SLIDES} interval={1000} />)
    act(() => { vi.advanceTimersByTime(1000) })
    const slides = container.querySelectorAll('.carousel-slide')
    expect(slides[1].getAttribute('aria-hidden')).toBe('false')
    expect(slides[0].getAttribute('aria-hidden')).toBe('true')
  })

  it('does NOT start an interval when there is only one slide', () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(global, 'setInterval')
    render(<Carousel images={[SLIDES[0]]} interval={1000} />)
    // setInterval should not be called for single-image carousels
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('falls back to an SVG src when an image fails to load', () => {
    const { container } = render(<Carousel images={SLIDES} />)
    const img = container.querySelector('img') as HTMLImageElement
    const originalSrc = img.src
    fireEvent.error(img)
    // src should have changed to the fallback (different from the original)
    expect(img.src).not.toBe(originalSrc)
  })

  it('does not re-apply the fallback if the fallback itself errors', () => {
    const { container } = render(<Carousel images={SLIDES} />)
    const img = container.querySelector('img') as HTMLImageElement
    // First error: fallback is applied
    fireEvent.error(img)
    const fallbackSrc = img.src
    // Second error with the same fallback src: src must stay the same
    Object.defineProperty(img, 'src', { writable: true, value: fallbackSrc })
    fireEvent.error(img)
    expect(img.src).toBe(fallbackSrc)
  })
})
