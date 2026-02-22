import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../testUtils/test-utils'
import ResponsiveImage from '../../components/common/ResponsiveImage'

describe('ResponsiveImage', () => {
  it('renders an img with the fallback src and alt text', () => {
    render(<ResponsiveImage fallbackSrc="/img/photo.jpg" alt="A mountain view" />)
    const img = screen.getByRole('img', { name: 'A mountain view' })
    expect(img.getAttribute('src')).toBe('/img/photo.jpg')
  })

  it('renders with an empty alt by default (decorative)', () => {
    const { container } = render(<ResponsiveImage fallbackSrc="/img/deco.png" />)
    // alt="" makes the image presentational; query via DOM directly
    const img = container.querySelector('img')
    expect(img?.getAttribute('alt')).toBe('')
    expect(img?.getAttribute('src')).toBe('/img/deco.png')
  })

  it('renders a <source> element for each entry in sources', () => {
    const sources = [
      { srcSet: '/img/photo.webp', type: 'image/webp' },
      { srcSet: '/img/photo.avif', type: 'image/avif' },
    ]
    const { container } = render(
      <ResponsiveImage sources={sources} fallbackSrc="/img/photo.jpg" alt="Landscape" />
    )
    const sourceEls = container.querySelectorAll('source')
    expect(sourceEls).toHaveLength(2)
    expect(sourceEls[0].getAttribute('srcset')).toBe('/img/photo.webp')
    expect(sourceEls[0].getAttribute('type')).toBe('image/webp')
    expect(sourceEls[1].getAttribute('srcset')).toBe('/img/photo.avif')
  })

  it('renders a <source> with a media attribute when provided', () => {
    const sources = [{ srcSet: '/img/small.jpg', media: '(max-width: 600px)' }]
    const { container } = render(
      <ResponsiveImage sources={sources} fallbackSrc="/img/large.jpg" alt="Responsive" />
    )
    const sourceEl = container.querySelector('source')
    expect(sourceEl?.getAttribute('media')).toBe('(max-width: 600px)')
  })

  it('renders no <source> elements when sources is empty (default)', () => {
    const { container } = render(<ResponsiveImage fallbackSrc="/img/photo.jpg" alt="No sources" />)
    expect(container.querySelectorAll('source')).toHaveLength(0)
  })

  it('passes extra img props through', () => {
    render(
      <ResponsiveImage
        fallbackSrc="/img/photo.jpg"
        alt="Extra props"
        width={800}
        height={600}
        loading="lazy"
      />
    )
    const img = screen.getByRole('img', { name: 'Extra props' })
    expect(img.getAttribute('width')).toBe('800')
    expect(img.getAttribute('loading')).toBe('lazy')
  })
})
