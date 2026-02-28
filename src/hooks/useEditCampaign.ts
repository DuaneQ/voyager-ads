import { useState, useCallback, useEffect, useMemo } from 'react'
import { httpsCallable } from 'firebase/functions'
import type { CampaignDraft, Campaign } from '../types/campaign'
import { EMPTY_DRAFT } from '../types/campaign'
import { campaignRepository } from '../repositories/campaignRepositoryInstance'
import useAuthStore from '../store/authStore'
import { campaignAssetService } from '../services/campaign/CampaignAssetService'
import { useCampaigns } from './useCampaigns'
import { STEP_COUNT } from '../utils/wizardUtils'
import { functions } from '../config/firebaseConfig'

/**
 * Manages editing an existing campaign.
 *
 * Responsibilities (Single Responsibility Principle):
 *   - Load the campaign by ID from the user's campaign list.
 *   - Hydrate the wizard draft from the loaded campaign.
 *   - Validate and upload a replacement asset if the advertiser selects a new file.
 *   - Call `campaignRepository.update()` with `isUnderReview: true` so the
 *     saved changes are re-reviewed before going live.
 *
 * The return shape is intentionally compatible with `useCreateCampaign` so that
 * EditCampaignWizard and CampaignWizard can be swapped without the parent caring
 * (Liskov Substitution Principle).
 */
export function useEditCampaign(campaignId: string | undefined) {
  const user = useAuthStore(state => state.user)
  const { campaigns, loading: campaignsLoading } = useCampaigns()

  const campaign: Campaign | undefined = useMemo(
    () => campaigns.find(c => c.id === campaignId),
    [campaigns, campaignId],
  )

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Hydrate draft from campaign once it loads. Only run once per campaign load
  // to avoid overwriting in-progress edits on re-renders.
  useEffect(() => {
    if (campaign && !draftHydrated) {
      const { id: _id, uid: _uid, status: _status, isUnderReview: _r, reviewNote: _n,
              createdAt: _ca, updatedAt: _ua, totalImpressions: _ti, totalClicks: _tc,
              userEmail: _ue, ...editableFields } = campaign as Campaign & Record<string, unknown>
      setDraft({ ...EMPTY_DRAFT, ...editableFields, assetFile: null })
      setDraftHydrated(true)
    }
  }, [campaign, draftHydrated])

  const patch = useCallback(<K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }, [])

  const next = useCallback(() => setStep(s => Math.min(s + 1, STEP_COUNT - 1)), [])
  const back = useCallback(() => setStep(s => Math.max(s - 1, 0)), [])
  const goTo = useCallback((target: number) => setStep(target), [])

  const submit = useCallback(async () => {
    setSubmitError(null)
    const uid = user?.uid ?? null
    if (!uid) {
      setSubmitError('You must be signed in to save a campaign.')
      return
    }
    if (!campaignId) {
      setSubmitError('Campaign ID is missing.')
      return
    }
    try {
      // Determine the asset URL to persist.
      // • New file selected → validate + upload → use fresh downloadUrl.
      // • No new file → retain the existing assetUrl from the loaded campaign.
      let assetUrl: string | null = campaign?.assetUrl ?? null
      let newStoragePath: string | null = null

      if (draft.assetFile) {
        await campaignAssetService.validate(draft.assetFile, draft.placement)
        setIsUploading(true)
        setUploadProgress(0)
        const result = await campaignAssetService.upload(draft.assetFile, uid, (pct) => {
          setUploadProgress(pct)
        })
        assetUrl = result.downloadUrl
        newStoragePath = result.storagePath
        setIsUploading(false)
      }

      // Strip the File object (not Firestore-safe) and set isUnderReview so any
      // saved edit is re-reviewed before the campaign goes live.
      const { assetFile: _discarded, ...rest } = draft
      await campaignRepository.update(campaignId, uid, {
        ...rest,
        assetUrl,
        ...(newStoragePath ? { assetStoragePath: newStoragePath } : {}),
        isUnderReview: true,
      })

      // Re-trigger Mux transcoding if a new video file was uploaded
      if (draft.placement === 'video_feed' && newStoragePath) {
        const processAd = httpsCallable(functions, 'processAdVideoWithMux')
        processAd({ campaignId, storagePath: newStoragePath })
          .catch(err => console.error('[processAdVideoWithMux] Edit: Failed to trigger Mux processing:', err))
      }

      setSubmitted(true)
    } catch (err) {
      setIsUploading(false)
      setUploadProgress(0)
      const message =
        err instanceof Error ? err.message : 'Failed to save campaign. Please try again.'
      setSubmitError(message)
    }
  }, [draft, user, campaignId, campaign])

  const reset = useCallback(() => {
    setDraft(EMPTY_DRAFT)
    setStep(0)
    setSubmitted(false)
    setSubmitError(null)
    setIsUploading(false)
    setUploadProgress(0)
    setDraftHydrated(false)
  }, [])

  return {
    // Shared wizard interface (compatible with useCreateCampaign — LSP)
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
    // Edit-specific
    campaign,
    campaignLoading: campaignsLoading,
  }
}
