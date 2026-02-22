import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../testUtils/test-utils'
import Products from '../../components/landing/products/Products'

describe('Products', () => {
  it('renders all three product cards', () => {
    render(<Products />)
    expect(screen.getByText('Itinerary Feed')).toBeTruthy()
    expect(screen.getByText('Video Feed')).toBeTruthy()
    expect(screen.getByText('AI Itinerary Placement')).toBeTruthy()
  })

  it('renders the Creative specs section', () => {
    render(<Products />)
    expect(screen.getByText('Creative specs')).toBeTruthy()
    expect(screen.getByText('Image Ad (Itinerary Card)')).toBeTruthy()
    expect(screen.getByText('Video Ad (Feed)')).toBeTruthy()
    expect(screen.getByText('Native AI Item')).toBeTruthy()
  })

  it('opens the itinerary pricing modal when CPC / CPM button is clicked', () => {
    render(<Products />)
    const btn = screen.getAllByRole('button', { name: /CPC \/ CPM/i })[0]
    fireEvent.click(btn)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/Cost Per Click/)).toBeTruthy()
  })

  it('opens the video pricing modal when CPV / CPM button is clicked', () => {
    render(<Products />)
    fireEvent.click(screen.getByRole('button', { name: /CPV \/ CPM/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/Cost Per View/)).toBeTruthy()
  })

  it('opens the AI pricing modal when CPC / Premium CPM button is clicked', () => {
    render(<Products />)
    fireEvent.click(screen.getByRole('button', { name: /CPC \/ Premium CPM/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText(/Cost Per Click/)).toBeTruthy()
  })

  it('closes the modal when the close button is clicked', async () => {
    render(<Products />)
    fireEvent.click(screen.getByRole('button', { name: /CPV \/ CPM/i }))
    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeTruthy()
    // Click the close button inside the dialog
    fireEvent.click(screen.getByLabelText(/close/i))
    // MUI Dialog has exit animations — waitFor lets React flush the transition
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('renders the link to the Pricing page', () => {
    render(<Products />)
    const link = screen.getByRole('link', { name: /Pricing/i })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/pricing')
  })
})
