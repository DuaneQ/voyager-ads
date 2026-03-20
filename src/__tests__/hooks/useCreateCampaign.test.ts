import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCreateCampaign } from '../../hooks/useCreateCampaign'
import { EMPTY_DRAFT } from '../../types/campaign'
import type { User } from 'firebase/auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUser = { uid: 'user-123', email: 'advertiser@test.com' } as User

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

const mockValidate = vi.hoisted(() => vi.fn<[File, string], Promise<void>>())
const mockUpload = vi.hoisted(() =>
  vi.fn<[File, string, ((pct: number) => void)?], Promise<{ downloadUrl: string; storagePath: string }>>()
)

vi.mock('../../services/campaign/CampaignAssetService', () => ({
  campaignAssetService: {
    validate: mockValidate,
    upload: mockUpload,
  },
}))

// Mock Firebase functions for Mux processing
const mockProcessAdVideoWithMux = vi.fn()
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockProcessAdVideoWithMux),
}))

// Mock Firestore for waitForMuxProcessing  
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn((docRef, callback) => {
    // Simulate Mux processing completion with proper DocumentSnapshot
    setTimeout(() => {
      const mockSnapshot = {
        exists: () => true,
        data: () => ({ muxPlaybackUrl: 'https://stream.mux.com/test.m3u8' })
      }
      callback(mockSnapshot)
    }, 10)
    return vi.fn() // unsubscribe function
  }),
  doc: vi.fn(),
}))

vi.mock('../../config/firebaseConfig', () => ({
  functions: {},
  db: {},
}))

import { campaignRepository } from '../../repositories/campaignRepositoryInstance'

// Helper to make a minimal fake File
function makeFile(name = 'banner.jpg', type = 'image/jpeg'): File {
  return new File([new Uint8Array(10)], name, { type })
}

describe('useCreateCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(campaignRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'campaign-abc' })
    mockValidate.mockResolvedValue(undefined)
    mockUpload.mockResolvedValue({ downloadUrl: 'https://cdn.example.com/asset.jpg', storagePath: 'ads/user-123/asset.jpg' })
    // Mock successful Mux processing
    mockProcessAdVideoWithMux.mockResolvedValue({ data: { success: true } })
  })

  // ── Initial state ──

  it('initialises with step 0 and EMPTY_DRAFT', () => {
    const { result } = renderHook(() => useCreateCampaign())
    expect(result.current.step).toBe(0)
    expect(result.current.draft).toEqual(EMPTY_DRAFT)
    expect(result.current.submitted).toBe(false)
    expect(result.current.submitError).toBeNull()
    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBe(0)
  })

  // ── Navigation ──

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

  // ── Submit — no asset file ──

  it('submit without assetFile persists to repository with assetUrl null and sets submitted', async () => {
    const { result } = renderHook(() => useCreateCampaign())
    await act(async () => { await result.current.submit() })
    expect(mockValidate).not.toHaveBeenCalled()
    expect(mockUpload).not.toHaveBeenCalled()
    expect(campaignRepository.create).toHaveBeenCalledOnce()
    expect(campaignRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ assetUrl: null }),
      mockUser.uid,
    )
    expect(result.current.submitted).toBe(true)
    expect(result.current.submitError).toBeNull()
  })

  it('submit strips assetFile from the persisted payload', async () => {
    const { result } = renderHook(() => useCreateCampaign())
    await act(async () => { await result.current.submit() })
    expect(campaignRepository.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ assetFile: expect.anything() }),
      mockUser.uid,
    )
  })

  it('submit stores the user email in the persisted payload', async () => {
    const { result } = renderHook(() => useCreateCampaign())
    await act(async () => { await result.current.submit() })
    expect(campaignRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: mockUser.email }),
      mockUser.uid,
    )
  })

  // ── Submit — with asset file ──

  it('submit with assetFile calls validate then upload before Firestore write', async () => {
    const file = makeFile()
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('assetFile', file))
    await act(async () => { await result.current.submit() })
    expect(mockValidate).toHaveBeenCalledWith(file, EMPTY_DRAFT.placement)
    expect(mockUpload).toHaveBeenCalledWith(file, mockUser.uid, expect.any(Function))
  })

  it('submit with assetFile saves the returned downloadUrl as assetUrl', async () => {
    const file = makeFile()
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('assetFile', file))
    await act(async () => { await result.current.submit() })
    expect(campaignRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ assetUrl: 'https://cdn.example.com/asset.jpg' }),
      mockUser.uid,
    )
    expect(result.current.submitted).toBe(true)
  })

  it('sets submitError and does not upload when validate throws', async () => {
    mockValidate.mockRejectedValueOnce(new Error('Video too short'))
    const file = makeFile('ad.mp4', 'video/mp4')
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('assetFile', file))
    await act(async () => { await result.current.submit() })
    expect(mockUpload).not.toHaveBeenCalled()
    expect(campaignRepository.create).not.toHaveBeenCalled()
    expect(result.current.submitted).toBe(false)
    expect(result.current.submitError).toBe('Video too short')
  })

  it('sets submitError when upload throws', async () => {
    mockUpload.mockRejectedValueOnce(new Error('quota exceeded'))
    const file = makeFile()
    const { result } = renderHook(() => useCreateCampaign())
    act(() => result.current.patch('assetFile', file))
    await act(async () => { await result.current.submit() })
    expect(campaignRepository.create).not.toHaveBeenCalled()
    expect(result.current.submitError).toBe('quota exceeded')
    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBe(0)
  })

  // ── Submit — repository errors ──

  it('submit sets submitError when repository throws', async () => {
    ;(campaignRepository.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Firestore unavailable'),
    )
    const { result } = renderHook(() => useCreateCampaign())
    await act(async () => { await result.current.submit() })
    expect(result.current.submitted).toBe(false)
    expect(result.current.submitError).toBe('Firestore unavailable')
  })

  // ── Reset ──

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
    expect(result.current.isUploading).toBe(false)
    expect(result.current.uploadProgress).toBe(0)
  })
})
