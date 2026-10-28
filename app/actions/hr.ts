'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'

// -----------------------------------------------------------------------------
// OVERVIEW & SUMMARY
// -----------------------------------------------------------------------------
export async function getHrOverview() {
  await requireAuth()
  
  const [employeesCount, pendingLeaves, newCandidates] = await Promise.all([
    prisma.user.count(),
    prisma.hrLeaveRequest.count({ where: { status: 'Pending' } }),
    prisma.hrCandidate.count({ where: { status: 'Applied' } })
  ])
  
  return {
    totalEmployees: employeesCount,
    activeLeaveRequests: pendingLeaves,
    openRoles: 3,
    newCandidates
  }
}

// -----------------------------------------------------------------------------
// EMPLOYEES (using existing users table)
// -----------------------------------------------------------------------------
export async function getEmployees(filters?: { search?: string }) {
  await requireAuth()
  
  const where: any = {}
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } },
      { firstname: { contains: filters.search } },
      { lastname: { contains: filters.search } },
    ]
  }
  
  const users = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { role: true }
  })

  // Map users → Employee shape for the UI
  return users.map(u => ({
    id: u.id,
    name: u.name || `${u.firstname} ${u.lastname}`,
    email: u.email,
    role: u.role?.name || 'Member',
    department: 'General', // users table has no department column
    status: 'Active',
    joinDate: u.date_created?.toISOString().split('T')[0] ?? '',
  }))
}

export async function createEmployee(_data: any) {
  // Employees are managed through the user management system.
  // Creating a user requires password hashing — not done here.
  throw new Error('Use the User Management module to add new users.')
}

export async function updateEmployee(id: number, data: any) {
  await requireAuth()
  return prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
    }
  })
}

export async function deleteEmployee(_id: number) {
  throw new Error('Use the User Management module to remove users.')
}

// -----------------------------------------------------------------------------
// ATTENDANCE & LEAVES
// -----------------------------------------------------------------------------
export async function getAttendances() {
  await requireAuth()
  return prisma.hrAttendance.findMany({
    orderBy: { date: 'desc' },
    include: { employee: true }
  })
}

export async function importAttendances(data: any[]) {
  const auth = await requireAuth()
  
  const mapped = data.map(item => ({
    employee_id: parseInt(String(item.employee_id)),
    date: new Date(item.date),
    time_in: item.time_in,
    time_out: item.time_out,
    status: item.status,
    notes: item.notes || null,
  }))

  const result = await prisma.hrAttendance.createMany({
    data: mapped,
    skipDuplicates: true,
  })
  
  await logActivity({
    userId: parseInt(auth.id, 10),
    activityType: 'import',
    description: `Imported ${result.count} attendance records`
  })
  
  return result;
}

export async function getAttendanceSummaries() {
  await requireAuth()
  return prisma.hrAttendanceSummary.findMany({
    orderBy: { created_at: 'desc' },
    include: { employee: true }
  })
}

export async function importAttendanceSummaries(data: any[]) {
  await requireAuth()
  
  const mapped = data.map(item => ({
    employee_id: parseInt(String(item.employee_id)),
    period: item.period || '',
    department: item.department || null,
    work_hours_standard: item.work_hours_standard || null,
    work_hours_actual: item.work_hours_actual || null,
    late_hours: item.late_hours || null,
    late_minutes: item.late_minutes || null,
    early_leave_hours: item.early_leave_hours || null,
    early_leave_minutes: item.early_leave_minutes || null,
    overtime_normal: item.overtime_normal || null,
    overtime_special: item.overtime_special || null,
    attendance_days_standard: item.attendance_days_standard || null,
    attendance_days_actual: item.attendance_days_actual || null,
    business_trip_days: item.business_trip_days || null,
    absent_days: item.absent_days || null,
    leave_days: item.leave_days || null,
    percentage: item.percentage || null,
  }))

  return prisma.hrAttendanceSummary.createMany({
    data: mapped,
    skipDuplicates: true,
  })
}

export async function getLeaves() {
  await requireAuth()
  return prisma.hrLeaveRequest.findMany({
    orderBy: { start_date: 'desc' },
    include: { employee: true }
  })
}

export async function updateLeaveStatus(id: number, status: string) {
  const auth = await requireAuth()
  const leave = await prisma.hrLeaveRequest.update({
    where: { id },
    data: { status }
  })
  
  await logActivity({
    userId: parseInt(auth.id, 10),
    activityType: 'update',
    description: `Updated leave request ${id} to ${status}`
  })
  
  return leave;
}

export async function createLeaveRequest(data: any) {
  await requireAuth()
  return prisma.hrLeaveRequest.create({
    data: {
      employee_id: data.employeeId,
      type: data.type,
      start_date: data.startDate ? new Date(data.startDate) : new Date(),
      end_date: data.endDate ? new Date(data.endDate) : new Date(),
      reason: data.reason,
      status: data.status || 'Pending'
    }
  })
}

// -----------------------------------------------------------------------------
// PAYROLL
// -----------------------------------------------------------------------------
export async function getPayrolls() {
  await requireAuth()
  return prisma.hrPayroll.findMany({
    orderBy: { created_at: 'desc' },
    include: { employee: true }
  })
}

export async function createPayroll(data: any) {
  const auth = await requireAuth()
  const payroll = await prisma.hrPayroll.create({
    data: {
      employee_id: data.employeeId,
      period: data.period,
      basic_salary: data.basicSalary,
      allowance: data.allowance || 0,
      deduction: data.deduction || 0,
      net_pay: data.basicSalary + (data.allowance || 0) - (data.deduction || 0),
      status: data.status || 'Pending'
    }
  })
  
  await logActivity({
    userId: parseInt(auth.id, 10),
    activityType: 'create',
    description: `Created payroll for employee ${data.employeeId} period ${data.period}`
  })
  
  return payroll;
}

export async function updatePayroll(data: {
  id: number
  status: string
  paymentProof?: string | null
  paymentDate?: string | null
  notes?: string | null
  syncToFinance?: boolean
}) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const existing = await prisma.hrPayroll.findUnique({
    where: { id: data.id },
    include: { employee: true }
  })
  if (!existing) throw new Error('Payroll record not found.')

  let paymentDateVal: Date | null = null
  if (data.paymentDate) {
    paymentDateVal = new Date(data.paymentDate)
  } else if (data.status === 'Paid') {
    paymentDateVal = existing.payment_date || new Date()
  }

  const updated = await prisma.hrPayroll.update({
    where: { id: data.id },
    data: {
      status: data.status,
      payment_proof: data.paymentProof !== undefined ? data.paymentProof : existing.payment_proof,
      payment_date: paymentDateVal,
      notes: data.notes !== undefined ? data.notes : existing.notes
    },
    include: { employee: true }
  })

  // Optional: Sync to Finance Expenses if marked as Paid
  if (data.syncToFinance && data.status === 'Paid' && updated.net_pay > 0) {
    try {
      const categoryName = 'Gaji & Upah'
      const category = await prisma.financeCategory.findFirst({
        where: { name: { contains: 'Gaji' } }
      })

      await prisma.financeExpense.create({
        data: {
          date: paymentDateVal || new Date(),
          description: `Gaji Karyawan: ${updated.employee.name} (Periode ${updated.period})`,
          category: category?.name || categoryName,
          category_id: category?.id || null,
          amount: updated.net_pay,
          vendor: updated.employee.name,
          status: 'Paid',
          created_by: uid
        }
      })
    } catch (err) {
      console.error('Error syncing payroll to finance expense:', err)
    }
  }

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated payroll status for ${updated.employee.name} (${updated.period}) to ${data.status}`
  })

  return updated
}

export async function deletePayroll(id: number) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const existing = await prisma.hrPayroll.findUnique({
    where: { id },
    include: { employee: true }
  })
  if (!existing) throw new Error('Payroll record not found.')

  await prisma.hrPayroll.delete({ where: { id } })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted payroll record for ${existing.employee.name} period ${existing.period}`
  })

  return { success: true }
}

export async function exportPayrollsCsv() {
  await requireAuth()
  const payrolls = await prisma.hrPayroll.findMany({
    orderBy: { created_at: 'desc' },
    include: { employee: true }
  })
  
  const header = 'ID,Employee Name,Period,Basic Salary,Allowance,Deduction,Net Pay,Status,Payment Date,Notes,Payment Proof\n'
  const rows = payrolls.map(p => 
    `${p.id},"${p.employee?.name || ''}",${p.period},${p.basic_salary},${p.allowance},${p.deduction},${p.net_pay},${p.status},"${p.payment_date ? p.payment_date.toISOString().slice(0, 10) : ''}","${(p.notes || '').replace(/"/g, '""')}","${p.payment_proof || ''}"`
  ).join('\n')
  
  return header + rows
}

// -----------------------------------------------------------------------------
// RECRUITMENT (ATS)
// -----------------------------------------------------------------------------
export async function getCandidates(filters?: { search?: string }) {
  await requireAuth()
  
  const where: any = {}
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { role_applied: { contains: filters.search } }
    ]
  }
  
  return prisma.hrCandidate.findMany({
    where,
    orderBy: { applied_date: 'desc' }
  })
}

export async function updateCandidateStatus(id: number, status: string) {
  const auth = await requireAuth()
  const candidate = await prisma.hrCandidate.update({
    where: { id },
    data: { status }
  })
  
  await logActivity({
    userId: parseInt(auth.id, 10),
    activityType: 'update',
    description: `Updated candidate ${candidate.name} status to ${status}`
  })
  
  return candidate;
}

export async function createCandidate(data: any) {
  const auth = await requireAuth()
  const candidate = await prisma.hrCandidate.create({
    data: {
      name: data.name,
      email: data.email,
      role_applied: data.roleApplied,
      applied_date: data.appliedDate ? new Date(data.appliedDate) : new Date(),
      rating: data.rating || 0,
      status: data.status || 'Applied'
    }
  })
  
  await logActivity({
    userId: parseInt(auth.id, 10),
    activityType: 'create',
    description: `Created candidate ${candidate.name} for ${candidate.role_applied}`
  })
  
  return candidate;
}
