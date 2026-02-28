/**
 * CampaignAssetService
 *
 * Handles pre-upload validation and Firebase Storage upload for ad creative assets.
 *
 * Constraints are aligned with Google Ads and Meta Ads standards:
 *
 * Video (video_feed):
 *   - Max 500 MB  (Google Ads recommends ≤ 256 MB; we allow 500 MB for Mux transcoding headroom)
 *   - MP4 / MOV only  (Mux-compatible container formats)
 *   - Duration: 5 – 60 seconds  (Google non-skippable ≤ 30 s; Meta best-practice 15 s; we allow 60 s)
 *
 * Image (itinerary_feed):
 *   - Max 10 MB
 *   - JPEG / PNG / WebP
 *
 * Image (ai_slot):
 *   - Max 5 MB
 *   - JPEG / PNG / WebP
 *
 * Storage path: `ads/{uid}/{timestamp}_{sanitized-filename}`
 * Security: filenames are sanitized; MIME type is enforced server-side via Storage rules.
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../../config/firebaseConfig'

// ─── Constraints ─────────────────────────────────────────────────────────────

export interface AssetConstraints {
  maxSizeBytes: number
  maxSizeDisplay: string
  acceptedMimeTypes: readonly string[]
  /** Seconds; null = not a video placement */
  minDurationSeconds: number | null
  maxDurationSeconds: number | null
}

/**
 * Per-placement ad creative constraints aligned with Google Ads + Meta Ads standards.
 *
 * Re-exported so StepCreative can display the spec text from a single source of truth.
 */
export const ASSET_CONSTRAINTS: Readonly<Record<string, AssetConstraints>> = {
  video_feed: {
    maxSizeBytes: 500 * 1024 * 1024,
    maxSizeDisplay: '500 MB',
    acceptedMimeTypes: ['video/mp4', 'video/quicktime'],
    minDurationSeconds: 5,
    maxDurationSeconds: 60,
  },
  itinerary_feed: {
    maxSizeBytes: 10 * 1024 * 1024,
    maxSizeDisplay: '10 MB',
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minDurationSeconds: null,
    maxDurationSeconds: null,
  },
  ai_slot: {
    maxSizeBytes: 5 * 1024 * 1024,
    maxSizeDisplay: '5 MB',
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minDurationSeconds: null,
    maxDurationSeconds: null,
  },
} as const

// ─── Result / Callbacks ──────────────────────────────────────────────────────

export interface AssetUploadResult {
  downloadUrl: string
  storagePath: string
}

/** Receives a 0-100 integer during upload. */
export type AssetUploadProgressCallback = (progress: number) => void

// ─── Interface (Dependency Inversion) ────────────────────────────────────────

export interface ICampaignAssetService {
  /**
   * Validates a file against placement-specific constraints.
   * Throws a human-readable Error on any violation so callers can surface it
   * without needing to parse error codes.
   */
  validate(file: File, placement: string): Promise<void>

  /**
   * Uploads a validated file to Firebase Storage.
   * @param file   Validated browser File
   * @param uid    Authenticated user UID (Storage namespace)
   * @param onProgress  Optional callback receiving 0-100 during upload
   */
  upload(
    file: File,
    uid: string,
    onProgress?: AssetUploadProgressCallback,
  ): Promise<AssetUploadResult>
}

// ─── Implementation ──────────────────────────────────────────────────────────

export class CampaignAssetService implements ICampaignAssetService {
  /**
   * Reads video duration via HTMLVideoElement.
   * Uses an object URL to avoid blocking the network; URL is revoked after use.
   */
  private getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(video.duration)
      }
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Unable to read video metadata. Ensure the file is a valid MP4 or MOV.'))
      }
      video.src = url
    })
  }

  /**
   * Removes characters that are invalid in Storage object names.
   * Preserves alphanumerics, hyphens, underscores, and the file extension.
   * Caps the base name at 60 characters to keep storage paths readable.
   */
  private sanitizeFilename(name: string): string {
    const dotIdx = name.lastIndexOf('.')
    const ext = dotIdx >= 0 ? name.slice(dotIdx).toLowerCase() : ''
    const base = name
      .slice(0, dotIdx >= 0 ? dotIdx : undefined)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 60)
    return base + ext
  }

  async validate(file: File, placement: string): Promise<void> {
    const constraints = ASSET_CONSTRAINTS[placement]
    if (!constraints) {
      throw new Error(`Unknown placement "${placement}".`)
    }

    // 1. MIME type — do not rely on the file extension alone; check the browser-reported type.
    if (!(constraints.acceptedMimeTypes as string[]).includes(file.type)) {
      const allowed = (constraints.acceptedMimeTypes as string[]).join(', ')
      throw new Error(
        `Invalid file type "${file.type}". Accepted types for ${placement}: ${allowed}.`,
      )
    }

    // 2. File size
    if (file.size > constraints.maxSizeBytes) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(1)
      throw new Error(
        `File is ${actualMb} MB — exceeds the ${constraints.maxSizeDisplay} limit for ${placement}.`,
      )
    }

    // 3. Video duration (only for placements with duration constraints)
    if (constraints.maxDurationSeconds !== null) {
      const duration = await this.getVideoDuration(file)

      if (!isFinite(duration) || duration <= 0) {
        throw new Error(
          'Unable to determine video duration. Please use a valid MP4 or MOV file.',
        )
      }
      if (
        constraints.minDurationSeconds !== null &&
        duration < constraints.minDurationSeconds
      ) {
        throw new Error(
          `Video is ${duration.toFixed(1)} s — minimum is ${constraints.minDurationSeconds} s.`,
        )
      }
      if (duration > constraints.maxDurationSeconds) {
        throw new Error(
          `Video is ${duration.toFixed(1)} s — maximum allowed is ${constraints.maxDurationSeconds} s.`,
        )
      }
    }
  }

  async upload(
    file: File,
    uid: string,
    onProgress?: AssetUploadProgressCallback,
  ): Promise<AssetUploadResult> {
    const timestamp = Date.now()
    const safeFilename = this.sanitizeFilename(file.name)
    const storagePath = `ads/${uid}/${timestamp}_${safeFilename}`
    const storageRef = ref(storage, storagePath)

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          // Preserve original name for admin reference; capped to avoid oversized metadata.
          originalName: file.name.substring(0, 100),
        },
      })

      task.on(
        'state_changed',
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(Math.round(pct))
        },
        (error) => {
          reject(new Error(`Upload failed: ${error.message}`))
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref)
            resolve({ downloadUrl, storagePath })
          } catch {
            reject(new Error('Failed to retrieve the download URL after upload.'))
          }
        },
      )
    })
  }
}

/** Singleton — import this in hooks/services; inject a mock in tests. */
export const campaignAssetService = new CampaignAssetService()
