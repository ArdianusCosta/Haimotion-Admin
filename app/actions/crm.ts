'use server'

import prisma from '@/lib/prisma'
import { getUserSession } from '@/lib/auth/authorization'

export async function getCrmClients() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const clients = await prisma.crmClient.findMany({
      include: {
        assigned_user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            avatar: true,
          }
        },
        projects: {
          select: { id: true, name: true, status: true }
        },
        deals: {
          select: { id: true, title: true, value: true, stage: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return { success: true, data: clients }
  } catch (error: any) {
    console.error('Failed to get CRM clients:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmClient(data: any) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    // Basic duplicate detection
    if (data.company_name) {
      const existing = await prisma.crmClient.findFirst({
        where: { company_name: data.company_name }
      })
      if (existing) {
        return { success: false, error: 'A client with this company name already exists.' }
      }
    }

    const client = await prisma.crmClient.create({
      data: {
        company_name: data.company_name,
        industry: data.industry,
        website: data.website,
        status: data.status || 'Active',
        source: data.source,
        address: data.address,
        city: data.city,
        assigned_user_id: data.assigned_user_id,
        contacts: data.contact_name ? {
          create: {
            name: data.contact_name,
            email: data.contact_email,
            phone: data.contact_phone,
            is_primary: true
          }
        } : undefined
      }
    })
    
    // Log activity
    await prisma.activity_log.create({
      data: {
        user_id: user.id,
        activity_type: 'CRM Client Created',
        description: `Created new CRM Client: ${client.company_name}`
      }
    })

    return { success: true, data: client }
  } catch (error: any) {
    console.error('Failed to create CRM client:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmClient(id: number) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    await prisma.crmClient.delete({
      where: { id }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM client:', error)
    return { success: false, error: error.message }
  }
}

export async function getCrmOverviewStats() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const totalClients = await prisma.crmClient.count()
    const activeLeads = await prisma.crmLead.count({
      where: { status: { notIn: ['Lost', 'Converted'] } }
    })
    const openDeals = await prisma.crmDeal.count({
      where: { stage: { notIn: ['Lost', 'Won'] } }
    })
    
    // Sum of open deals
    const dealsAgg = await prisma.crmDeal.aggregate({
      _sum: { value: true },
      where: { stage: { notIn: ['Lost', 'Won'] } }
    })
    
    const today = new Date()
    today.setHours(0,0,0,0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const followUpsToday = await prisma.crmFollowUp.count({
      where: {
        due_date: {
          gte: today,
          lt: tomorrow
        },
        status: 'Pending'
      }
    })

    return { 
      success: true, 
      data: { 
        totalClients, 
        activeLeads, 
        openDeals,
        openDealsValue: dealsAgg._sum.value || 0,
        followUpsToday
      } 
    }
  } catch (error: any) {
    console.error('Failed to get CRM stats:', error)
    return { success: false, error: error.message }
  }
}

// LEADS ACTIONS
export async function getCrmLeads() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const leads = await prisma.crmLead.findMany({
      include: {
        assigned_user: {
          select: { id: true, firstname: true, lastname: true, avatar: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    return { success: true, data: leads }
  } catch (error: any) {
    console.error('Failed to get CRM leads:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmLead(data: any) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const lead = await prisma.crmLead.create({
      data: {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp,
        source: data.source,
        industry: data.industry,
        status: data.status || 'New',
        pipeline_stage: data.pipeline_stage || 'New Lead',
        estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
        assigned_user_id: data.assigned_user_id,
      }
    })

    await prisma.activity_log.create({
      data: {
        user_id: user.id,
        activity_type: 'CRM Lead Created',
        description: `Created new CRM Lead: ${lead.name} (${lead.company || ''})`
      }
    })

    return { success: true, data: lead }
  } catch (error: any) {
    console.error('Failed to create CRM lead:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmLeadStage(id: number, stage: string, status?: string) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const updateData: any = { pipeline_stage: stage }
    if (status) updateData.status = status

    const lead = await prisma.crmLead.update({
      where: { id },
      data: updateData
    })
    return { success: true, data: lead }
  } catch (error: any) {
    console.error('Failed to update CRM lead stage:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmLead(id: number) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    await prisma.crmLead.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM lead:', error)
    return { success: false, error: error.message }
  }
}

export async function convertCrmLead(id: number) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const lead = await prisma.crmLead.findUnique({ where: { id } })
    if (!lead) return { success: false, error: 'Lead not found' }

    if (lead.status === 'Converted') {
      return { success: false, error: 'Lead is already converted' }
    }

    // 1. Update Lead Status
    await prisma.crmLead.update({
      where: { id },
      data: { status: 'Converted' }
    })

    // 2. Create Client (only if company is provided)
    let clientId = null
    if (lead.company) {
      const client = await prisma.crmClient.create({
        data: {
          company_name: lead.company,
          industry: lead.industry || null,
          status: 'Active',
          source: lead.source,
          assigned_user_id: lead.assigned_user_id,
          contacts: {
            create: {
              name: lead.name,
              email: lead.email || '',
              phone: lead.phone || '',
              is_primary: true
            }
          }
        }
      })
      clientId = client.id
    }

    // 3. Get Default Pipeline
    const pipeline = await prisma.crmPipeline.findFirst({
      include: { stages: { orderBy: { order: 'asc' } } }
    })

    // 4. Create Deal
    if (pipeline && pipeline.stages.length > 0) {
      await prisma.crmDeal.create({
        data: {
          title: `${lead.company || lead.name} Deal`,
          lead_id: lead.id,
          client_id: clientId,
          assigned_user_id: lead.assigned_user_id,
          stage: pipeline.stages[0].name,
          stage_id: pipeline.stages[0].id,
          pipeline_id: pipeline.id,
          value: lead.estimated_value || null,
        }
      })
    }

    await prisma.activity_log.create({
      data: {
        user_id: user.id,
        activity_type: 'CRM Lead Converted',
        description: `Converted Lead: ${lead.name} to Client & Deal`
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to convert CRM lead:', error)
    return { success: false, error: error.message }
  }
}

// DEALS ACTIONS
export async function getCrmDeals() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const deals = await prisma.crmDeal.findMany({
      include: {
        client: { select: { id: true, company_name: true } },
        lead: { select: { id: true, name: true, company: true } },
        assigned_user: {
          select: { id: true, firstname: true, lastname: true, avatar: true }
        },
        pipeline: true,
        pipeline_stage: true
      },
      orderBy: { created_at: 'desc' }
    })
    return { success: true, data: deals }
  } catch (error: any) {
    console.error('Failed to get CRM deals:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmDeal(data: any) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const deal = await prisma.crmDeal.create({
      data: {
        title: data.title,
        client_id: data.client_id,
        lead_id: data.lead_id,
        assigned_user_id: data.assigned_user_id,
        stage: data.stage || 'Proposal', // Fallback for legacy
        pipeline_id: data.pipeline_id,
        stage_id: data.stage_id,
        value: data.value ? parseFloat(data.value) : null,
        probability: data.probability ? parseInt(data.probability) : 0,
        expected_close: data.expected_close ? new Date(data.expected_close) : null,
      }
    })

    await prisma.activity_log.create({
      data: {
        user_id: user.id,
        activity_type: 'CRM Deal Created',
        description: `Created new CRM Deal: ${deal.title}`
      }
    })

    return { success: true, data: deal }
  } catch (error: any) {
    console.error('Failed to create CRM deal:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmDealStage(id: number, stage: string, pipeline_id?: number, stage_id?: number) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const updateData: any = { stage }
    if (pipeline_id !== undefined) updateData.pipeline_id = pipeline_id
    if (stage_id !== undefined) updateData.stage_id = stage_id

    const deal = await prisma.crmDeal.update({
      where: { id },
      data: updateData
    })
    return { success: true, data: deal }
  } catch (error: any) {
    console.error('Failed to update CRM deal stage:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmDeal(id: number) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    await prisma.crmDeal.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM deal:', error)
    return { success: false, error: error.message }
  }
}

// FOLLOW-UPS ACTIONS
export async function getCrmFollowUps() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const followUps = await prisma.crmFollowUp.findMany({
      include: {
        client: { select: { id: true, company_name: true } },
        lead: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } },
        assigned_user: {
          select: { id: true, firstname: true, lastname: true, avatar: true }
        }
      },
      orderBy: { due_date: 'asc' }
    })
    return { success: true, data: followUps }
  } catch (error: any) {
    console.error('Failed to get CRM follow-ups:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmFollowUp(data: any) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const followUp = await prisma.crmFollowUp.create({
      data: {
        type: data.type,
        status: data.status || 'Pending',
        due_date: new Date(data.due_date),
        notes: data.notes,
        client_id: data.client_id,
        lead_id: data.lead_id,
        deal_id: data.deal_id,
        assigned_user_id: data.assigned_user_id || user.id,
      }
    })

    await prisma.activity_log.create({
      data: {
        user_id: user.id,
        activity_type: 'CRM Follow-Up Created',
        description: `Created new Follow-Up: ${data.type}`
      }
    })

    return { success: true, data: followUp }
  } catch (error: any) {
    console.error('Failed to create CRM follow-up:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmFollowUpStatus(id: number, status: string) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const followUp = await prisma.crmFollowUp.update({
      where: { id },
      data: { status }
    })

    if (status === 'Completed') {
      await prisma.crmActivity.create({
        data: {
          user_id: user.id,
          type: 'Follow-Up Completed',
          description: `Completed follow-up: ${followUp.type}`,
          client_id: followUp.client_id,
          lead_id: followUp.lead_id,
          deal_id: followUp.deal_id
        }
      })
    }

    return { success: true, data: followUp }
  } catch (error: any) {
    console.error('Failed to update CRM follow-up status:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmFollowUp(id: number) {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    await prisma.crmFollowUp.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM follow-up:', error)
    return { success: false, error: error.message }
  }
}

// ACTIVITIES ACTIONS
export async function getCrmActivities() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    const activities = await prisma.crmActivity.findMany({
      include: {
        user: { select: { id: true, firstname: true, lastname: true, avatar: true } },
        client: { select: { id: true, company_name: true } },
        lead: { select: { id: true, name: true, company: true } },
        deal: { select: { id: true, title: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 100 // Limit to recent 100 activities
    })
    return { success: true, data: activities }
  } catch (error: any) {
    console.error('Failed to get CRM activities:', error)
    return { success: false, error: error.message }
  }
}

// PIPELINE & STAGES ACTIONS (Phase 2)
export async function getCrmPipelines() {
  const user = await getUserSession()
  if (!user) throw new Error('Unauthorized')

  try {
    let pipelines = await prisma.crmPipeline.findMany({
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Auto-create default pipeline if none exists
    if (pipelines.length === 0) {
      const defaultPipeline = await prisma.crmPipeline.create({
        data: {
          name: 'Default Pipeline',
          stages: {
            create: [
              { name: 'New', order: 1, probability: 10 },
              { name: 'Qualified', order: 2, probability: 30 },
              { name: 'Proposal', order: 3, probability: 50 },
              { name: 'Negotiation', order: 4, probability: 80 },
              { name: 'Won', order: 5, probability: 100 },
              { name: 'Lost', order: 6, probability: 0 }
            ]
          }
        },
        include: { stages: { orderBy: { order: 'asc' } } }
      })
      pipelines = [defaultPipeline]
    }

    return { success: true, data: pipelines }
  } catch (error: any) {
    console.error('Failed to get CRM pipelines:', error)
    return { success: false, error: error.message }
  }
}

