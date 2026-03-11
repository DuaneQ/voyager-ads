import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaignStatus } from '../../hooks/useCampaignStatus'

const mockUpdate = vi.fn()

vi.mock('../../repositories/campaignRepositoryInstance', () => ({
  campaignRepository: {
    create: vi.fn(),
    getAllByUser: vi.fn(),
    getAllPending: vi.fn(),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}))

beforeEach(() => {
  mockUpdate.mockReset()
})

describe('useCampaignStatus', () => {
  // ── toggle: active → paused ───────────────────────────────────────────────

  it('calls update with status "paused" when current status is "active"', async () => {
    mockUpdate.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useCampaignStatus())

    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'active')
    })

    expect(mockUpdate).toHaveBeenCalledWith('camp-1', 'user-1', { status: 'paused' })
  })

  // ── toggle: paused → active ───────────────────────────────────────────────

  it('calls update with status "active" when current status is "paused"', async () => {
    mockUpdate.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useCampaignStatus())

    await act(async () => {
      await result.current.toggle('camp-2', 'user-2', 'paused')
    })

    expect(mockUpdate).toHaveBeenCalledWith('camp-2', 'user-2', { status: 'active' })
  })

  // ── onSuccess callback ────────────────────────────────────────────────────

  it('calls onSuccess after a successful toggle', async () => {
    mockUpdate.mockResolvedValueOnce(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCampaignStatus(onSuccess))

    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'active')
    })

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('does not throw when onSuccess is not provided', async () => {
    mockUpdate.mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useCampaignStatus())

    await expect(
      act(async () => {
        await result.current.toggle('camp-1', 'user-1', 'active')
      }),
    ).resolves.not.toThrow()
  })

  // ── loading state ─────────────────────────────────────────────────────────

  it('sets loading to true while update is in flight and false after', async () => {
    let resolve!: () => void
    const pending = new Promise<void>((res) => { resolve = res })
    mockUpdate.mockReturnValueOnce(pending)

    const { result } = renderHook(() => useCampaignStatus())

    act(() => {
      void result.current.toggle('camp-1', 'user-1', 'active')
    })

    expect(result.current.loading).toBe(true)

    await act(async () => { resolve() })

    expect(result.current.loading).toBe(false)
  })

  // ── error state ───────────────────────────────────────────────────────────

  it('sets error message when update throws an Error', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('Permission denied'))
    const { result } = renderHook(() => useCampaignStatus())

    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'active')
    })

    expect(result.current.error).toBe('Permission denied')
    expect(result.current.loading).toBe(false)
  })

  it('sets generic error message when update throws a non-Error value', async () => {
    mockUpdate.mockRejectedValueOnce('unexpected string error')
    const { result } = renderHook(() => useCampaignStatus())

    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'active')
    })

    expect(result.current.error).toBe('Failed to update campaign status.')
  })

  it('clears previous error on a new successful toggle', async () => {
    // First call fails
    mockUpdate.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCampaignStatus())

    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'active')
    })
    expect(result.current.error).toBe('Network error')

    // Second call succeeds
    mockUpdate.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'paused')
    })
    expect(result.current.error).toBeNull()
  })

  it('does not call onSuccess when update fails', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('fail'))
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCampaignStatus(onSuccess))

    await act(async () => {
      await result.current.toggle('camp-1', 'user-1', 'active')
    })

    expect(onSuccess).not.toHaveBeenCalled()
  })
})
