const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.moduleFlow.findFirst({
    where: { name: 'Product Creation Flow' }
  })
  
  if (existing) {
    console.log('Seed data already exists.')
    return
  }

  // Assuming user ID 1 exists as admin. Adjust if necessary.
  const flow = await prisma.moduleFlow.create({
    data: {
      name: 'Product Creation Flow',
      description: 'Module: Product Management',
      version: 'v1.4',
      status: 'ACTIVE',
      progress: 60,
      created_by: 1, 
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
      nodes: true
    }
  })
  
  const nodes = flow.nodes;
  const findNode = (label) => nodes.find(n => n.label === label)?.id;
  
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

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
