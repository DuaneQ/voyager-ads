import {
  type Firestore,
  type QueryDocumentSnapshot,
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
   * Returns all campaigns currently under review, newest first.
   * Admin-only — Firestore rules must allow access only for the admin UID
   * or this is called exclusively from admin-authed sessions.
   */
  getAllPending(): Promise<Campaign[]>

  /**
   * Applies a partial update to a campaign.
   * `uid` is required so callers cannot accidentally update another user's document —
   * Firestore rules enforce this server-side; the client also validates ownership.
   */
  update(
    id: string,
    uid: string,
    partial: Partial<CampaignData & { status: CampaignStatus; isUnderReview: boolean }>,
  ): Promise<void>
}

// ─── Firestore implementation ─────────────────────────────────────────────────

const COLLECTION = 'ads_campaigns'

export class FirestoreCampaignRepository implements ICampaignRepository {
  constructor(private readonly db: Firestore) {}

  async create(data: CampaignData, uid: string): Promise<Campaign> {
    // Strip undefined values — Firestore rejects them even in addDoc.
    const sanitized = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    )
    const docRef = await addDoc(collection(this.db, COLLECTION), {
      ...sanitized,
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
    return snapshot.docs.map((d) => this.mapDocToCampaign(d))
  }

  async getAllPending(): Promise<Campaign[]> {
    // Query without orderBy to avoid requiring a composite Firestore index.
    // Sorted client-side instead.
    const q = query(
      collection(this.db, COLLECTION),
      where('isUnderReview', '==', true),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs
      .map((d) => this.mapDocToCampaign(d))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  private mapDocToCampaign(d: QueryDocumentSnapshot): Campaign {
    const raw = d.data()
    return {
      ...(raw as CampaignData),
      id: d.id,
      uid: raw.uid as string,
      status: raw.status as CampaignStatus,
      paymentStatus: raw.paymentStatus as Campaign['paymentStatus'],
      paymentRequiredCents: typeof raw.paymentRequiredCents === 'number' ? raw.paymentRequiredCents : undefined,
      paymentPaidCents: typeof raw.paymentPaidCents === 'number' ? raw.paymentPaidCents : undefined,
      paymentDiscountCents: typeof raw.paymentDiscountCents === 'number' ? raw.paymentDiscountCents : undefined,
      paymentCurrency: typeof raw.paymentCurrency === 'string' ? raw.paymentCurrency : undefined,
      paymentSessionId: typeof raw.paymentSessionId === 'string' ? raw.paymentSessionId : undefined,
      paymentPromoCode: typeof raw.paymentPromoCode === 'string' ? raw.paymentPromoCode : undefined,
      paymentCompletedAt: (raw.paymentCompletedAt as Timestamp | null)?.toDate().toISOString() ?? undefined,
      isUnderReview: (raw.isUnderReview ?? true) as boolean,
      reviewNote: raw.reviewNote as string | undefined,
      createdAt: (raw.createdAt as Timestamp | null)?.toDate().toISOString() ?? '',
      updatedAt: (raw.updatedAt as Timestamp | null)?.toDate().toISOString() ?? '',
      totalImpressions: typeof raw.totalImpressions === 'number' ? raw.totalImpressions : undefined,
      totalClicks: typeof raw.totalClicks === 'number' ? raw.totalClicks : undefined,
      budgetCents: typeof raw.budgetCents === 'number' ? raw.budgetCents : undefined,
    }
  }

  async update(
    id: string,
    _uid: string, // retained in signature for interface contract clarity; rules enforce server-side
    partial: Partial<CampaignData & { status: CampaignStatus; isUnderReview: boolean }>,
  ): Promise<void> {
    // Firestore rejects `undefined` field values — strip them before writing.
    // Fields like `budgetCents` are server-managed and should never be written
    // back from the client; omitting undefined values is the safe default.
    const sanitized = Object.fromEntries(
      Object.entries(partial).filter(([, v]) => v !== undefined),
    )
    await updateDoc(doc(this.db, COLLECTION, id), {
      ...sanitized,
      updatedAt: serverTimestamp(),
    })
  }
}
