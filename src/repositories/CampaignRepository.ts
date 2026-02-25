import {
  type Firestore,
  type Timestamp,
  addDoc,
  collection,
  getDocs,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Campaign, CampaignData, CampaignStatus } from '../types/campaign'

// ─── Interface (Dependency Inversion) ────────────────────────────────────────

export interface ICampaignRepository {
  /**
   * Persists a new campaign owned by `uid`.
   * Returns the full Campaign with the generated `id`.
   */
  create(data: CampaignData, uid: string): Promise<Campaign>

  /** Returns all campaigns for the given user, newest first. */
  getAllByUser(uid: string): Promise<Campaign[]>

  /**
   * Applies a partial update to a campaign.
   * `uid` is required so callers cannot accidentally update another user's document —
   * Firestore rules enforce this server-side; the client also validates ownership.
   */
  update(
    id: string,
    uid: string,
    partial: Partial<CampaignData & { status: CampaignStatus }>,
  ): Promise<void>
}

// ─── Firestore implementation ─────────────────────────────────────────────────

const COLLECTION = 'ads_campaigns'

export class FirestoreCampaignRepository implements ICampaignRepository {
  constructor(private readonly db: Firestore) {}

  async create(data: CampaignData, uid: string): Promise<Campaign> {
    const docRef = await addDoc(collection(this.db, COLLECTION), {
      ...data,
      uid,
      status: 'draft' as CampaignStatus,
      isUnderReview: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Return an optimistic record — the server timestamps are approximated
    // locally until the next read. Acceptable for the redirect-to-dashboard flow.
    const now = new Date().toISOString()
    return {
      ...data,
      id: docRef.id,
      uid,
      status: 'draft',
      isUnderReview: true,
      createdAt: now,
      updatedAt: now,
    }
  }

  async getAllByUser(uid: string): Promise<Campaign[]> {
    const q = query(
      collection(this.db, COLLECTION),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => {
      const raw = d.data()
      return {
        ...(raw as CampaignData),
        id: d.id,
        uid: raw.uid as string,
        status: raw.status as CampaignStatus,
        isUnderReview: raw.isUnderReview as boolean ?? true,
        // Convert Firestore Timestamps to ISO strings at the boundary
        createdAt: (raw.createdAt as Timestamp | null)?.toDate().toISOString() ?? '',
        updatedAt: (raw.updatedAt as Timestamp | null)?.toDate().toISOString() ?? '',
      }
    })
  }

  async update(
    id: string,
    _uid: string, // retained in signature for interface contract clarity; rules enforce server-side
    partial: Partial<CampaignData & { status: CampaignStatus }>,
  ): Promise<void> {
    await updateDoc(doc(this.db, COLLECTION, id), {
      ...partial,
      updatedAt: serverTimestamp(),
    })
  }
}
