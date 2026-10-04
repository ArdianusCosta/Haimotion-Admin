'use server'

import prisma from '@/lib/prisma'
import { requireAuth, hasPermission } from '@/lib/auth/authorization'

export type SearchResult = {
  id: string | number
  type: 'project' | 'task' | 'client' | 'lead' | 'deal' | 'invoice' | 'user'
  title: string
  subtitle?: string
  url: string
}

export async function globalSearch(query: string): Promise<{ success: boolean; data?: SearchResult[]; error?: string }> {
  try {
    const user = await requireAuth()
    
    if (!query || query.length < 2) {
      return { success: true, data: [] }
    }

    const results: SearchResult[] = []
    const searchStr = `%${query}%`

    // 1. Projects
    if (hasPermission(user, 'projects.view')) {
      const projects = await prisma.project_list.findMany({
        where: { name: { contains: query } },
        take: 5
      })
      projects.forEach(p => {
        results.push({
          id: p.id,
          type: 'project',
          title: p.name,
          subtitle: p.client_name || 'Project',
          url: `/projects/${p.id}` // Note: Update with actual route
        })
      })
    }

    // 2. Tasks
    if (hasPermission(user, 'tasks.view')) {
      const tasks = await prisma.task_list.findMany({
        where: { task: { contains: query } },
        take: 5
      })
      tasks.forEach(t => {
        results.push({
          id: t.id,
          type: 'task',
          title: t.task,
          subtitle: 'Task',
          url: `/tasks` // Note: Update with actual route
        })
      })
    }

    // 3. CRM Clients
    // We assume crm permissions check here. For now, simple check.
    const clients = await prisma.crmClient.findMany({
      where: { company_name: { contains: query } },
      take: 5
    })
    clients.forEach(c => {
      results.push({
        id: c.id,
        type: 'client',
        title: c.company_name,
        subtitle: c.industry || 'Client',
        url: `/crm/clients` // Note: Update with actual route
      })
    })

    // 4. Finance Invoices
    const invoices = await prisma.financeInvoice.findMany({
      where: { OR: [
        { reference: { contains: query } },
        { customer_name: { contains: query } }
      ]},
      take: 5
    })
    invoices.forEach(i => {
      results.push({
        id: i.id,
        type: 'invoice',
        title: i.reference,
        subtitle: i.customer_name,
        url: `/finance/invoices` // Note: Update with actual route
      })
    })

    // 5. Users
    const users = await prisma.user.findMany({
      where: { OR: [
        { firstname: { contains: query } },
        { lastname: { contains: query } },
        { email: { contains: query } }
      ]},
      take: 5
    })
    users.forEach(u => {
      results.push({
        id: u.id,
        type: 'user',
        title: `${u.firstname} ${u.lastname}`,
        subtitle: u.email,
        url: `/users` 
      })
    })

    return { success: true, data: results }

  } catch (error: any) {
    console.error('Global search error:', error)
    return { success: false, error: error.message }
  }
}
