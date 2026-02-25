import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firestore functions used by the repository
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn((db: any, name: string) => ({ _col: name })),
  getDocs: vi.fn(),
  query: vi.fn((...args: any[]) => args),
  where: vi.fn((...args: any[]) => ({ _where: args })),
  orderBy: vi.fn((...args: any[]) => ({ _order: args })),
  doc: vi.fn((db: any, coll: string, id: string) => ({ _doc: `${coll}/${id}` })),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _serverTimestamp: true })),
}))

import { FirestoreCampaignRepository } from '../../repositories/CampaignRepository'
import * as firestore from 'firebase/firestore'

describe('FirestoreCampaignRepository', () => {
  const fakeDb = { _name: 'fake' } as any
  let repo: FirestoreCampaignRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new FirestoreCampaignRepository(fakeDb)
  })

  it('create writes a doc and returns optimistic Campaign object', async () => {
    ;(firestore.addDoc as any).mockResolvedValue({ id: 'doc123' })
    const data = { name: 'Camp', placement: 'video_feed', status: 'draft', assetUrl: null } as any
    const res = await repo.create(data, 'uid-1')
    expect(firestore.addDoc).toHaveBeenCalled()
    expect(res.id).toBe('doc123')
    expect(res.uid).toBe('uid-1')
    expect(res.isUnderReview).toBe(true)
  })

  it('getAllByUser maps Firestore snapshot to Campaign[]', async () => {
    const ts = { toDate: () => new Date('2025-01-01T00:00:00Z') }
    const raw = {
      uid: 'uid-1',
      status: 'draft',
      isUnderReview: true,
      name: 'Camp',
      placement: 'video_feed',
      assetUrl: null,
      createdAt: ts,
      updatedAt: ts,
    }
    const fakeSnapshot = { docs: [{ id: 'd1', data: () => raw }] }
    ;(firestore.getDocs as any).mockResolvedValue(fakeSnapshot)

    const list = await repo.getAllByUser('uid-1')
    expect(firestore.getDocs).toHaveBeenCalled()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('d1')
    expect(list[0].createdAt).toContain('2025')
  })

  it('update calls updateDoc with serverTimestamp injection', async () => {
    ;(firestore.updateDoc as any).mockResolvedValue(undefined)
    await repo.update('d1', 'uid-1', { name: 'New' })
    expect(firestore.updateDoc).toHaveBeenCalled()
  })
})
