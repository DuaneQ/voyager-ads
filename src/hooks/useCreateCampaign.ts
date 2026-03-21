import { useState, useCallback, useRef } from 'react'
import { httpsCallable } from 'firebase/functions'
import { onSnapshot, doc } from 'firebase/firestore'
import { type CampaignDraft, type CampaignData, EMPTY_DRAFT } from '../types/campaign'
import { campaignRepository } from '../repositories/campaignRepositoryInstance'
import useAuthStore from '../store/authStore'
import { campaignAssetService } from '../services/campaign/CampaignAssetService'
import { functions, db } from '../config/firebaseConfig'

export const STEP_COUNT = 5

type MuxOutcome = 'ready' | 'errored' | 'timeout'

/**
 * Listens to a single Firestore document until Mux marks it ready or errored.
 * Returns an explicit outcome so the caller can distinguish success from failure.
 * Resolves after 90 s at the latest so the user is never blocked indefinitely.
 *
 * Cost note: this is one onSnapshot subscription per campaign creation, on the document
 * the user just created. It cancels itself as soon as Mux responds, which
 * typically takes 15–60 s. It is NOT a feed-wide listener.
 */
function waitForMuxProcessing(campaignId: string): Promise<MuxOutcome> {
  return new Promise((resolve) => {
    let unsub: () => void = () => {};

    // Server-side timeout is 540 s (~9 min). Give the client 8 minutes so
    // HDR→SDR transcode + Mux ingest can complete before we give up.
    // Previously 90 s — too short for large/HDR iPhone videos.
    const timeout = setTimeout(() => {
      unsub();
      resolve('timeout');
    }, 480_000); // 8 minutes

    unsub = onSnapshot(
      doc(db, 'ads_campaigns', campaignId),
      (snap) => {
        if (!snap.exists()) {
          clearTimeout(timeout);
          unsub();
          resolve('errored');
          return;
        }
        const data = snap.data();
        if (data?.muxPlaybackUrl || data?.muxStatus === 'ready') {
          clearTimeout(timeout);
          unsub();
          resolve('ready');
        } else if (data?.muxStatus === 'errored') {
          clearTimeout(timeout);
          unsub();
          resolve('errored');
        }
      },
      (_err) => {
        // Firestore listener error (e.g. permission denied, network failure).
        // Treat as a failure so submit() surfaces an error instead of timing out silently.
        clearTimeout(timeout);
        unsub();
        resolve('errored');
      },
    );
  });
}

/**
 * Manages wizard step navigation, campaign draft state, asset upload, and Firestore submission.
 *
 * Submit flow:
 *   1. Validate the asset file (type, size, video duration) via CampaignAssetService.
 *   2. Upload the file to Firebase Storage; surface progress via `uploadProgress` (0-100).
 *   3. Write the campaign document to Firestore with the resulting `assetUrl`.
 *   4. For video_feed campaigns: Wait for Mux processing to complete before marking as submitted.
 *
 * All state mutation goes through `patch` to keep updates predictable and testable.
 */
export function useCreateCampaign() {
  const user = useAuthStore(state => state.user)
  const [step, setStep] = useState(0) // 0-indexed internally
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)

  // Cache the upload result so retrying submit does not re-upload the same file.
  // Cleared when the user selects a new file or calls reset().
  const uploadedAssetRef = useRef<{ assetUrl: string; storagePath: string } | null>(null)

  // Cache the created campaign ID so retrying submit (e.g. after a Mux failure)
  // does not write a second Firestore document.  Cleared only on reset().
  const createdCampaignRef = useRef<{ id: string } | null>(null)

  const patch = useCallback(<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
    // When the user picks a new asset file, invalidate the cached upload result
    // so the next submit re-uploads the new file instead of the old one.
    if (key === 'assetFile') {
      uploadedAssetRef.current = null
    }
    setDraft(prev => ({ ...prev, [key]: value }))
  }, [])

  const next = useCallback(() => setStep(s => Math.min(s + 1, STEP_COUNT - 1)), [])
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), [])
  const goTo = useCallback((target: number) => setStep(target), [])

  const submit = useCallback(async () => {
    setSubmitError(null)
    // In E2E preview builds the auth store may not have hydrated yet because
    // onAuthStateChanged fires asynchronously. Fall back to a placeholder uid
    // so the UI flow completes; the stub repository handles the create call.
    const uid = user?.uid ?? (import.meta.env.VITE_E2E_AUTH_BYPASS === 'true' ? 'e2e-user' : null)
    if (!uid) {
      setSubmitError('You must be signed in to submit a campaign.')
      return
    }
    try {
      let assetUrl: string | null = null
      let storagePath: string | null = null

      if (draft.assetFile) {
        if (uploadedAssetRef.current) {
          // Reuse the result from a previous successful upload (retry path).
          // Avoids charging the user a second upload on a transient failure.
          assetUrl = uploadedAssetRef.current.assetUrl
          storagePath = uploadedAssetRef.current.storagePath
        } else {
          // Validate first so the user gets an error before any bytes are transferred.
          await campaignAssetService.validate(draft.assetFile, draft.placement)

          setIsUploading(true)
          setUploadProgress(0)
          const result = await campaignAssetService.upload(draft.assetFile, uid, (pct) => {
            setUploadProgress(pct)
          })
          assetUrl = result.downloadUrl
          storagePath = result.storagePath
          uploadedAssetRef.current = { assetUrl, storagePath }
          setIsUploading(false)
        }
      }

      // Build CampaignData: strip the File object (not Firestore-safe), substitute assetUrl.
      //
      // DATE SERIALIZATION NOTE: startDate, endDate, targetTravelStartDate,
      // and targetTravelEndDate are already YYYY-MM-DD strings from the form.
      // Store them as plain strings — do NOT convert to Timestamps or call
      // toISOString() (that coerces to UTC and shifts dates in negative-UTC
      // timezones). Use displayDate(raw) for display and parseLocalDate(raw)
      // for Date objects on reads.
      const { assetFile: _discarded, ...rest } = draft
      const campaignData: CampaignData = {
        ...rest,
        assetUrl,
        assetStoragePath: storagePath ?? undefined,
        userEmail: user?.email ?? '',
      }
      // Idempotent create: skip if a previous attempt already wrote the doc.
      // This prevents duplicate Firestore documents when Mux fails and the user retries.
      let createdCampaign: { id: string }
      if (createdCampaignRef.current) {
        createdCampaign = createdCampaignRef.current
      } else {
        createdCampaign = await campaignRepository.create(campaignData, uid)
        createdCampaignRef.current = createdCampaign
      }

      // Trigger Mux transcoding for video_feed campaigns and wait for completion
      // CRITICAL: Only campaigns with working Mux URLs should be marked as submitted
      if (draft.placement === 'video_feed' && storagePath) {
        const processAd = httpsCallable(functions, 'processAdVideoWithMux')
        
        try {
          setProcessingStatus('Processing video… this may take a few minutes for large or HDR files. Please keep this page open.')
          
          // Trigger Mux processing
          await processAd({ campaignId: createdCampaign.id, storagePath })
          
          // Wait for Mux processing to complete (up to 90 seconds)
          const muxOutcome = await waitForMuxProcessing(createdCampaign.id)
          setProcessingStatus(null)

          if (muxOutcome === 'errored') {
            setSubmitError('Video processing failed. Your campaign was saved — click Submit again to retry video processing.')
            return
          }
          if (muxOutcome === 'timeout') {
            setSubmitError('Video processing is taking longer than expected. Your campaign was saved — click Submit again to check the status.')
            return
          }
          // muxOutcome === 'ready' — fall through to setSubmitted(true)
        } catch (muxError) {
          setProcessingStatus(null)
          setIsUploading(false)
          setUploadProgress(0)
          const muxMessage = muxError instanceof Error ? muxError.message : 'Video processing failed - please try a different format'
          setSubmitError(`${muxMessage}. Your campaign was saved — click Submit again to retry.`)
          return // Don't mark as submitted if Mux processing failed
        }
      }

      setSubmitted(true)
    } catch (err) {
      setIsUploading(false)
      setUploadProgress(0)
      setProcessingStatus(null)
      const message =
        err instanceof Error ? err.message : 'Failed to submit campaign. Please try again.'
      setSubmitError(message)
    }
  }, [draft, user])

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT)
    setStep(0)
    setSubmitted(false)
    setSubmitError(null)
    setIsUploading(false)
    setUploadProgress(0)
    setProcessingStatus(null)
    uploadedAssetRef.current = null
    createdCampaignRef.current = null
  }, [])

  return { 
    step, 
    draft, 
    patch, 
    next, 
    back, 
    goTo, 
    submit, 
    reset, 
    submitted, 
    submitError, 
    isUploading, 
    uploadProgress,
    processingStatus,
    waitForMuxProcessing // Expose for testing
  }
}
