import { useState, useEffect } from 'react'
import { getDashboardData } from '@/app/actions/dashboard'

export function useDashboard() {
  const [range, setRange] = useState('Last 6 months')
  const [projectFilter, setProjectFilter] = useState('Semua Project')
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!data) {
      setLoading(true)
    } else {
      setIsFetching(true)
    }

    getDashboardData(range, projectFilter).then(res => {
      setData(res)
      setLoading(false)
      setIsFetching(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
      setIsFetching(false)
    })
  }, [range, projectFilter])

  return { range, setRange, projectFilter, setProjectFilter, loading, isFetching, data }
}
