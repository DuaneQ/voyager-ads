// @ts-nocheck
import React from 'react'
import { render } from '../../../testUtils/test-utils'
import Carousel from '../../../components/landing/Carousel'

describe('Carousel', () => {
  it('renders without crashing', () => {
    const images = ['/assets/ads/photo1.svg', '/assets/ads/photo2.svg']
    const { container } = render(<Carousel images={images} />)
    expect(container.querySelector('.carousel')).toBeTruthy()
  })
})
