import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import AdvertisingPolicyModal from '../../../components/campaign/AdvertisingPolicyModal'
import StepReview from '../../../components/campaign/StepReview'
import { EMPTY_DRAFT } from '../../../types/campaign'

describe('AdvertisingPolicyModal', () => {
  it('renders nothing when closed', () => {
    render(<AdvertisingPolicyModal open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders the dialog when open', () => {
    render(<AdvertisingPolicyModal open={true} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows the policy title', () => {
    render(<AdvertisingPolicyModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('TravalPass Advertising Policy')).toBeInTheDocument()
  })

  it('renders all major policy sections', () => {
    render(<AdvertisingPolicyModal open={true} onClose={vi.fn()} />)
    expect(screen.getByText('Prohibited Content')).toBeInTheDocument()
    expect(screen.getByText('Restricted Content')).toBeInTheDocument()
    expect(screen.getByText('Community & Creative Standards')).toBeInTheDocument()
    expect(screen.getByText('Targeting & Audience Rules')).toBeInTheDocument()
    expect(screen.getByText('Data & Privacy')).toBeInTheDocument()
    expect(screen.getByText('Payment & Billing')).toBeInTheDocument()
    expect(screen.getByText('Enforcement & Appeals')).toBeInTheDocument()
  })

  it('calls onClose when the close icon is clicked', () => {
    const onClose = vi.fn()
    render(<AdvertisingPolicyModal open={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when "I understand" button is clicked', () => {
    const onClose = vi.fn()
    render(<AdvertisingPolicyModal open={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /I understand/i }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('StepReview policy link', () => {
  it('opens the policy modal when the policy link is clicked', () => {
    render(<StepReview draft={EMPTY_DRAFT} patch={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /TravalPass Advertising Policy/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Prohibited Content')).toBeInTheDocument()
  })

  it('closes the policy modal after clicking "I understand"', async () => {
    render(<StepReview draft={EMPTY_DRAFT} patch={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /TravalPass Advertising Policy/i }))
    fireEvent.click(screen.getByRole('button', { name: /I understand/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
