// @ts-nocheck
import React from 'react'
import { render } from '../../../testUtils/test-utils'
import Landing from '../../../pages/Landing'

describe('Landing images and icons', () => {
  it('tp-grid images have alt text and features icons are present', () => {
    const { getByAltText, container, getByText } = render(<Landing />)

    // tp-grid images
    expect(getByAltText('Illustration: reach travelers')).toBeTruthy()
    expect(getByAltText('Illustration: measure and optimize')).toBeTruthy()
    expect(getByAltText('Illustration: budget control')).toBeTruthy()

    // features icons exist (icon elements have aria-hidden true)
    const icons = container.querySelectorAll('.feature-icon')
    expect(icons.length).toBeGreaterThanOrEqual(5)
    icons.forEach((el) => expect(el.getAttribute('aria-hidden')).toBe('true'))

    // sanity check for feature heading
    expect(getByText('Achieve all your goals in one place')).toBeTruthy()
  })
})
