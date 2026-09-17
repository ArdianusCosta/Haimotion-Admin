import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getModuleFlow,
  updateFlowNodePosition,
  createFlowNode,
  updateFlowNode,
  deleteFlowNode,
  createFlowEdge,
  deleteFlowEdge,
  toggleChecklistItem,
  publishModuleFlow,
  runFlowExecution
} from '@/app/actions/module-flows'
import { toast } from 'sonner'

export function useModuleFlowData(flowId: number) {
  return useQuery({
    queryKey: ['moduleFlow', flowId],
    queryFn: () => getModuleFlow(flowId),
    enabled: !!flowId
  })
}

export function useUpdateNodePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, position }: { nodeId: string, position: { x: number, y: number } }) => 
      updateFlowNodePosition(nodeId, position),
    onMutate: async ({ nodeId, position }) => {
      // Optmistic update can be handled in React Flow state directly instead of query cache
    }
  })
}

export function useAddNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: number, data: any }) => createFlowNode(flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
      toast.success('Step added successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add step.')
  })
}

export function useUpdateNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, flowId, data }: { nodeId: string, flowId: number, data: any }) => updateFlowNode(nodeId, flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
      toast.success('Step updated successfully.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update step.')
  })
}

export function useDeleteNode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nodeId, flowId }: { nodeId: string, flowId: number }) => deleteFlowNode(nodeId, flowId),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
      toast.success('Step deleted.')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete step.')
  })
}

export function useAddEdge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: number, data: any }) => createFlowEdge(flowId, data),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
    }
  })
}

export function useDeleteEdge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ edgeId, flowId }: { edgeId: string, flowId: number }) => deleteFlowEdge(edgeId, flowId),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
    }
  })
}

export function useToggleChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, flowId, isDone }: { itemId: number, flowId: number, isDone: boolean }) => 
      toggleChecklistItem(itemId, flowId, isDone),
    onSuccess: (_, { flowId }) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
    }
  })
}

export function usePublishFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flowId: number) => publishModuleFlow(flowId),
    onSuccess: (newVersion, flowId) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
      toast.success(`Flow published to version ${newVersion}`)
    },
    onError: (err: any) => toast.error(err.message || 'Failed to publish.')
  })
}

export function useRunExecution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (flowId: number) => runFlowExecution(flowId),
    onSuccess: (_, flowId) => {
      queryClient.invalidateQueries({ queryKey: ['moduleFlow', flowId] })
      toast.success('Execution test completed! View results in History.', {
        icon: '🚀'
      })
    },
    onError: (err: any) => toast.error(err.message || 'Execution failed.')
  })
}
