import { useState, useEffect } from 'react'
import { getKpiPerformanceData, KpiPerformanceData } from '@/app/actions/dashboard-kpi'

export function useKpiPerformance(
  range: string,
  projectFilter: string,
  memberFilter: string
) {
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [data, setData] = useState<KpiPerformanceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) {
      setLoading(true)
    } else {
      setIsFetching(true)
    }
    setError(null)

    getKpiPerformanceData(range, projectFilter, memberFilter)
      .then(res => {
        setData(res)
        setLoading(false)
        setIsFetching(false)
      })
      .catch(err => {
        console.error('KPI fetch error:', err)
        setError(err?.message || 'Failed to load KPI data')
        setLoading(false)
        setIsFetching(false)
      })
  }, [range, projectFilter, memberFilter])

  return { loading, isFetching, data, error }
}
