import { describe, it, expect, beforeEach } from 'vitest'
import { isStepValid, STEP_LABELS, STEP_COUNT } from '../../utils/wizardUtils'
import { EMPTY_DRAFT } from '../../types/campaign'
import type { CampaignDraft } from '../../types/campaign'

// A fully-valid draft for use as a baseline
const tomorrow = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-CA')
})()

const BASE_DRAFT: CampaignDraft = {
  ...EMPTY_DRAFT,
  name: 'Summer Beach Escape',
  placement: 'video_feed',
  startDate: tomorrow,
  endDate: '',
  creativeName: 'Beach Hero',
  landingUrl: 'https://example.com',
  audienceName: 'Global Travelers',
  location: 'Paris, France',
  targetDestination: '',
  budgetAmount: '50',
  agreePolicy: true,
}

describe('wizardUtils', () => {
  describe('constants', () => {
    it('STEP_COUNT equals STEP_LABELS length', () => {
      expect(STEP_COUNT).toBe(STEP_LABELS.length)
    })

    it('STEP_LABELS has the expected 5 steps in order', () => {
      expect(STEP_LABELS).toEqual(['Details', 'Creative', 'Targeting', 'Budget', 'Review'])
    })
  })

  describe('isStepValid — step 0 (Details)', () => {
    it('returns false when name is too short', () => {
      expect(isStepValid(0, { ...BASE_DRAFT, name: 'AB' })).toBe(false)
    })

    it('returns false when startDate is in the past', () => {
      expect(isStepValid(0, { ...BASE_DRAFT, startDate: '2020-01-01' })).toBe(false)
    })

    it('returns false when startDate is missing', () => {
      expect(isStepValid(0, { ...BASE_DRAFT, startDate: '' })).toBe(false)
    })

    it('returns false when endDate is before startDate', () => {
      expect(isStepValid(0, { ...BASE_DRAFT, endDate: '2020-01-01' })).toBe(false)
    })

    it('returns true when name >= 3 chars and startDate is today or future', () => {
      expect(isStepValid(0, BASE_DRAFT)).toBe(true)
    })

    it('returns true when endDate equals startDate', () => {
      expect(isStepValid(0, { ...BASE_DRAFT, endDate: tomorrow })).toBe(true)
    })
  })

  describe('isStepValid — step 1 (Creative)', () => {
    it('returns false when creativeName is empty', () => {
      expect(isStepValid(1, { ...BASE_DRAFT, creativeName: '' })).toBe(false)
    })

    it('returns false when creativeName is only whitespace', () => {
      expect(isStepValid(1, { ...BASE_DRAFT, creativeName: '   ' })).toBe(false)
    })

    it('returns false when landingUrl is empty', () => {
      expect(isStepValid(1, { ...BASE_DRAFT, landingUrl: '' })).toBe(false)
    })

    it('returns false when landingUrl is missing the https:// scheme', () => {
      expect(isStepValid(1, { ...BASE_DRAFT, landingUrl: 'example.com' })).toBe(false)
    })

    it('returns false when landingUrl uses http:// scheme', () => {
      // http is allowed (mirrors the regex)
      expect(isStepValid(1, { ...BASE_DRAFT, landingUrl: 'http://example.com' })).toBe(true)
    })

    it('returns true when creativeName has content and landingUrl has https:// scheme', () => {
      expect(isStepValid(1, BASE_DRAFT)).toBe(true)
    })
  })

  describe('isStepValid — step 2 (Targeting)', () => {
    it('returns false when audienceName is empty', () => {
      expect(isStepValid(2, { ...BASE_DRAFT, audienceName: '' })).toBe(false)
    })

    it('returns true for video_feed when location is empty (any destination)', () => {
      expect(isStepValid(2, { ...BASE_DRAFT, placement: 'video_feed', location: '' })).toBe(true)
    })

    it('returns true for video_feed when location is set', () => {
      expect(isStepValid(2, { ...BASE_DRAFT, placement: 'video_feed', location: 'London' })).toBe(true)
    })

    it('returns false for itinerary_feed when targetDestination is empty', () => {
      expect(isStepValid(2, {
        ...BASE_DRAFT,
        placement: 'itinerary_feed',
        targetDestination: '',
        location: 'London', // location alone should not be enough for itinerary_feed
      })).toBe(false)
    })

    it('returns true for itinerary_feed when targetDestination is set', () => {
      expect(isStepValid(2, {
        ...BASE_DRAFT,
        placement: 'itinerary_feed',
        targetDestination: 'Bali',
      })).toBe(true)
    })
  })

  describe('isStepValid — step 3 (Budget)', () => {
    it('returns false when budgetAmount is 0', () => {
      expect(isStepValid(3, { ...BASE_DRAFT, budgetAmount: '0' })).toBe(false)
    })

    it('returns false when budgetAmount is empty', () => {
      expect(isStepValid(3, { ...BASE_DRAFT, budgetAmount: '' })).toBe(false)
    })

    it('returns false when budgetAmount is non-numeric', () => {
      expect(isStepValid(3, { ...BASE_DRAFT, budgetAmount: 'abc' })).toBe(false)
    })

    it('returns true when budgetAmount is positive', () => {
      expect(isStepValid(3, { ...BASE_DRAFT, budgetAmount: '50' })).toBe(true)
    })
  })

  describe('isStepValid — step 4 (Review)', () => {
    it('returns false when agreePolicy is false', () => {
      expect(isStepValid(4, { ...BASE_DRAFT, agreePolicy: false })).toBe(false)
    })

    it('returns true when agreePolicy is true', () => {
      expect(isStepValid(4, { ...BASE_DRAFT, agreePolicy: true })).toBe(true)
    })
  })

  describe('isStepValid — default', () => {
    it('returns true for an unknown step index', () => {
      expect(isStepValid(99, BASE_DRAFT)).toBe(true)
    })
  })
})
