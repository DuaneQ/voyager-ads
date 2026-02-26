import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../testUtils/test-utils'
import TermsOfServicePage from '../../pages/TermsOfServicePage'

vi.mock('../../components/common/Nav', () => ({
  default: () => <nav data-testid="nav" />,
}))

describe('TermsOfServicePage', () => {
  it('renders the page heading', () => {
    renderWithRouter(<TermsOfServicePage />)
    expect(screen.getByRole('heading', { name: /Terms of Service/i })).toBeInTheDocument()
  })

  it('renders the effective date', () => {
    renderWithRouter(<TermsOfServicePage />)
    expect(screen.getByText(/February 26, 2026/i)).toBeInTheDocument()
  })

  it('renders key sections', () => {
    renderWithRouter(<TermsOfServicePage />)
    expect(screen.getByText(/1\. Introduction/i)).toBeInTheDocument()
    expect(screen.getByText(/2\. Eligibility/i)).toBeInTheDocument()
  })

  it('renders navigation', () => {
    renderWithRouter(<TermsOfServicePage />)
    expect(screen.getByTestId('nav')).toBeInTheDocument()
  })

  it('renders the back button', () => {
    renderWithRouter(<TermsOfServicePage />)
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })
})
