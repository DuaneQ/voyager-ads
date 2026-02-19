// @ts-nocheck
import React from 'react'
import { renderWithRouter } from '../testUtils/test-utils'
import Carousel from '../components/landing/Carousel'

describe('Carousel', () => {
  it('renders slides and shows accessible live text', () => {
    const images = [
      { src: '/assets/ads/photo1.png', alt: 'one', description: 'desc1' },
      { src: '/assets/ads/photo2.png', alt: 'two', description: 'desc2' },
    ]

    const { getByAltText, container } = renderWithRouter(<Carousel images={images} interval={1000} />)

    expect(getByAltText('one')).toBeTruthy()
    // check the polite live region exists
    const live = container.querySelector('[aria-live="polite"]')
    expect(live).toBeTruthy()
    expect(live?.textContent).toContain('Showing slide')
  })
})
