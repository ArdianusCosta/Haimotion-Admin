'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'

// --- GET FLOW ---
export async function getModuleFlow(flowId: number) {
  const auth = await requireAuth()
  
  const flow = await prisma.moduleFlow.findUnique({
    where: { id: flowId },
    include: {
      nodes: true,
      edges: true,
      checklists: {
        orderBy: { order: 'asc' }
      },
      executions: {
        orderBy: { created_at: 'desc' },
        take: 5
      }
    }
  })

  return flow
}

// --- CREATE SEED FLOW ---
export async function seedInitialFlow() {
  const auth = await requireAuth()
  
  // Check if exists
  const existing = await prisma.moduleFlow.findFirst({
    where: { name: 'Product Creation Flow' }
  })
  
  if (existing) return existing

  const flow = await prisma.moduleFlow.create({
    data: {
      name: 'Product Creation Flow',
      description: 'Module: Product Management',
      version: 'v1.4',
      status: 'ACTIVE',
      progress: 60,
      created_by: parseInt(auth.id, 10),
      nodes: {
        create: [
          { label: 'Product Form', type: 'ui', tech: 'Next.js', status: 'completed', owner: 'Alice S.', position_x: 250, position_y: 50 },
          { label: 'Validation', type: 'validation', tech: 'Zod', status: 'completed', owner: 'Alice S.', position_x: 250, position_y: 200 },
          { label: 'Is Valid?', type: 'condition', position_x: 285, position_y: 350 },
          { label: 'Validation Error', type: 'ui', tech: 'Toast', status: 'completed', owner: 'Alice S.', position_x: 50, position_y: 450 },
          { label: 'Product API', type: 'api', tech: 'Laravel', status: 'completed', owner: 'Costa', description: 'POST /api/products', position_x: 450, position_y: 450 },
          { label: 'Product Service', type: 'service', tech: 'PHP', status: 'in-progress', owner: 'Costa', description: 'Business Logic for creating products', position_x: 450, position_y: 600 },
          { label: 'Database', type: 'database', tech: 'PostgreSQL', status: 'planned', owner: 'Costa', position_x: 450, position_y: 750 },
          { label: 'Response', type: 'api', tech: 'JSON', status: 'planned', owner: 'Costa', position_x: 450, position_y: 900 }
        ]
      },
      checklists: {
        create: [
          { label: 'Database schema created', is_done: true, order: 1 },
          { label: 'API endpoints created', is_done: true, order: 2 },
          { label: 'Validation implemented', is_done: true, order: 3 },
          { label: 'Unit testing', is_done: false, order: 4 },
          { label: 'E2E testing', is_done: false, order: 5 },
          { label: 'Production deployment', is_done: false, order: 6 }
        ]
      }
    },
    include: {
      nodes: true,
      edges: true
    }
  })
  
  // Note: we can't easily connect edges via `create` if we don't know the generated node IDs.
  // We'll create edges immediately after identifying the nodes.
  
  const nodes = flow.nodes;
  const findNode = (label: string) => nodes.find(n => n.label === label)?.id;
  
  const n1 = findNode('Product Form');
  const n2 = findNode('Validation');
  const n3 = findNode('Is Valid?');
  const n4 = findNode('Validation Error');
  const n5 = findNode('Product API');
  const n6 = findNode('Product Service');
  const n7 = findNode('Database');
  const n8 = findNode('Response');
  
  if (n1 && n2 && n3 && n4 && n5 && n6 && n7 && n8) {
    await prisma.flowEdge.createMany({
      data: [
        { flow_id: flow.id, source_id: n1, target_id: n2 },
        { flow_id: flow.id, source_id: n2, target_id: n3 },
        { flow_id: flow.id, source_id: n3, target_id: n4, source_handle: 'left', label: 'No', color: '#ef4444' },
        { flow_id: flow.id, source_id: n3, target_id: n5, source_handle: 'right', label: 'Yes', color: '#22c55e' },
        { flow_id: flow.id, source_id: n5, target_id: n6 },
        { flow_id: flow.id, source_id: n6, target_id: n7 },
        { flow_id: flow.id, source_id: n7, target_id: n8 }
      ]
    })
  }
  
  return flow
}

// --- NODE ACTIONS ---
export async function updateFlowNodePosition(nodeId: string, position: { x: number, y: number }) {
  await requireAuth()
  
  await prisma.flowNode.update({
    where: { id: nodeId },
    data: {
      position_x: position.x,
      position_y: position.y
    }
  })
}

export async function createFlowNode(flowId: number, data: any) {
  await requireAuth()
  
  const node = await prisma.flowNode.create({
    data: {
      flow_id: flowId,
      ...data
    }
  })
  
  // Set draft state
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: { status: 'DRAFT' }
  })
  
  return node
}

export async function updateFlowNode(nodeId: string, flowId: number, data: any) {
  await requireAuth()
  
  const node = await prisma.flowNode.update({
    where: { id: nodeId },
    data
  })
  
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: { status: 'DRAFT' }
  })
  
  return node
}

export async function deleteFlowNode(nodeId: string, flowId: number) {
  await requireAuth()
  
  await prisma.flowNode.delete({
    where: { id: nodeId }
  })
  
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: { status: 'DRAFT' }
  })
}

// --- EDGE ACTIONS ---
export async function createFlowEdge(flowId: number, data: any) {
  await requireAuth()
  
  const edge = await prisma.flowEdge.create({
    data: {
      flow_id: flowId,
      ...data
    }
  })
  
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: { status: 'DRAFT' }
  })
  
  return edge
}

export async function deleteFlowEdge(edgeId: string, flowId: number) {
  await requireAuth()
  
  await prisma.flowEdge.delete({
    where: { id: edgeId }
  })
  
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: { status: 'DRAFT' }
  })
}

// --- CHECKLIST ACTIONS ---
export async function toggleChecklistItem(itemId: number, flowId: number, isDone: boolean) {
  await requireAuth()
  
  await prisma.checklistItem.update({
    where: { id: itemId },
    data: { is_done: isDone }
  })
  
  // Recalculate progress
  const allItems = await prisma.checklistItem.findMany({
    where: { flow_id: flowId }
  })
  
  const doneCount = allItems.filter(i => i.is_done).length
  const progress = allItems.length > 0 ? Math.round((doneCount / allItems.length) * 100) : 0
  
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: { progress }
  })
}

// --- PUBLISH ---
export async function publishModuleFlow(flowId: number) {
  await requireAuth()
  
  const flow = await prisma.moduleFlow.findUnique({
    where: { id: flowId }
  })
  
  if (!flow) throw new Error('Flow not found')
  
  // Bump version (e.g. V1.4 -> V1.5)
  const currentVersion = flow.version
  let newVersion = 'V1.0'
  
  if (currentVersion.startsWith('v') || currentVersion.startsWith('V')) {
    const parts = currentVersion.substring(1).split('.')
    if (parts.length === 2) {
      newVersion = `v${parts[0]}.${parseInt(parts[1]) + 1}`
    }
  }
  
  await prisma.moduleFlow.update({
    where: { id: flowId },
    data: {
      status: 'ACTIVE',
      version: newVersion
    }
  })
  
  return newVersion
}

// --- EXECUTION ---
export async function runFlowExecution(flowId: number) {
  const auth = await requireAuth()
  
  // Create execution record
  const execution = await prisma.flowExecution.create({
    data: {
      flow_id: flowId,
      status: 'PASSED',
      started_by: parseInt(auth.id, 10),
      completed_at: new Date()
    }
  })
  
  return execution
}
