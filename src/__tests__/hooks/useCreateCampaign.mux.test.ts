/**
 * TDD Tests for Mux validation in campaign creation
 * 
 * Tests the critical business requirement: "NO CUSTOMER PAYS FOR BROKEN CAMPAIGNS"
 * 
 * These tests define the behavior BEFORE implementation to follow TDD approach.
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User } from 'firebase/auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUser = { uid: 'user-123', email: 'advertiser@test.com' } as User

vi.mock('../../store/authStore', () => ({
  default: vi.fn((selector: (s: { user: User | null }) => unknown) =>
    selector({ user: mockUser })
  ),
}))

vi.mock('../../repositories/campaignRepositoryInstance', () => ({
  campaignRepository: {
    create: vi.fn().mockResolvedValue({ id: 'campaign-abc' }),
  },
}))

vi.mock('../../services/campaign/CampaignAssetService', () => ({
  campaignAssetService: {
    validate: vi.fn().mockResolvedValue(undefined),
    upload: vi.fn().mockResolvedValue({ 
      downloadUrl: 'https://cdn.example.com/video.mp4', 
      storagePath: 'ads/user-123/video.mp4' 
    }),
  },
}))

// Mock Firebase functions
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => vi.fn()),
}))

// Mock Firebase Firestore for waitForMuxProcessing
vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn(),
  doc: vi.fn(),
}))

// Mock Firebase config
vi.mock('../../config/firebaseConfig', () => ({
  functions: {},
  db: {},
}))

// Import after mocks
import { useCreateCampaign } from '../../hooks/useCreateCampaign'
import { campaignRepository } from '../../repositories/campaignRepositoryInstance'
import { campaignAssetService } from '../../services/campaign/CampaignAssetService'
import { httpsCallable } from 'firebase/functions'
import { onSnapshot } from 'firebase/firestore'

// Helper to make a minimal fake video File
function makeVideoFile(name = 'video.mp4'): File {
  return new File([new Uint8Array(1000000)], name, { type: 'video/mp4' }) // 1MB video file
}

describe('useCreateCampaign - Mux validation', () => {
  let mockProcessAdVideoWithMux: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup repository mock
    ;(campaignRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'campaign-abc' })
    
    // Setup service mocks
    ;(campaignAssetService.validate as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(campaignAssetService.upload as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      downloadUrl: 'https://cdn.example.com/video.mp4', 
      storagePath: 'ads/user-123/video.mp4' 
    })
    
    // Setup Firebase function mock
    mockProcessAdVideoWithMux = vi.fn().mockResolvedValue({ data: { success: true } })
    ;(httpsCallable as ReturnType<typeof vi.fn>).mockReturnValue(mockProcessAdVideoWithMux)
  })

  describe('waitForMuxProcessing utility', () => {
    it('should resolve when muxPlaybackUrl is available', async () => {
      // Mock onSnapshot to immediately call callback with muxPlaybackUrl
      const mockSnapshot = {
        exists: () => true,
        data: () => ({ muxPlaybackUrl: 'https://stream.mux.com/abc.m3u8' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        // Simulate immediate callback with ready state
        setTimeout(() => callback(mockSnapshot), 10)
        return vi.fn() // Return unsubscribe function
      })

      const { result } = renderHook(() => useCreateCampaign())
      
      // This should resolve quickly now that waitForMuxProcessing is implemented
      const startTime = Date.now()
      await act(async () => {
        await result.current.waitForMuxProcessing('test-video-id')
      })
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should resolve quickly
    })

    it('should resolve when muxStatus is ready', async () => {
      const mockSnapshot = {
        exists: () => true,
        data: () => ({ muxStatus: 'ready' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        setTimeout(() => callback(mockSnapshot), 10)
        return vi.fn()
      })

      const { result } = renderHook(() => useCreateCampaign())
      
      // This test should now pass with waitForMuxProcessing implemented
      await expect(result.current.waitForMuxProcessing('test-video-id')).resolves.toBeUndefined()
    })

    it('should resolve on timeout after 90 seconds', { timeout: 100000 }, async () => {
      vi.useFakeTimers()
      
      // Mock onSnapshot to never call the callback (simulate pending forever)
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation(() => vi.fn())

      const { result } = renderHook(() => useCreateCampaign())
      
      // This test should pass now that waitForMuxProcessing is implemented
      const promise = result.current.waitForMuxProcessing('test-video-id')
      
      // Fast-forward time to trigger timeout
      vi.advanceTimersByTime(90000)
      
      await expect(promise).resolves.toBeUndefined()
      
      vi.useRealTimers()
    })
  })

  describe('video_feed campaign creation with Mux validation', () => {
    it('should wait for mux processing before completing submission', { timeout: 10000 }, async () => {
      // Mock Firestore listener to simulate Mux processing completion after 2 seconds
      const mockUnsubscribe = vi.fn()
      const mockSnapshot = {
        exists: () => true,
        data: () => ({ muxPlaybackUrl: 'https://stream.mux.com/abc.m3u8' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        // Simulate Mux processing taking 2 seconds
        setTimeout(() => callback(mockSnapshot), 2000)
        return mockUnsubscribe
      })

      vi.useFakeTimers()
      
      const videoFile = makeVideoFile()
      const { result } = renderHook(() => useCreateCampaign())
      
      // Set up video_feed campaign
      act(() => {
        result.current.patch('placement', 'video_feed')
        result.current.patch('assetFile', videoFile)
      })

      // Start submission
      const submitPromise = act(async () => {
        await result.current.submit()
      })

      // Fast-forward through Mux processing
      vi.advanceTimersByTime(2000)
      
      await submitPromise

      expect(result.current.submitted).toBe(true)
      
      // Should have called processAdVideoWithMux and waited for result
      expect(mockProcessAdVideoWithMux).toHaveBeenCalledWith({
        campaignId: 'campaign-abc',
        storagePath: 'ads/user-123/video.mp4'
      })
      
      vi.useRealTimers()
    })

    it('should show progress UI during mux processing', { timeout: 10000 }, async () => {
      const mockUnsubscribe = vi.fn()
      const mockPendingSnapshot = {
        exists: () => true,
        data: () => ({ muxStatus: 'preparing' })
      }
      const mockReadySnapshot = {
        exists: () => true,
        data: () => ({ muxPlaybackUrl: 'https://stream.mux.com/abc.m3u8' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        // First call: pending
        setTimeout(() => callback(mockPendingSnapshot), 100)
        // Second call: ready  
        setTimeout(() => callback(mockReadySnapshot), 1000)
        return mockUnsubscribe
      })

      vi.useFakeTimers()
      
      const videoFile = makeVideoFile()
      const { result } = renderHook(() => useCreateCampaign())
      
      act(() => {
        result.current.patch('placement', 'video_feed')
        result.current.patch('assetFile', videoFile)
      })

      const submitPromise = act(async () => {
        await result.current.submit()
      })

      // Should show processing state after upload completes
      vi.advanceTimersByTime(500)
      expect(result.current.processingStatus).toBe('Processing video...')

      vi.advanceTimersByTime(1000)
      await submitPromise

      expect(result.current.submitted).toBe(true)
      expect(result.current.processingStatus).toBeNull()
      vi.useRealTimers()
    })

    it('should show error when mux processing fails', async () => {
      const mockErrorSnapshot = {
        exists: () => true,
        data: () => ({ muxStatus: 'errored' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        setTimeout(() => callback(mockErrorSnapshot), 100)
        return vi.fn()
      })

      const videoFile = makeVideoFile()
      const { result } = renderHook(() => useCreateCampaign())
      
      act(() => {
        result.current.patch('placement', 'video_feed')
        result.current.patch('assetFile', videoFile)
      })

      await act(async () => {
        await result.current.submit()
      })

      // Should show error and not mark as submitted
      expect(result.current.submitted).toBe(false)
      expect(result.current.submitError).toContain('Video processing failed')
    })

    it('should allow retry after mux failure without re-upload', async () => {
      // First attempt - mux fails
      const mockErrorSnapshot = {
        exists: () => true,
        data: () => ({ muxStatus: 'errored' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        setTimeout(() => callback(mockErrorSnapshot), 100)
        return vi.fn()
      })

      const videoFile = makeVideoFile()
      const { result } = renderHook(() => useCreateCampaign())
      
      act(() => {
        result.current.patch('placement', 'video_feed')
        result.current.patch('assetFile', videoFile)
      })

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.submitError).toBeTruthy() // First attempt should fail
      
      // Second attempt - mux succeeds (mock different response)
      const mockSuccessSnapshot = {
        exists: () => true,
        data: () => ({ muxPlaybackUrl: 'https://stream.mux.com/abc.m3u8' })
      }
      
      ;(onSnapshot as ReturnType<typeof vi.fn>).mockImplementation((docRef, callback) => {
        setTimeout(() => callback(mockSuccessSnapshot), 100)  
        return vi.fn()
      })

      // Retry should work without re-uploading file
      await act(async () => {
        await result.current.submit()
      })

      // Upload should only be called once (from first attempt)
      expect(mockUpload).toHaveBeenCalledTimes(1) // Will FAIL if retry re-uploads
      expect(result.current.submitted).toBe(true) // Should succeed on retry
    })
  })

  describe('non-video campaigns should not wait for mux', () => {
    it('should submit immediately for itinerary_feed campaigns', async () => {
      const imageFile = new File([new Uint8Array(1000)], 'image.jpg', { type: 'image/jpeg' })
      const { result } = renderHook(() => useCreateCampaign())
      
      act(() => {
        result.current.patch('placement', 'itinerary_feed')
        result.current.patch('assetFile', imageFile)
      })

      const startTime = Date.now()
      await act(async () => {
        await result.current.submit()
      })
      const endTime = Date.now()

      // Should complete quickly without waiting for Mux
      expect(endTime - startTime).toBeLessThan(1000)
      expect(result.current.submitted).toBe(true)
      expect(mockProcessAdVideoWithMux).not.toHaveBeenCalled()
    })

    it('should submit immediately for ai_slot campaigns', async () => {
      const imageFile = new File([new Uint8Array(1000)], 'image.jpg', { type: 'image/jpeg' })
      const { result } = renderHook(() => useCreateCampaign())
      
      act(() => {
        result.current.patch('placement', 'ai_slot')
        result.current.patch('assetFile', imageFile)
      })

      await act(async () => {
        await result.current.submit()
      })

      expect(result.current.submitted).toBe(true)
      expect(mockProcessAdVideoWithMux).not.toHaveBeenCalled()
    })
  })
})