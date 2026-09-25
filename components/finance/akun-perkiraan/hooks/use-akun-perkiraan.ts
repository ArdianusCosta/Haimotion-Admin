import { useState, useEffect } from 'react'
import { getChartOfAccounts, createAccount, updateAccount, deleteAccount } from '@/app/actions/finance'

export function useAkunPerkiraan() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getChartOfAccounts()
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const saveAccount = async (editingId: number | null, formData: any) => {
    if (editingId) {
      await updateAccount(editingId, formData)
    } else {
      await createAccount(formData)
    }
    await fetchData()
  }

  const removeAccount = async (id: number) => {
    await deleteAccount(id)
    await fetchData()
  }

  return { data, loading, saveAccount, removeAccount }
}
