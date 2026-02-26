import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCampaigns } from '../../hooks/useCampaigns'
import type { User } from 'firebase/auth'
import type { Campaign } from '../../types/campaign'

const mockGetAllByUser = vi.fn()

vi.mock('../../repositories/campaignRepositoryInstance', () => ({
  campaignRepository: {
    create: vi.fn(),
    getAllByUser: (...args: unknown[]) => mockGetAllByUser(...args),
    update: vi.fn(),
  },
}))

const mockUser = { uid: 'user-123' } as User

vi.mock('../../store/authStore', () => ({
  default: (selector: (s: { user: User | null }) => unknown) =>
    selector({ user: mockUser }),
}))

const makeCampaign = (overrides: Partial<Campaign> = {}): Campaign => ({
  id: 'c1',
  uid: 'user-123',
  name: 'Test Campaign',
  placement: 'video_feed',
  objective: 'Awareness',
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  creativeName: 'Banner',
  creativeType: 'image',
  assetUrl: null,
  primaryText: '',
  cta: 'Learn More',
  landingUrl: '',
  businessType: '',
  address: '',
  phone: '',
  email: '',
  promoCode: '',
  audienceName: 'Travelers',
  location: 'Paris',
  radius: '',
  destinationMatch: false,
  ageFrom: '18',
  ageTo: '34',
  interests: '',
  targetDestination: '',
  targetPlaceId: '',
  targetTravelStartDate: '',
  targetTravelEndDate: '',
  targetGender: '',
  targetTripTypes: [],
  targetActivityPreferences: [],
  targetTravelStyles: [],
  budgetType: 'daily',
  budgetAmount: '100',
  billingModel: 'cpm',
  agreePolicy: true,
  status: 'draft',
  isUnderReview: true,
  createdAt: '2026-02-25T00:00:00.000Z',
  updatedAt: '2026-02-25T00:00:00.000Z',
  ...overrides,
})

describe('useCampaigns', () => {
  beforeEach(() => {
    mockGetAllByUser.mockReset()
  })

  it('starts in loading state and resolves with campaigns', async () => {
    const campaigns = [makeCampaign()]
    mockGetAllByUser.mockResolvedValue(campaigns)

    const { result } = renderHook(() => useCampaigns())

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.campaigns).toEqual(campaigns)
    expect(result.current.error).toBeNull()
    expect(mockGetAllByUser).toHaveBeenCalledWith('user-123')
  })

  it('returns empty array when no campaigns exist', async () => {
    mockGetAllByUser.mockResolvedValue([])

    const { result } = renderHook(() => useCampaigns())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.campaigns).toEqual([])
  })

  it('sets error message when repository throws', async () => {
    mockGetAllByUser.mockRejectedValue(new Error('Firestore unavailable'))

    const { result } = renderHook(() => useCampaigns())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Firestore unavailable')
    expect(result.current.campaigns).toEqual([])
  })

  it('handles non-Error rejection with a fallback message', async () => {
    mockGetAllByUser.mockRejectedValue('network error')

    const { result } = renderHook(() => useCampaigns())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Failed to load campaigns.')
  })

  it('refetch reloads campaigns', async () => {
    mockGetAllByUser.mockResolvedValueOnce([]).mockResolvedValueOnce([makeCampaign()])

    const { result } = renderHook(() => useCampaigns())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.campaigns).toHaveLength(0)

    result.current.refetch()
    await waitFor(() => expect(result.current.campaigns).toHaveLength(1))
  })
})
