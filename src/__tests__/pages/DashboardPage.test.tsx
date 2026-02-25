import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it } from 'vitest'
// Mock Nav to avoid rendering the site chrome during the test
vi.mock('../../components/common/Nav', () => ({ __esModule: true, default: () => <div /> }))
import DashboardPage from '../../pages/DashboardPage'

describe('DashboardPage', () => {
  it('renders heading and helper text', () => {
    render(<DashboardPage />)
    expect(screen.getByRole('heading', { name: /My Campaigns/i })).toBeInTheDocument()
    expect(screen.getByText(/Your campaigns will appear here/i)).toBeInTheDocument()
  })
})
