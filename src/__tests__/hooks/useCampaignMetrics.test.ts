import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../config/firebaseConfig', () => ({ db: {} }))

let capturedOnNext: ((snap: any) => void) | null = null
let capturedOnError: ((err: Error) => void) | null = null
const mockUnsub = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn((...args: any[]) => args),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((_q: any, onNext: any, onError: any) => {
    capturedOnNext = onNext
    capturedOnError = onError
    return mockUnsub
  }),
}))

import { useCampaignMetrics } from '../../hooks/useCampaignMetrics'
import * as firestore from 'firebase/firestore'

function makeSnap(docs: any[]) {
  return { docs: docs.map(d => ({ data: () => d })) }
}

describe('useCampaignMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnNext = null
    capturedOnError = null
  })

  it('returns empty metrics and loading=false when campaignId is undefined', () => {
    const { result } = renderHook(() => useCampaignMetrics(undefined))
    expect(result.current.metrics).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(firestore.onSnapshot).not.toHaveBeenCalled()
  })

  it('sets loading=true while waiting for first snapshot', () => {
    // onSnapshot is called but capturedOnNext not invoked yet
    const { result } = renderHook(() => useCampaignMetrics('camp-1'))
    expect(result.current.loading).toBe(true)
  })

  it('subscribes to the correct Firestore path', () => {
    renderHook(() => useCampaignMetrics('camp-1'))
    expect(firestore.collection).toHaveBeenCalledWith(
      expect.anything(),
      'ads_campaigns',
      'camp-1',
      'daily_metrics',
    )
    expect(firestore.onSnapshot).toHaveBeenCalledOnce()
  })

  it('populates metrics and clears loading after first snapshot', async () => {
    const { result } = renderHook(() => useCampaignMetrics('camp-1'))
    const snapshots = [
      { date: '2026-02-01', impressions: 1000, clicks: 20, spend: 5 },
      { date: '2026-02-02', impressions: 2000, clicks: 40, spend: 10 },
    ]
    capturedOnNext!(makeSnap(snapshots))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.metrics).toHaveLength(2)
    expect(result.current.metrics[0].impressions).toBe(1000)
    expect(result.current.metrics[1].clicks).toBe(40)
  })

  it('clears loading and keeps empty metrics on Firestore error', async () => {
    const { result } = renderHook(() => useCampaignMetrics('camp-1'))
    capturedOnError!(new Error('permission denied'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.metrics).toEqual([])
  })

  it('calls unsubscribe when campaignId changes', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) => useCampaignMetrics(id),
      { initialProps: { id: 'camp-1' } },
    )
    rerender({ id: 'camp-2' })
    expect(mockUnsub).toHaveBeenCalledOnce()
  })

  it('calls unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useCampaignMetrics('camp-1'))
    unmount()
    expect(mockUnsub).toHaveBeenCalledOnce()
  })

  it('resets metrics to [] when campaignId changes to undefined', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useCampaignMetrics(id),
      { initialProps: { id: 'camp-1' as string | undefined } },
    )
    capturedOnNext!(makeSnap([{ date: '2026-02-01', impressions: 500, clicks: 5, spend: 2 }]))
    await waitFor(() => expect(result.current.metrics).toHaveLength(1))
    rerender({ id: undefined })
    expect(result.current.metrics).toEqual([])
  })
})
