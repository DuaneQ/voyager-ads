import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import { AppAlertProvider } from '../../../context/AppAlertContext'
import CampaignWizard from '../../../components/campaign/CampaignWizard'
import * as useCreateCampaignModule from '../../../hooks/useCreateCampaign'
import { EMPTY_DRAFT } from '../../../types/campaign'
import type { User } from 'firebase/auth'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}))

vi.mock('../../../store/authStore', () => ({
  default: (selector: (s: { user: User | null }) => unknown) =>
    selector({ user: { uid: 'test-user' } as User }),
}))

vi.mock('../../../repositories/campaignRepositoryInstance', () => ({
  campaignRepository: {
    create: vi.fn().mockResolvedValue({ id: 'new-campaign' }),
    getAllByUser: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
  },
}))

function renderWizard() {
  return render(
    <AppAlertProvider>
      <CampaignWizard />
    </AppAlertProvider>
  )
}

describe('CampaignWizard', () => {
  // Ensure DestinationAutocomplete degrades to plain TextField
  beforeEach(() => vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', ''))
  afterEach(() => vi.unstubAllEnvs())
  it('renders the stepper with all 5 step labels', () => {
    renderWizard()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Creative')).toBeInTheDocument()
    expect(screen.getByText('Targeting')).toBeInTheDocument()
    expect(screen.getByText('Budget')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('starts on step 0 — shows campaign name field', () => {
    renderWizard()
    expect(screen.getByLabelText(/Campaign name/i)).toBeInTheDocument()
  })

  it('Back button is disabled on step 0', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: /Back/i })).toBeDisabled()
  })

  it('Next button is disabled when step 0 is invalid', () => {
    renderWizard()
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled()
  })

  it('Next button becomes enabled after valid step 0 data is entered', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText(/Campaign name/i), {
      target: { value: 'Summer Campaign' },
    })
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), {
      target: { value: '2030-06-01' },
    })
    expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled()
  })

  it('clicking Next on valid step 0 advances to step 1 (Creative)', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText(/Campaign name/i), {
      target: { value: 'My Ad Campaign' },
    })
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), {
      target: { value: '2030-06-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    expect(screen.getByLabelText(/Creative name/i)).toBeInTheDocument()
  })

  it('Back is enabled after advancing past step 0', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText(/Campaign name/i), {
      target: { value: 'My Ad Campaign' },
    })
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), {
      target: { value: '2030-06-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    expect(screen.getByRole('button', { name: /Back/i })).not.toBeDisabled()
  })

  it('Back from step 1 returns to step 0', () => {
    renderWizard()
    fireEvent.change(screen.getByLabelText(/Campaign name/i), {
      target: { value: 'My Ad Campaign' },
    })
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), {
      target: { value: '2030-06-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    expect(screen.getByLabelText(/Campaign name/i)).toBeInTheDocument()
  })

  it('shows "Submit campaign" button on the last step', () => {
    renderWizard()
    // Navigate through all 5 steps by filling minimum required fields
    // Step 0: name + start date
    fireEvent.change(screen.getByLabelText(/Campaign name/i), { target: { value: 'Ad Campaign' } })
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), { target: { value: '2030-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 1: creative name
    fireEvent.change(screen.getByLabelText(/Creative name/i), { target: { value: 'Banner' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 2: audience name + location (video_feed default)
    fireEvent.change(screen.getByLabelText(/Audience name/i), { target: { value: 'Travelers' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Paris' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 3: budget amount
    fireEvent.change(screen.getByLabelText(/Budget amount/i), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 4: Review — should show Submit button
    expect(screen.getByRole('button', { name: /Submit campaign/i })).toBeInTheDocument()
  })

  it('navigates to /dashboard with submitted state after clicking Submit', async () => {
    renderWizard()
    // Navigate to last step
    fireEvent.change(screen.getByLabelText(/Campaign name/i), { target: { value: 'Ad Campaign' } })
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), { target: { value: '2030-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.change(screen.getByLabelText(/Creative name/i), { target: { value: 'Banner' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.change(screen.getByLabelText(/Audience name/i), { target: { value: 'Travelers' } })
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'Paris' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    fireEvent.change(screen.getByLabelText(/Budget amount/i), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    // Agree to policy to enable submit
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Submit campaign/i }))
    // Should redirect to dashboard with submitted flag
    await vi.waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { state: { submitted: true } })
    )
  })

  it('surfaces submitError through the global alert snackbar', () => {
    vi.spyOn(useCreateCampaignModule, 'useCreateCampaign').mockReturnValue({
      step: 0,
      draft: EMPTY_DRAFT,
      patch: vi.fn(),
      next: vi.fn(),
      back: vi.fn(),
      goTo: vi.fn(),
      submit: vi.fn(),
      reset: vi.fn(),
      submitted: false,
      submitError: 'Network error — please try again.',
    })

    renderWizard()

    // The useEffect in CampaignWizard calls showError(submitError),
    // which renders the Snackbar alert message.
    expect(screen.getByText('Network error — please try again.')).toBeInTheDocument()

    vi.restoreAllMocks()
  })
})
