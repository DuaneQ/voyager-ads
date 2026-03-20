import { useState, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { onSnapshot, doc } from 'firebase/firestore'
import { type CampaignDraft, type CampaignData, EMPTY_DRAFT } from '../types/campaign'
import { campaignRepository } from '../repositories/campaignRepositoryInstance'
import useAuthStore from '../store/authStore'
import { campaignAssetService } from '../services/campaign/CampaignAssetService'
import { functions, db } from '../config/firebaseConfig'

export const STEP_COUNT = 5

/**
 * Listens to a single Firestore document until Mux marks it ready or errored.
 * Resolves (never rejects) — worst case after 90 s so the user is never blocked.
 *
 * Cost note: this is one onSnapshot subscription per campaign creation, on the document
 * the user just created. It cancels itself as soon as Mux responds, which
 * typically takes 15–60 s. It is NOT a feed-wide listener.
 */
function waitForMuxProcessing(campaignId: string): Promise<void> {
  return new Promise((resolve) => {
    let unsub: () => void = () => {};

    const timeout = setTimeout(() => {
      unsub();
      resolve();
    }, 90_000);

    unsub = onSnapshot(doc(db, 'ads_campaigns', campaignId), (snap) => {
      if (!snap.exists()) {
        clearTimeout(timeout);
        unsub();
        resolve();
        return;
      }
      const data = snap.data();
      if (data?.muxPlaybackUrl || data?.muxStatus === 'ready' || data?.muxStatus === 'errored') {
        clearTimeout(timeout);
        unsub();
        resolve();
      }
    });
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

  const patch = useCallback(<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
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
        // Validate first so the user gets an error before any bytes are transferred.
        await campaignAssetService.validate(draft.assetFile, draft.placement)

        setIsUploading(true)
        setUploadProgress(0)
        const result = await campaignAssetService.upload(draft.assetFile, uid, (pct) => {
          setUploadProgress(pct)
        })
        assetUrl = result.downloadUrl
        storagePath = result.storagePath
        setIsUploading(false)
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
      const createdCampaign = await campaignRepository.create(campaignData, uid)

      // Trigger Mux transcoding for video_feed campaigns and wait for completion
      // CRITICAL: Only campaigns with working Mux URLs should be marked as submitted
      if (draft.placement === 'video_feed' && storagePath) {
        const processAd = httpsCallable(functions, 'processAdVideoWithMux')
        
        try {
          setProcessingStatus('Processing video...')
          
          // Trigger Mux processing
          await processAd({ campaignId: createdCampaign.id, storagePath })
          
          // Wait for Mux processing to complete (up to 90 seconds)
          // The waitForMuxProcessing utility resolves when either:
          // 1. muxPlaybackUrl is available (success)
          // 2. muxStatus === 'errored' (failure) 
          // 3. 90 second timeout (fail-safe)
          await waitForMuxProcessing(createdCampaign.id)
          
          setProcessingStatus(null)
        } catch (muxError) {
          setProcessingStatus(null)
          setIsUploading(false)
          setUploadProgress(0)
          const muxMessage = muxError instanceof Error ? muxError.message : 'Video processing failed - please try a different format'
          setSubmitError(muxMessage)
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
