import { 
  useChartOfAccounts, 
  useCreateAccount, 
  useUpdateAccount, 
  useDeleteAccount 
} from '@/components/finance/queries'

export function useAkunPerkiraan(filters?: { search?: string }) {
  const { data = [], isLoading } = useChartOfAccounts(filters)
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()

  const saveAccount = async (editingId: number | null, formData: any) => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
  }

  const removeAccount = async (id: number) => {
    await deleteMutation.mutateAsync(id)
  }

  return { 
    data: data || [], 
    loading: isLoading, 
    saveAccount, 
    removeAccount,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
