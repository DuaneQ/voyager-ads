import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebaseConfig'
import type { DailyMetricSnapshot } from '../types/metrics'

/**
 * Subscribes to daily metric snapshots for multiple campaigns simultaneously.
 *
 * Returns a map of campaignId → DailyMetricSnapshot[] so the caller can build
 * one chart series per campaign without violating the rules of hooks (no loops).
 *
 * Each Firestore listener is cleaned up when the set of IDs changes or the
 * component unmounts.
 *
 * @param campaignIds - Array of Firestore campaign document IDs
 */
export function useMultiCampaignMetrics(campaignIds: string[]) {
  const [metricsMap, setMetricsMap] = useState<Record<string, DailyMetricSnapshot[]>>({})
  const [loading, setLoading] = useState(false)

  // Stable string key so the effect only re-runs when the actual IDs change,
  // not on every parent render that creates a new array reference.
  const idsKey = campaignIds.slice().sort().join(',')

  useEffect(() => {
    if (!campaignIds.length) {
      setMetricsMap({})
      return
    }

    setLoading(true)
    let pending = campaignIds.length
    const unsubs: (() => void)[] = []

    for (const id of campaignIds) {
      const metricsRef = collection(db, 'ads_campaigns', id, 'daily_metrics')
      const q = query(metricsRef, orderBy('date', 'asc'))

      const unsub = onSnapshot(
        q,
        (snap) => {
          setMetricsMap(prev => ({
            ...prev,
            [id]: snap.docs.map(d => d.data() as DailyMetricSnapshot),
          }))
          pending--
          if (pending <= 0) setLoading(false)
        },
        (err) => {
          console.error(`[useMultiCampaignMetrics] campaign ${id}:`, err)
          pending--
          if (pending <= 0) setLoading(false)
        }
      )
      unsubs.push(unsub)
    }

    return () => unsubs.forEach(u => u())
    // idsKey is the canonical dependency — campaignIds itself changes reference each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  return { metricsMap, loading }
}
