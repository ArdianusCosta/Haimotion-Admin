'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getKpiPerformanceData, KpiPerformanceData } from '@/app/actions/dashboard-kpi'

export function useKpiPerformance(
  range: string,
  projectFilter: string,
  memberFilter: string
) {
  const {
    data,
    isLoading: loading,
    isFetching,
    error,
    refetch
  } = useQuery<KpiPerformanceData>({
    queryKey: ['kpi-performance', range, projectFilter, memberFilter],
    queryFn: () => getKpiPerformanceData(range, projectFilter, memberFilter),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30s cache
    refetchInterval: 15 * 1000, // Auto real-time background refresh every 15s
    refetchOnWindowFocus: true, // Auto refresh when tab is focused
  })

  return {
    loading,
    isFetching,
    data: data ?? null,
    error: error ? (error instanceof Error ? error.message : 'Failed to load KPI data') : null,
    refetch
  }
}
