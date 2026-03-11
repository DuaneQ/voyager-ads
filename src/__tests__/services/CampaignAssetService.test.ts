/**
 * CampaignAssetService unit tests
 *
 * Firebase Storage is fully mocked — no network calls are made.
 * HTMLVideoElement.prototype is patched for duration-reading tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CampaignAssetService,
  ASSET_CONSTRAINTS,
} from '../../services/campaign/CampaignAssetService'

// ── Firebase Storage mock ─────────────────────────────────────────────────────
const mockGetDownloadURL = vi.hoisted(() => vi.fn())
const mockUploadBytesResumable = vi.hoisted(() => vi.fn())
const mockRef = vi.hoisted(() => vi.fn())

vi.mock('firebase/storage', () => ({
  ref: mockRef,
  uploadBytesResumable: mockUploadBytesResumable,
  getDownloadURL: mockGetDownloadURL,
}))

vi.mock('../../config/firebaseConfig', () => ({
  storage: {},
  auth: {},
  db: {},
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(
  name: string,
  type: string,
  sizeBytes: number,
): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type })
  return new File([blob], name, { type })
}

/**
 * Stubs the global Image constructor so getImageDimensions() resolves with
 * the given width × height without touching the real DOM or loading a file.
 * Call vi.unstubAllGlobals() in afterEach to restore.
 */
function mockImageDimensions(width: number, height: number, shouldError = false) {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  class MockImage {
    naturalWidth = width
    naturalHeight = height
    onload: ((e: Event) => void) | null = null
    onerror: ((e: Event) => void) | null = null
    set src(_url: string) {
      Promise.resolve().then(() => {
        if (shouldError) {
          this.onerror?.(new Event('error'))
        } else {
          this.onload?.(new Event('load'))
        }
      })
    }
  }
  vi.stubGlobal('Image', MockImage)
}

/**
 * Patches HTMLVideoElement so `loadedmetadata` fires synchronously with
 * the given duration (or triggers onerror when duration is NaN).
 * Uses Object.defineProperty because HTMLMediaElement.duration is read-only.
 */
function mockVideoDuration(duration: number) {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

  const origCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag !== 'video') return origCreate(tag)
    const el = origCreate('video') as HTMLVideoElement
    Object.defineProperty(el, 'src', {
      set() {
        // duration is read-only on HTMLMediaElement; define it on the instance.
        Object.defineProperty(el, 'duration', {
          value: duration,
          writable: true,
          configurable: true,
        })
        if (isNaN(duration)) {
          el.onerror?.(new Event('error'))
        } else {
          el.onloadedmetadata?.(new Event('loadedmetadata'))
        }
      },
    })
    return el
  })
}

function setupSuccessfulUpload(downloadUrl = 'https://storage.example.com/ads/uid/file.mp4') {
  mockRef.mockReturnValue({ fullPath: 'ads/uid/file.mp4' })
  mockGetDownloadURL.mockResolvedValue(downloadUrl)

  // Simulate uploadBytesResumable emitting progress then completing
  mockUploadBytesResumable.mockImplementation((_ref: unknown, _blob: unknown) => {
    let _onProgress: ((s: { bytesTransferred: number; totalBytes: number }) => void) | undefined
    let _onComplete: (() => void) | undefined
    const task = {
      snapshot: { ref: _ref },
      on: (
        _event: string,
        progress: (s: { bytesTransferred: number; totalBytes: number }) => void,
        _error: (e: Error) => void,
        complete: () => void,
      ) => {
        _onProgress = progress
        _onComplete = complete
        // Emit 50% then 100% synchronously on next tick
        Promise.resolve().then(() => {
          _onProgress?.({ bytesTransferred: 50, totalBytes: 100 })
          _onProgress?.({ bytesTransferred: 100, totalBytes: 100 })
          _onComplete?.()
        })
      },
    }
    return task
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ASSET_CONSTRAINTS', () => {
  it('exposes constraints for video_feed, itinerary_feed, and ai_slot', () => {
    expect(ASSET_CONSTRAINTS).toHaveProperty('video_feed')
    expect(ASSET_CONSTRAINTS).toHaveProperty('itinerary_feed')
    expect(ASSET_CONSTRAINTS).toHaveProperty('ai_slot')
  })

  it('video_feed allows max 500 MB and duration 5-60 s', () => {
    const c = ASSET_CONSTRAINTS['video_feed']
    expect(c.maxSizeBytes).toBe(500 * 1024 * 1024)
    expect(c.minDurationSeconds).toBe(5)
    expect(c.maxDurationSeconds).toBe(60)
  })

  it('itinerary_feed allows max 10 MB with no duration constraint', () => {
    const c = ASSET_CONSTRAINTS['itinerary_feed']
    expect(c.maxSizeBytes).toBe(10 * 1024 * 1024)
    expect(c.minDurationSeconds).toBeNull()
    expect(c.maxDurationSeconds).toBeNull()
    expect(c.minAspectRatio).toBe(0.8)
    expect(c.maxAspectRatio).toBe(1.25)
  })

  it('ai_slot allows max 5 MB with no duration constraint', () => {
    const c = ASSET_CONSTRAINTS['ai_slot']
    expect(c.maxSizeBytes).toBe(5 * 1024 * 1024)
    expect(c.minDurationSeconds).toBeNull()
    expect(c.minAspectRatio).toBe(1.3)
    expect(c.maxAspectRatio).toBe(4.0)
  })

  it('video_feed has no aspect ratio constraints', () => {
    const c = ASSET_CONSTRAINTS['video_feed']
    expect(c.minAspectRatio).toBeNull()
    expect(c.maxAspectRatio).toBeNull()
  })
})

describe('CampaignAssetService.validate', () => {
  let service: CampaignAssetService

  beforeEach(() => {
    service = new CampaignAssetService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  // ── MIME type ──

  it('throws for an invalid MIME type on itinerary_feed', async () => {
    const file = makeFile('ad.gif', 'image/gif', 1024)
    await expect(service.validate(file, 'itinerary_feed')).rejects.toThrow('Invalid file type')
  })

  it('accepts image/jpeg for itinerary_feed', async () => {
    mockImageDimensions(1080, 1080) // 1:1 — ideal square
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).resolves.toBeUndefined()
  })

  it('accepts image/webp for ai_slot', async () => {
    mockImageDimensions(1920, 1080) // 16:9 — ideal landscape
    const file = makeFile('ad.webp', 'image/webp', 1024)
    await expect(service.validate(file, 'ai_slot')).resolves.toBeUndefined()
  })

  it('throws for image/gif on ai_slot', async () => {
    const file = makeFile('ad.gif', 'image/gif', 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('Invalid file type')
  })

  it('accepts video/mp4 for video_feed', async () => {
    mockVideoDuration(30)
    const file = makeFile('ad.mp4', 'video/mp4', 1024)
    await expect(service.validate(file, 'video_feed')).resolves.toBeUndefined()
  })

  it('accepts video/quicktime for video_feed', async () => {
    mockVideoDuration(30)
    const file = makeFile('ad.mov', 'video/quicktime', 1024)
    await expect(service.validate(file, 'video_feed')).resolves.toBeUndefined()
  })

  it('throws for video/avi on video_feed', async () => {
    const file = makeFile('ad.avi', 'video/avi', 1024)
    await expect(service.validate(file, 'video_feed')).rejects.toThrow('Invalid file type')
  })

  // ── File size ──

  it('throws when image exceeds itinerary_feed 10 MB limit', async () => {
    const file = makeFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024)
    await expect(service.validate(file, 'itinerary_feed')).rejects.toThrow('exceeds the 10 MB limit')
  })

  it('throws when image exceeds ai_slot 5 MB limit', async () => {
    const file = makeFile('big.png', 'image/png', 6 * 1024 * 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('exceeds the 5 MB limit')
  })

  it('throws when video exceeds 500 MB limit', async () => {
    const file = makeFile('huge.mp4', 'video/mp4', 501 * 1024 * 1024)
    await expect(service.validate(file, 'video_feed')).rejects.toThrow('exceeds the 500 MB limit')
  })

  // ── Video duration ──

  it('throws when video is shorter than 5 s', async () => {
    mockVideoDuration(3)
    const file = makeFile('short.mp4', 'video/mp4', 1024)
    await expect(service.validate(file, 'video_feed')).rejects.toThrow('minimum is 5 s')
  })

  it('throws when video exceeds 60 s', async () => {
    mockVideoDuration(90)
    const file = makeFile('long.mp4', 'video/mp4', 1024)
    await expect(service.validate(file, 'video_feed')).rejects.toThrow('maximum allowed is 60 s')
  })

  it('accepts video exactly at 60 s', async () => {
    mockVideoDuration(60)
    const file = makeFile('ok.mp4', 'video/mp4', 1024)
    await expect(service.validate(file, 'video_feed')).resolves.toBeUndefined()
  })

  it('throws when video is exactly at 5 s boundary (minimum passes)', async () => {
    mockVideoDuration(5)
    const file = makeFile('ok.mp4', 'video/mp4', 1024)
    await expect(service.validate(file, 'video_feed')).resolves.toBeUndefined()
  })

  // ── Unknown placement ──

  it('throws for an unknown placement', async () => {
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'unknown_placement')).rejects.toThrow('Unknown placement')
  })

  // ── Aspect ratio — ai_slot (landscape required, min 1.3:1, max 4:1) ──

  it('accepts ai_slot image at exactly the minimum ratio (4:3 = 1.33)', async () => {
    mockImageDimensions(1333, 1000) // ~1.33:1 — just above min 1.3
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).resolves.toBeUndefined()
  })

  it('accepts ai_slot image at 16:9', async () => {
    mockImageDimensions(1920, 1080)
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).resolves.toBeUndefined()
  })

  it('accepts ai_slot image at max ratio (4:1)', async () => {
    mockImageDimensions(4000, 1000) // exactly 4:1
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).resolves.toBeUndefined()
  })

  it('rejects ai_slot square image (1:1)', async () => {
    mockImageDimensions(1080, 1080)
    const file = makeFile('square.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('too tall')
  })

  it('rejects ai_slot portrait image (9:16)', async () => {
    mockImageDimensions(1080, 1920)
    const file = makeFile('portrait.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('too tall')
  })

  it('rejects ai_slot image that is too wide (5:1)', async () => {
    mockImageDimensions(5000, 1000)
    const file = makeFile('wide.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('too wide')
  })

  it('ai_slot error message contains placement guidance', async () => {
    mockImageDimensions(1080, 1920) // portrait
    const file = makeFile('portrait.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('1920\xd71080')
  })

  // ── Aspect ratio — itinerary_feed (square-ish, 0.8:1 to 1.25:1) ──

  it('accepts itinerary_feed image at exactly 1:1', async () => {
    mockImageDimensions(1080, 1080)
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).resolves.toBeUndefined()
  })

  it('accepts itinerary_feed image at 4:5 minimum (0.8)', async () => {
    mockImageDimensions(800, 1000) // exactly 0.8
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).resolves.toBeUndefined()
  })

  it('accepts itinerary_feed image at 5:4 maximum (1.25)', async () => {
    mockImageDimensions(1250, 1000) // exactly 1.25
    const file = makeFile('ad.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).resolves.toBeUndefined()
  })

  it('rejects itinerary_feed portrait image that is too tall (9:16)', async () => {
    mockImageDimensions(1080, 1920)
    const file = makeFile('tall.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).rejects.toThrow('too tall')
  })

  it('rejects itinerary_feed landscape image that is too wide (16:9)', async () => {
    mockImageDimensions(1920, 1080)
    const file = makeFile('wide.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).rejects.toThrow('too wide')
  })

  it('itinerary_feed error message contains placement guidance', async () => {
    mockImageDimensions(1920, 1080) // too wide
    const file = makeFile('wide.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'itinerary_feed')).rejects.toThrow('1080\xd71080')
  })

  it('rejects when image dimensions cannot be read', async () => {
    mockImageDimensions(0, 0, true) // shouldError = true
    const file = makeFile('corrupt.jpg', 'image/jpeg', 1024)
    await expect(service.validate(file, 'ai_slot')).rejects.toThrow('Unable to read image dimensions')
  })
})

describe('CampaignAssetService.upload', () => {
  let service: CampaignAssetService

  beforeEach(() => {
    service = new CampaignAssetService()
    vi.clearAllMocks()
  })

  it('uploads file and returns downloadUrl and storagePath', async () => {
    setupSuccessfulUpload('https://cdn.example.com/file.jpg')
    const file = makeFile('banner.jpg', 'image/jpeg', 2048)
    const result = await service.upload(file, 'uid-123')
    expect(result.downloadUrl).toBe('https://cdn.example.com/file.jpg')
    expect(result.storagePath).toMatch(/^ads\/uid-123\/\d+_banner\.jpg$/)
  })

  it('calls onProgress with 0 to 100 values', async () => {
    setupSuccessfulUpload()
    const file = makeFile('banner.jpg', 'image/jpeg', 100)
    const progressValues: number[] = []
    await service.upload(file, 'uid-abc', (pct) => progressValues.push(pct))
    expect(progressValues).toContain(50)
    expect(progressValues).toContain(100)
  })

  it('sanitizes the filename — strips special characters', async () => {
    setupSuccessfulUpload()
    const file = makeFile('my ad (1).jpg', 'image/jpeg', 100)
    const result = await service.upload(file, 'uid-abc')
    // Path should not contain spaces or parentheses
    expect(result.storagePath).not.toMatch(/[ ()]/)
    expect(result.storagePath).toMatch(/ads\/uid-abc\//)
  })

  it('rejects when uploadBytesResumable errors', async () => {
    mockRef.mockReturnValue({})
    mockUploadBytesResumable.mockImplementation(() => ({
      snapshot: { ref: {} },
      on: (_: string, __: unknown, onError: (e: Error) => void) => {
        Promise.resolve().then(() => onError(new Error('quota exceeded')))
      },
    }))
    const file = makeFile('banner.jpg', 'image/jpeg', 100)
    await expect(service.upload(file, 'uid-abc')).rejects.toThrow('quota exceeded')
  })

  it('rejects when getDownloadURL fails after upload completes', async () => {
    mockRef.mockReturnValue({})
    mockGetDownloadURL.mockRejectedValue(new Error('URL fetch failed'))
    mockUploadBytesResumable.mockImplementation((_ref: unknown) => ({
      snapshot: { ref: _ref },
      on: (_: string, __: unknown, ___: unknown, complete: () => void) => {
        Promise.resolve().then(() => complete())
      },
    }))
    const file = makeFile('banner.jpg', 'image/jpeg', 100)
    await expect(service.upload(file, 'uid-abc')).rejects.toThrow(
      'Failed to retrieve the download URL',
    )
  })
})
