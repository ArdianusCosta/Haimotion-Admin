'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requireCrmPermission } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'

// Helper to record activity in crm_activities table (no-op in clean setup)
async function recordCrmActivity(
  _userId: number,
  _type: string,
  _description: string,
  _relations: { client_id?: number | null; lead_id?: number | null; deal_id?: number | null } = {}
) {
  // Activity logging removed in standard clean CRM
}

function triggerCrmRevalidation() {
  try {
    revalidatePath('/crm/overview')
    revalidatePath('/crm/leads')
    revalidatePath('/crm/clients')
    revalidatePath('/crm/pipeline')
  } catch (e) {
    // revalidatePath might throw outside of request context in tests
  }
}

export async function getCrmUsers() {
  await requireAuth()
  try {
    const users = await prisma.user.findMany({
      where: { status: { not: 'resign' } },
      select: { id: true, firstname: true, lastname: true, avatar: true, email: true },
      orderBy: { firstname: 'asc' }
    })
    return { success: true, data: users }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ============================================================================
// 1. CLIENTS ACTIONS
// ============================================================================

export async function getCrmClients() {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

  try {
    const clients = await prisma.crmClient.findMany({
      include: {
        contacts: {
          orderBy: { is_primary: 'desc' }
        },
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

export async function getCrmClientById(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

  try {
    const client = await prisma.crmClient.findUnique({
      where: { id: Number(id) },
      include: {
        contacts: true,
        assigned_user: {
          select: { id: true, firstname: true, lastname: true, avatar: true, email: true }
        },
        projects: {
          select: { id: true, name: true, status: true, start_date: true, end_date: true }
        },
        deals: {
          include: { pipeline_stage: true },
          orderBy: { created_at: 'desc' }
        },
        notes: {
          include: { author: { select: { firstname: true, lastname: true, avatar: true } } },
          orderBy: { created_at: 'desc' }
        }
      }
    })
    if (!client) return { success: false, error: 'Client not found' }
    return { success: true, data: client }
  } catch (error: any) {
    console.error('Failed to get CRM client by ID:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmClient(data: any) {
  const user = await requireAuth()
  requireCrmPermission(user, 'create')

  try {
    if (!data.company_name || !data.company_name.trim()) {
      return { success: false, error: 'Company or Client Name is required.' }
    }

    const companyName = data.company_name.trim()

    // Check duplicate name
    const existing = await prisma.crmClient.findFirst({
      where: { company_name: companyName }
    })
    if (existing) {
      return { success: false, error: `A client with the name "${companyName}" already exists.` }
    }

    const client = await prisma.crmClient.create({
      data: {
        company_name: companyName,
        industry: data.industry?.trim() || null,
        website: data.website?.trim() || null,
        status: data.status || 'Active',
        source: data.source || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        province: data.province?.trim() || null,
        country: data.country?.trim() || 'Indonesia',
        assigned_user_id: data.assigned_user_id ? Number(data.assigned_user_id) : null,
        contacts: data.contact_name ? {
          create: {
            name: data.contact_name.trim(),
            email: data.contact_email?.trim() || null,
            phone: data.contact_phone?.trim() || null,
            is_primary: true
          }
        } : undefined
      },
      include: { contacts: true }
    })

    await recordCrmActivity(user.id, 'Client Created', `Created client: ${client.company_name}`, { client_id: client.id })
    triggerCrmRevalidation()

    return { success: true, data: client }
  } catch (error: any) {
    console.error('Failed to create CRM client:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmClient(id: number, data: any) {
  const user = await requireAuth()
  requireCrmPermission(user, 'update')

  try {
    const clientId = Number(id)
    const existing = await prisma.crmClient.findUnique({
      where: { id: clientId },
      include: { contacts: true }
    })
    if (!existing) return { success: false, error: 'Client not found.' }

    if (!data.company_name || !data.company_name.trim()) {
      return { success: false, error: 'Company or Client Name is required.' }
    }

    const companyName = data.company_name.trim()

    // If company name changed, ensure no conflict
    if (companyName.toLowerCase() !== existing.company_name.toLowerCase()) {
      const duplicate = await prisma.crmClient.findFirst({
        where: {
          id: { not: clientId },
          company_name: { equals: companyName }
        }
      })
      if (duplicate) {
        return { success: false, error: `Another client already uses "${companyName}".` }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update primary contact if provided
      if (data.contact_name) {
        const primaryContact = existing.contacts.find(c => c.is_primary)
        if (primaryContact) {
          await tx.crmContact.update({
            where: { id: primaryContact.id },
            data: {
              name: data.contact_name.trim(),
              email: data.contact_email?.trim() || null,
              phone: data.contact_phone?.trim() || null,
            }
          })
        } else {
          await tx.crmContact.create({
            data: {
              client_id: clientId,
              name: data.contact_name.trim(),
              email: data.contact_email?.trim() || null,
              phone: data.contact_phone?.trim() || null,
              is_primary: true
            }
          })
        }
      }

      return tx.crmClient.update({
        where: { id: clientId },
        data: {
          company_name: companyName,
          industry: data.industry?.trim() || null,
          website: data.website?.trim() || null,
          status: data.status || existing.status,
          source: data.source !== undefined ? data.source : existing.source,
          address: data.address?.trim() || null,
          city: data.city?.trim() || null,
          province: data.province?.trim() || null,
          country: data.country?.trim() || existing.country,
          assigned_user_id: data.assigned_user_id ? Number(data.assigned_user_id) : null,
        },
        include: { contacts: true }
      })
    })

    await recordCrmActivity(user.id, 'Client Updated', `Updated client details: ${updated.company_name}`, { client_id: clientId })
    triggerCrmRevalidation()

    return { success: true, data: updated }
  } catch (error: any) {
    console.error('Failed to update CRM client:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmClient(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'delete')

  try {
    const clientId = Number(id)
    const client = await prisma.crmClient.findUnique({
      where: { id: clientId },
      include: { deals: true, projects: true }
    })
    if (!client) return { success: false, error: 'Client not found.' }

    await prisma.crmClient.delete({
      where: { id: clientId }
    })

    await recordCrmActivity(user.id, 'Client Deleted', `Deleted client: ${client.company_name}`)
    triggerCrmRevalidation()

    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM client:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// 2. LEADS ACTIONS
// ============================================================================

export async function getCrmLeads() {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

  try {
    const leads = await prisma.crmLead.findMany({
      include: {
        assigned_user: {
          select: { id: true, firstname: true, lastname: true, avatar: true }
        },
        deals: {
          select: { id: true, title: true, stage: true, value: true }
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

export async function getCrmLeadById(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

  try {
    const lead = await prisma.crmLead.findUnique({
      where: { id: Number(id) },
      include: {
        assigned_user: {
          select: { id: true, firstname: true, lastname: true, avatar: true, email: true }
        },
        deals: {
          include: { pipeline_stage: true }
        },
        notes: {
          include: { author: { select: { firstname: true, lastname: true, avatar: true } } },
          orderBy: { created_at: 'desc' }
        }
      }
    })
    if (!lead) return { success: false, error: 'Lead not found.' }
    return { success: true, data: lead }
  } catch (error: any) {
    console.error('Failed to get CRM lead by ID:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmLead(data: any) {
  const user = await requireAuth()
  requireCrmPermission(user, 'create')

  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'Lead name is required.' }
    }

    const lead = await prisma.crmLead.create({
      data: {
        name: data.name.trim(),
        company: data.company?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || data.phone?.trim() || null,
        source: data.source || 'Website',
        industry: data.industry?.trim() || null,
        status: data.status || 'New',
        pipeline_stage: data.pipeline_stage || 'New Lead',
        estimated_value: data.estimated_value && !isNaN(parseFloat(data.estimated_value))
          ? parseFloat(data.estimated_value)
          : null,
        assigned_user_id: data.assigned_user_id ? Number(data.assigned_user_id) : null,
      }
    })

    await recordCrmActivity(user.id, 'Lead Created', `Created lead: ${lead.name}${lead.company ? ` (${lead.company})` : ''}`, { lead_id: lead.id })
    triggerCrmRevalidation()

    return { success: true, data: lead }
  } catch (error: any) {
    console.error('Failed to create CRM lead:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmLead(id: number, data: any) {
  const user = await requireAuth()
  requireCrmPermission(user, 'update')

  try {
    const leadId = Number(id)
    const existing = await prisma.crmLead.findUnique({ where: { id: leadId } })
    if (!existing) return { success: false, error: 'Lead not found.' }

    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'Lead name is required.' }
    }

    const lead = await prisma.crmLead.update({
      where: { id: leadId },
      data: {
        name: data.name.trim(),
        company: data.company?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        whatsapp: data.whatsapp?.trim() || data.phone?.trim() || null,
        source: data.source !== undefined ? data.source : existing.source,
        industry: data.industry?.trim() || null,
        status: data.status || existing.status,
        pipeline_stage: data.pipeline_stage || existing.pipeline_stage,
        estimated_value: data.estimated_value !== undefined && data.estimated_value !== '' && !isNaN(parseFloat(data.estimated_value))
          ? parseFloat(data.estimated_value)
          : (data.estimated_value === '' ? null : existing.estimated_value),
        assigned_user_id: data.assigned_user_id ? Number(data.assigned_user_id) : null,
      }
    })

    await recordCrmActivity(user.id, 'Lead Updated', `Updated lead profile: ${lead.name}`, { lead_id: lead.id })
    triggerCrmRevalidation()

    return { success: true, data: lead }
  } catch (error: any) {
    console.error('Failed to update CRM lead:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmLeadStage(id: number, stage: string, status?: string) {
  const user = await requireAuth()
  requireCrmPermission(user, 'update')

  try {
    const leadId = Number(id)
    const updateData: any = { pipeline_stage: stage }
    if (status) updateData.status = status

    const lead = await prisma.crmLead.update({
      where: { id: leadId },
      data: updateData
    })

    await recordCrmActivity(user.id, 'Lead Stage Changed', `Moved lead "${lead.name}" to ${stage}`, { lead_id: lead.id })
    triggerCrmRevalidation()

    return { success: true, data: lead }
  } catch (error: any) {
    console.error('Failed to update CRM lead stage:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmLead(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'delete')

  try {
    const leadId = Number(id)
    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } })
    if (!lead) return { success: false, error: 'Lead not found.' }

    await prisma.crmLead.delete({ where: { id: leadId } })
    await recordCrmActivity(user.id, 'Lead Deleted', `Deleted lead: ${lead.name}`)
    triggerCrmRevalidation()

    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM lead:', error)
    return { success: false, error: error.message }
  }
}

export async function convertCrmLead(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'update')

  try {
    const leadId = Number(id)
    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } })
    if (!lead) return { success: false, error: 'Lead not found' }

    if (lead.status === 'Converted') {
      return { success: false, error: 'Lead is already converted.' }
    }

    // Determine Company Name (individual or company)
    const clientName = (lead.company && lead.company.trim()) ? lead.company.trim() : lead.name.trim()

    // Execute in a single ACID transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check or Create Client
      let client = await tx.crmClient.findFirst({
        where: { company_name: { equals: clientName } }
      })

      if (!client) {
        client = await tx.crmClient.create({
          data: {
            company_name: clientName,
            industry: lead.industry || null,
            status: 'Active',
            source: lead.source,
            assigned_user_id: lead.assigned_user_id,
            contacts: {
              create: {
                name: lead.name,
                email: lead.email || null,
                phone: lead.phone || null,
                whatsapp: lead.whatsapp || null,
                is_primary: true
              }
            }
          }
        })
      }

      // 2. Find or create default pipeline & initial stage
      let pipeline = await tx.crmPipeline.findFirst({
        include: { stages: { orderBy: { order: 'asc' } } }
      })

      if (!pipeline || pipeline.stages.length === 0) {
        pipeline = await tx.crmPipeline.create({
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
      }

      const initialStage = pipeline.stages[0]

      // 3. Create Deal
      const deal = await tx.crmDeal.create({
        data: {
          title: `${clientName} Deal`,
          lead_id: lead.id,
          client_id: client.id,
          assigned_user_id: lead.assigned_user_id,
          stage: initialStage.name,
          stage_id: initialStage.id,
          pipeline_id: pipeline.id,
          value: lead.estimated_value || null,
          probability: initialStage.probability || 10
        }
      })

      // 4. Update Lead Status
      await tx.crmLead.update({
        where: { id: leadId },
        data: { status: 'Converted' }
      })

      return { client, deal }
    })

    triggerCrmRevalidation()
    return { success: true, data: result }
  } catch (error: any) {
    console.error('Failed to convert CRM lead:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// 3. DEALS & PIPELINE ACTIONS
// ============================================================================

export async function getCrmDeals() {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

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
  const user = await requireAuth()
  requireCrmPermission(user, 'create')

  try {
    if (!data.title || !data.title.trim()) {
      return { success: false, error: 'Deal title is required.' }
    }

    const deal = await prisma.crmDeal.create({
      data: {
        title: data.title.trim(),
        client_id: data.client_id ? Number(data.client_id) : null,
        lead_id: data.lead_id ? Number(data.lead_id) : null,
        assigned_user_id: data.assigned_user_id ? Number(data.assigned_user_id) : user.id,
        stage: data.stage || 'New',
        pipeline_id: data.pipeline_id ? Number(data.pipeline_id) : null,
        stage_id: data.stage_id ? Number(data.stage_id) : null,
        value: data.value && !isNaN(parseFloat(data.value)) ? parseFloat(data.value) : null,
        probability: data.probability !== undefined && !isNaN(parseInt(data.probability)) ? parseInt(data.probability) : 0,
        expected_close: data.expected_close ? new Date(data.expected_close) : null,
      }
    })

    await recordCrmActivity(
      user.id,
      'Deal Created',
      `Created deal: ${deal.title} (${deal.value ? `Rp ${deal.value.toLocaleString('id-ID')}` : 'No value'})`,
      { client_id: deal.client_id, lead_id: deal.lead_id, deal_id: deal.id }
    )
    triggerCrmRevalidation()

    return { success: true, data: deal }
  } catch (error: any) {
    console.error('Failed to create CRM deal:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmDeal(id: number, data: any) {
  const user = await requireAuth()
  requireCrmPermission(user, 'update')

  try {
    const dealId = Number(id)
    const existing = await prisma.crmDeal.findUnique({ where: { id: dealId } })
    if (!existing) return { success: false, error: 'Deal not found.' }

    const updateData: any = {}
    if (data.title) updateData.title = data.title.trim()
    if (data.client_id !== undefined) updateData.client_id = data.client_id ? Number(data.client_id) : null
    if (data.lead_id !== undefined) updateData.lead_id = data.lead_id ? Number(data.lead_id) : null
    if (data.assigned_user_id !== undefined) updateData.assigned_user_id = data.assigned_user_id ? Number(data.assigned_user_id) : null
    if (data.stage) updateData.stage = data.stage
    if (data.stage_id !== undefined) updateData.stage_id = data.stage_id ? Number(data.stage_id) : null
    if (data.pipeline_id !== undefined) updateData.pipeline_id = data.pipeline_id ? Number(data.pipeline_id) : null
    if (data.value !== undefined) updateData.value = data.value !== '' && !isNaN(parseFloat(data.value)) ? parseFloat(data.value) : null
    if (data.probability !== undefined) updateData.probability = !isNaN(parseInt(data.probability)) ? parseInt(data.probability) : 0
    if (data.expected_close !== undefined) updateData.expected_close = data.expected_close ? new Date(data.expected_close) : null

    const deal = await prisma.crmDeal.update({
      where: { id: dealId },
      data: updateData
    })

    await recordCrmActivity(user.id, 'Deal Updated', `Updated deal: ${deal.title}`, { client_id: deal.client_id, lead_id: deal.lead_id, deal_id: deal.id })
    triggerCrmRevalidation()

    return { success: true, data: deal }
  } catch (error: any) {
    console.error('Failed to update CRM deal:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCrmDealStage(id: number, stage: string, pipeline_id?: number, stage_id?: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'update')

  try {
    const dealId = Number(id)
    const updateData: any = { stage }
    if (pipeline_id !== undefined) updateData.pipeline_id = Number(pipeline_id)
    if (stage_id !== undefined) updateData.stage_id = Number(stage_id)

    const deal = await prisma.crmDeal.update({
      where: { id: dealId },
      data: updateData
    })

    await recordCrmActivity(
      user.id,
      'Deal Stage Moved',
      `Moved deal "${deal.title}" to stage "${stage}"`,
      { client_id: deal.client_id, lead_id: deal.lead_id, deal_id: deal.id }
    )
    triggerCrmRevalidation()

    return { success: true, data: deal }
  } catch (error: any) {
    console.error('Failed to update CRM deal stage:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmDeal(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'delete')

  try {
    const dealId = Number(id)
    const deal = await prisma.crmDeal.findUnique({ where: { id: dealId } })
    if (!deal) return { success: false, error: 'Deal not found.' }

    await prisma.crmDeal.delete({ where: { id: dealId } })
    await recordCrmActivity(user.id, 'Deal Deleted', `Deleted deal: ${deal.title}`)
    triggerCrmRevalidation()

    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM deal:', error)
    return { success: false, error: error.message }
  }
}

export async function getCrmPipelines() {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

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

// ============================================================================
// 4. NOTES ACTIONS
// ============================================================================

export async function getCrmNotes(filter: { client_id?: number; lead_id?: number }) {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

  try {
    const where: any = {}
    if (filter.client_id) where.client_id = Number(filter.client_id)
    if (filter.lead_id) where.lead_id = Number(filter.lead_id)

    const notes = await prisma.crmNote.findMany({
      where,
      include: {
        author: { select: { id: true, firstname: true, lastname: true, avatar: true } }
      },
      orderBy: { created_at: 'desc' }
    })
    return { success: true, data: notes }
  } catch (error: any) {
    console.error('Failed to get CRM notes:', error)
    return { success: false, error: error.message }
  }
}

export async function createCrmNote(data: { content: string; client_id?: number; lead_id?: number }) {
  const user = await requireAuth()
  requireCrmPermission(user, 'create')

  try {
    if (!data.content || !data.content.trim()) {
      return { success: false, error: 'Note content cannot be empty.' }
    }

    const note = await prisma.crmNote.create({
      data: {
        content: data.content.trim(),
        author_id: user.id,
        client_id: data.client_id ? Number(data.client_id) : null,
        lead_id: data.lead_id ? Number(data.lead_id) : null,
      },
      include: {
        author: { select: { id: true, firstname: true, lastname: true, avatar: true } }
      }
    })

    await recordCrmActivity(
      user.id,
      'Note Added',
      `Added a note: "${note.content.slice(0, 60)}${note.content.length > 60 ? '...' : ''}"`,
      { client_id: note.client_id, lead_id: note.lead_id }
    )
    triggerCrmRevalidation()

    return { success: true, data: note }
  } catch (error: any) {
    console.error('Failed to create CRM note:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCrmNote(id: number) {
  const user = await requireAuth()
  requireCrmPermission(user, 'delete')

  try {
    const noteId = Number(id)
    const note = await prisma.crmNote.findUnique({ where: { id: noteId } })
    if (!note) return { success: false, error: 'Note not found.' }

    // Check ownership unless admin
    if (note.author_id !== user.id && user.role_id !== 1 && user.role?.name?.toLowerCase() !== 'admin') {
      return { success: false, error: 'You can only delete your own notes.' }
    }

    await prisma.crmNote.delete({ where: { id: noteId } })
    triggerCrmRevalidation()

    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete CRM note:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// 5. OVERVIEW STATS & DASHBOARD
// ============================================================================

export async function getCrmOverviewStats() {
  const user = await requireAuth()
  requireCrmPermission(user, 'view')

  try {
    const totalClients = await prisma.crmClient.count()
    const activeLeads = await prisma.crmLead.count({
      where: { status: { notIn: ['Lost', 'Converted'] } }
    })
    const openDeals = await prisma.crmDeal.count({
      where: { stage: { notIn: ['Lost', 'Won'] } }
    })

    const dealsAgg = await prisma.crmDeal.aggregate({
      _sum: { value: true },
      where: { stage: { notIn: ['Lost', 'Won'] } }
    })

    const wonDeals = await prisma.crmDeal.count({
      where: { stage: 'Won' }
    })

    const totalClosedDeals = await prisma.crmDeal.count({
      where: { stage: { in: ['Won', 'Lost'] } }
    })

    const performanceScore = totalClosedDeals > 0
      ? Math.round((wonDeals / totalClosedDeals) * 100)
      : (totalClients > 0 || activeLeads > 0 ? 80 : 0)

    const recentLeads = await prisma.crmLead.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        status: true,
        created_at: true,
      }
    })

    const recentDeals = await prisma.crmDeal.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        client: { select: { company_name: true } },
        lead: { select: { name: true } }
      }
    })

    return {
      success: true,
      data: {
        totalClients,
        activeLeads,
        openDeals,
        openDealsValue: dealsAgg._sum.value || 0,
        wonDeals,
        performanceScore,
        recentLeads,
        recentDeals
      }
    }
  } catch (error: any) {
    console.error('Failed to get CRM stats:', error)
    return { success: false, error: error.message }
  }
}
