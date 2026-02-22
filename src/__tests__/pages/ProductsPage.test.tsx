import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../testUtils/test-utils'
import ProductsPage from '../../pages/ProductsPage'

describe('ProductsPage', () => {
  it('renders the Products section', () => {
    render(<ProductsPage />)
    expect(screen.getByText('Itinerary Feed')).toBeTruthy()
    expect(screen.getByText('Video Feed')).toBeTruthy()
    expect(screen.getByText('AI Itinerary Placement')).toBeTruthy()
  })

  it('renders the Nav', () => {
    render(<ProductsPage />)
    expect(screen.getByText('TravalPass Ads')).toBeTruthy()
  })

  it('renders inside a <main> landmark', () => {
    render(<ProductsPage />)
    expect(screen.getByRole('main')).toBeTruthy()
  })
})
