import { describe, it, expect, beforeEach } from 'vitest'
import useCampaignStore from '../../store/campaignStore'

const initialState = useCampaignStore.getState()

beforeEach(() => {
  useCampaignStore.setState(initialState, true)
})

describe('campaignStore', () => {
  it('starts with an empty draft', () => {
    const { draft, isSubmitting, submissionError } = useCampaignStore.getState()
    expect(draft.name).toBe('')
    expect(draft.placementKey).toBe('')
    expect(draft.billingModel).toBe('')
    expect(draft.dailyBudgetUsd).toBeNull()
    expect(draft.targeting.geoRegions).toEqual([])
    expect(draft.targeting.interests).toEqual([])
    expect(isSubmitting).toBe(false)
    expect(submissionError).toBeNull()
  })

  it('setDraftField updates a single draft field', () => {
    useCampaignStore.getState().setDraftField('name', 'Summer Campaign')
    expect(useCampaignStore.getState().draft.name).toBe('Summer Campaign')
  })

  it('setDraftField does not clobber other draft fields', () => {
    useCampaignStore.getState().setDraftField('name', 'My Campaign')
    useCampaignStore.getState().setDraftField('placementKey', 'videoFeed')

    const { draft } = useCampaignStore.getState()
    expect(draft.name).toBe('My Campaign')
    expect(draft.placementKey).toBe('videoFeed')
  })

  it('setDraftField can set billingModel', () => {
    useCampaignStore.getState().setDraftField('billingModel', 'CPM')
    expect(useCampaignStore.getState().draft.billingModel).toBe('CPM')
  })

  it('setDraftField can set dailyBudgetUsd', () => {
    useCampaignStore.getState().setDraftField('dailyBudgetUsd', 50)
    expect(useCampaignStore.getState().draft.dailyBudgetUsd).toBe(50)
  })

  it('resetDraft restores draft to empty state', () => {
    useCampaignStore.getState().setDraftField('name', 'To be cleared')
    useCampaignStore.getState().setSubmissionError('some error')
    useCampaignStore.getState().resetDraft()

    const { draft, submissionError } = useCampaignStore.getState()
    expect(draft.name).toBe('')
    expect(draft.placementKey).toBe('')
    expect(submissionError).toBeNull()
  })

  it('setSubmitting toggles isSubmitting', () => {
    useCampaignStore.getState().setSubmitting(true)
    expect(useCampaignStore.getState().isSubmitting).toBe(true)

    useCampaignStore.getState().setSubmitting(false)
    expect(useCampaignStore.getState().isSubmitting).toBe(false)
  })

  it('setSubmissionError sets the error message', () => {
    useCampaignStore.getState().setSubmissionError('Network error')
    expect(useCampaignStore.getState().submissionError).toBe('Network error')
  })

  it('setSubmissionError can clear the error', () => {
    useCampaignStore.getState().setSubmissionError('Some error')
    useCampaignStore.getState().setSubmissionError(null)
    expect(useCampaignStore.getState().submissionError).toBeNull()
  })
})
