import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebaseConfig'
import type { DailyMetricSnapshot } from '../types/metrics'

/**
 * Subscribes to daily metric snapshots for a given campaign.
 *
 * Firestore: ads_campaigns/{campaignId}/daily_metrics/{YYYY-MM-DD}
 * Each document: { date, impressions, clicks, views?, completions?, spend }
 *
 * Returns an empty array while the campaignId is undefined or while no
 * daily_metrics documents have been written yet (e.g. before tracking goes live).
 *
 * @param campaignId - Firestore document ID of the campaign, or undefined
 */
export function useCampaignMetrics(campaignId: string | undefined) {
  const [metrics, setMetrics] = useState<DailyMetricSnapshot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!campaignId) {
      setMetrics([])
      return
    }

    setLoading(true)

    const metricsRef = collection(db, 'ads_campaigns', campaignId, 'daily_metrics')
    const q = query(metricsRef, orderBy('date', 'asc'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMetrics(snap.docs.map(d => d.data() as DailyMetricSnapshot))
        setLoading(false)
      },
      (err) => {
        console.error('[useCampaignMetrics] Firestore error:', err)
        setLoading(false)
      }
    )

    return unsub
  }, [campaignId])

  return { metrics, loading }
}
