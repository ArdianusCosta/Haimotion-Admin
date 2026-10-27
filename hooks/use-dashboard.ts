'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getDashboardData } from '@/app/actions/dashboard'

export function useDashboard() {
  const [range, setRangeState] = useState('All time')
  const [projectFilter, setProjectFilterState] = useState('Semua Project')

  // Load user preferences on mount
  useEffect(() => {
    try {
      const savedRange = localStorage.getItem('pref_dashboard_range')
      if (savedRange) setRangeState(savedRange)
      const savedProject = localStorage.getItem('pref_dashboard_project_filter')
      if (savedProject) setProjectFilterState(savedProject)
    } catch (_) {}
  }, [])

  const setRange = useCallback((val: string) => {
    setRangeState(val)
    try {
      localStorage.setItem('pref_dashboard_range', val)
    } catch (_) {}
  }, [])

  const setProjectFilter = useCallback((val: string) => {
    setProjectFilterState(val)
    try {
      localStorage.setItem('pref_dashboard_project_filter', val)
    } catch (_) {}
  }, [])

  const {
    data,
    isLoading: loading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-data', range, projectFilter],
    queryFn: () => getDashboardData(range, projectFilter),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30s cache
    refetchInterval: 15 * 1000, // Auto real-time background refresh every 15s
    refetchOnWindowFocus: true, // Auto refresh when tab is focused
  })

  return {
    range,
    setRange,
    projectFilter,
    setProjectFilter,
    loading,
    isFetching,
    data: data ?? null,
    error: error ? (error instanceof Error ? error.message : 'Failed to load dashboard data') : null,
    refetch
  }
}
