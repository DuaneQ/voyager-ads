import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../config/firebaseConfig', () => ({ db: {} }))

// Track per-campaign snapshot callbacks so tests can fire them independently
const callbacks: Record<string, (snap: any) => void> = {}
const errorCallbacks: Record<string, (err: Error) => void> = {}
const unsubMocks: Record<string, ReturnType<typeof vi.fn>> = {}
// vi.hoisted ensures mockOnSnapshot is available inside vi.mock factories,
// which are hoisted before variable declarations.
const { mockOnSnapshot } = vi.hoisted(() => ({ mockOnSnapshot: vi.fn() }))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: any, _col: string, campaignId: string) => ({ _id: campaignId })),
  query: vi.fn((...args: any[]) => args),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

function wireOnSnapshot() {
  mockOnSnapshot.mockImplementation((q: any, onNext: any, onError: any) => {
    const campaignId: string = Array.isArray(q) ? (q[0]?._id ?? 'unknown') : 'unknown'
    callbacks[campaignId] = onNext
    errorCallbacks[campaignId] = onError
    const unsub = vi.fn()
    unsubMocks[campaignId] = unsub
    return unsub
  })
}

wireOnSnapshot()

import { useMultiCampaignMetrics } from '../../hooks/useMultiCampaignMetrics'

function makeSnap(docs: any[]) {
  return { docs: docs.map(d => ({ data: () => d })) }
}

describe('useMultiCampaignMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireOnSnapshot()
    Object.keys(callbacks).forEach(k => delete callbacks[k])
    Object.keys(errorCallbacks).forEach(k => delete errorCallbacks[k])
    Object.keys(unsubMocks).forEach(k => delete unsubMocks[k])
  })

  it('returns empty metricsMap and loading=false when no ids provided', () => {
    const { result } = renderHook(() => useMultiCampaignMetrics([]))
    expect(result.current.metricsMap).toEqual({})
    expect(result.current.loading).toBe(false)
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })

  it('subscribes once per campaign id', () => {
    renderHook(() => useMultiCampaignMetrics(['a', 'b', 'c']))
    expect(mockOnSnapshot).toHaveBeenCalledTimes(3)
  })

  it('populates metricsMap keyed by campaign id', async () => {
    const { result } = renderHook(() => useMultiCampaignMetrics(['camp-x']))
    callbacks['camp-x']?.(makeSnap([
      { date: '2026-02-01', impressions: 300, clicks: 9, spend: 3 },
    ]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.metricsMap['camp-x']).toHaveLength(1)
    expect(result.current.metricsMap['camp-x'][0].impressions).toBe(300)
  })

  it('handles multiple campaigns independently', async () => {
    const { result } = renderHook(() => useMultiCampaignMetrics(['c1', 'c2']))
    callbacks['c1']?.(makeSnap([{ date: '2026-02-01', impressions: 100, clicks: 2, spend: 1 }]))
    callbacks['c2']?.(makeSnap([
      { date: '2026-02-01', impressions: 400, clicks: 8, spend: 4 },
      { date: '2026-02-02', impressions: 600, clicks: 12, spend: 6 },
    ]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.metricsMap['c1']).toHaveLength(1)
    expect(result.current.metricsMap['c2']).toHaveLength(2)
  })

  it('handles Firestore error for a campaign gracefully', async () => {
    const { result } = renderHook(() => useMultiCampaignMetrics(['camp-y']))
    errorCallbacks['camp-y']?.(new Error('permission denied'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.metricsMap['camp-y']).toBeUndefined()
  })

  it('unsubscribes all listeners on unmount', () => {
    const { unmount } = renderHook(() => useMultiCampaignMetrics(['a', 'b']))
    unmount()
    expect(unsubMocks['a']).toHaveBeenCalledOnce()
    expect(unsubMocks['b']).toHaveBeenCalledOnce()
  })

  it('resets to empty map when campaignIds becomes empty', async () => {
    const { result, rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useMultiCampaignMetrics(ids),
      { initialProps: { ids: ['camp-z'] } },
    )
    callbacks['camp-z']?.(makeSnap([{ date: '2026-02-01', impressions: 100, clicks: 2, spend: 1 }]))
    await waitFor(() => expect(result.current.metricsMap['camp-z']).toBeDefined())
    rerender({ ids: [] })
    expect(result.current.metricsMap).toEqual({})
  })

  it('unsubscribes old listeners when ids change', () => {
    const { rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useMultiCampaignMetrics(ids),
      { initialProps: { ids: ['old'] } },
    )
    rerender({ ids: ['new'] })
    expect(unsubMocks['old']).toHaveBeenCalledOnce()
    expect(mockOnSnapshot).toHaveBeenCalledTimes(2)
  })
})
