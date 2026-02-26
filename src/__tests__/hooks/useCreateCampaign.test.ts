import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCreateCampaign } from '../../hooks/useCreateCampaign'
import { EMPTY_DRAFT } from '../../types/campaign'
import type { User } from 'firebase/auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUser = { uid: 'user-123' } as User

vi.mock('../../store/authStore', () => ({
  default: (selector: (s: { user: User | null }) => unknown) =>
    selector({ user: mockUser }),
}))

vi.mock('../../repositories/campaignRepositoryInstance', () => ({
  campaignRepository: {
    create: vi.fn().mockResolvedValue({ id: 'campaign-abc' }),
    getAllByUser: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
  },
}))

import { campaignRepository } from '../../repositories/campaignRepositoryInstance'

describe('useCreateCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(campaignRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'campaign-abc' })
  })
  it('initialises with step 0 and EMPTY_DRAFT', () => {
    const { result } = renderHook(() => useCreateCampaign())
    expect(result.current.step).toBe(0)
    expect(result.current.draft).toEqual(EMPTY_DRAFT)
    expect(result.current.submitted).toBe(false)
    expect(result.current.submitError).toBeNull()
  })

  it('patch updates a single draft field', () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('name', 'My Campaign'))
    expect(result.current.draft.name).toBe('My Campaign')
  })

  it('patch does not clobber other draft fields', () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('name', 'Test'))
    act(() => result.current.patch('budgetAmount', '50'))
    expect(result.current.draft.name).toBe('Test')
    expect(result.current.draft.budgetAmount).toBe('50')
  })

  it('next increments step', () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.next())
    expect(result.current.step).toBe(1)
  })

  it('next does not exceed STEP_COUNT - 1', () => {
    const { result } = renderHook(() => useCreateCampaign())
    for (let i = 0; i < 10; i++) act(() => result.current.next())
    expect(result.current.step).toBe(4)
  })

  it('back decrements step', () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.next())
    act(() => result.current.back())
    expect(result.current.step).toBe(0)
  })

  it('back does not go below 0', () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.back())
    expect(result.current.step).toBe(0)
  })

  it('goTo moves to specified step', () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.goTo(3))
    expect(result.current.step).toBe(3)
  })

  it('submit persists to repository and sets submitted to true', async () => {
    const { result } = renderHook(() => useCreateCampaign())
    await act(async () => { await result.current.submit() })
    expect(campaignRepository.create).toHaveBeenCalledOnce()
    expect(campaignRepository.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ assetFile: expect.anything() }),
      mockUser.uid,
    )
    expect(result.current.submitted).toBe(true)
    expect(result.current.submitError).toBeNull()
  })

  it('submit sets submitError when repository throws', async () => {
    ;(campaignRepository.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Firestore unavailable'),
    )
    const { result } = renderHook(() => useCreateCampaign())
    await act(async () => { await result.current.submit() })
    expect(result.current.submitted).toBe(false)
    expect(result.current.submitError).toBe('Firestore unavailable')
  })

  it('reset returns to initial state after submit', async () => {
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('name', 'My Campaign'))
    act(() => result.current.next())
    await act(async () => { await result.current.submit() })
    act(() => result.current.reset())
    expect(result.current.step).toBe(0)
    expect(result.current.draft).toEqual(EMPTY_DRAFT)
    expect(result.current.submitted).toBe(false)
    expect(result.current.submitError).toBeNull()
  })
})
