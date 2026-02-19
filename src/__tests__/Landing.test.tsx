// @ts-nocheck
import React from 'react'
import { renderWithRouter } from '../testUtils/test-utils'
import Landing from '../pages/Landing'

describe('Landing page', () => {
  it('renders features grid and TravalPass power section', () => {
    const { getByText } = renderWithRouter(<Landing />)

    expect(getByText('Achieve all your goals in one place')).toBeTruthy()
    expect(getByText('The power of TravalPass Ads, for your business')).toBeTruthy()
  })
})
