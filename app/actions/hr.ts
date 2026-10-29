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
  
  const where: any = { status: { not: 'resign' } }
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
// ATTENDANCE & LEAVES (FULL CRUD & APPROVALS)
// -----------------------------------------------------------------------------
export async function getAttendances() {
  await requireAuth()
  return prisma.hrAttendance.findMany({
    orderBy: { date: 'desc' },
    include: { employee: true }
  })
}

export async function createAttendance(data: {
  employeeId: number
  date: string | Date
  timeIn?: string | null
  timeOut?: string | null
  status: string
  approvalStatus?: string
  attachment?: string | null
  notes?: string | null
}) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const attendance = await prisma.hrAttendance.create({
    data: {
      employee_id: Number(data.employeeId),
      date: new Date(data.date),
      time_in: data.timeIn || null,
      time_out: data.timeOut || null,
      status: data.status || 'Present',
      approval_status: data.approvalStatus || (['Sick', 'Permit', 'Sakit', 'Izin'].includes(data.status) ? 'Pending' : 'Approved'),
      attachment: data.attachment || null,
      notes: data.notes || null,
    },
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Created attendance record for employee ${data.employeeId} on ${data.date}`
  })

  return attendance
}

export async function updateAttendance(id: number, data: {
  employeeId?: number
  date?: string | Date
  timeIn?: string | null
  timeOut?: string | null
  status?: string
  approvalStatus?: string
  attachment?: string | null
  notes?: string | null
}) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const updateData: any = {}
  if (data.employeeId !== undefined) updateData.employee_id = Number(data.employeeId)
  if (data.date !== undefined) updateData.date = new Date(data.date)
  if (data.timeIn !== undefined) updateData.time_in = data.timeIn
  if (data.timeOut !== undefined) updateData.time_out = data.timeOut
  if (data.status !== undefined) updateData.status = data.status
  if (data.approvalStatus !== undefined) updateData.approval_status = data.approvalStatus
  if (data.attachment !== undefined) updateData.attachment = data.attachment
  if (data.notes !== undefined) updateData.notes = data.notes

  const attendance = await prisma.hrAttendance.update({
    where: { id },
    data: updateData,
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated attendance record ${id}`
  })

  return attendance
}

export async function updateAttendanceApproval(id: number, approval_status: string) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const attendance = await prisma.hrAttendance.update({
    where: { id },
    data: { approval_status },
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated attendance approval for ${id} to ${approval_status}`
  })

  return attendance
}

export async function deleteAttendance(id: number) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  await prisma.hrAttendance.delete({
    where: { id }
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted attendance record ${id}`
  })

  return { success: true }
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

// -----------------------------------------------------------------------------
// ATTENDANCE SUMMARY CRUD
// -----------------------------------------------------------------------------
export async function getAttendanceSummaries() {
  await requireAuth()
  return prisma.hrAttendanceSummary.findMany({
    orderBy: { created_at: 'desc' },
    include: { employee: true }
  })
}

export async function createAttendanceSummary(data: any) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const summary = await prisma.hrAttendanceSummary.create({
    data: {
      employee_id: Number(data.employeeId),
      period: data.period,
      department: data.department || null,
      work_hours_standard: data.workHoursStandard ? parseFloat(data.workHoursStandard) : null,
      work_hours_actual: data.workHoursActual ? parseFloat(data.workHoursActual) : null,
      late_hours: data.lateHours ? parseInt(data.lateHours) : 0,
      late_minutes: data.lateMinutes ? parseInt(data.lateMinutes) : 0,
      early_leave_hours: data.earlyLeaveHours ? parseInt(data.earlyLeaveHours) : 0,
      early_leave_minutes: data.earlyLeaveMinutes ? parseInt(data.earlyLeaveMinutes) : 0,
      overtime_normal: data.overtimeNormal ? parseFloat(data.overtimeNormal) : 0,
      overtime_special: data.overtimeSpecial ? parseFloat(data.overtimeSpecial) : 0,
      attendance_days_standard: data.attendanceDaysStandard ? parseFloat(data.attendanceDaysStandard) : 0,
      attendance_days_actual: data.attendanceDaysActual ? parseFloat(data.attendanceDaysActual) : 0,
      business_trip_days: data.businessTripDays ? parseInt(data.businessTripDays) : 0,
      absent_days: data.absentDays ? parseInt(data.absentDays) : 0,
      leave_days: data.leaveDays ? parseInt(data.leaveDays) : 0,
      percentage: data.percentage ? parseFloat(data.percentage) : null,
      status: data.status || 'Approved',
      notes: data.notes || null,
    },
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Created attendance summary for employee ${data.employeeId} period ${data.period}`
  })

  return summary
}

export async function updateAttendanceSummary(id: number, data: any) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const updateData: any = {}
  if (data.employeeId !== undefined) updateData.employee_id = Number(data.employeeId)
  if (data.period !== undefined) updateData.period = data.period
  if (data.department !== undefined) updateData.department = data.department
  if (data.workHoursStandard !== undefined) updateData.work_hours_standard = parseFloat(data.workHoursStandard)
  if (data.workHoursActual !== undefined) updateData.work_hours_actual = parseFloat(data.workHoursActual)
  if (data.lateHours !== undefined) updateData.late_hours = parseInt(data.lateHours)
  if (data.lateMinutes !== undefined) updateData.late_minutes = parseInt(data.lateMinutes)
  if (data.earlyLeaveHours !== undefined) updateData.early_leave_hours = parseInt(data.earlyLeaveHours)
  if (data.earlyLeaveMinutes !== undefined) updateData.early_leave_minutes = parseInt(data.earlyLeaveMinutes)
  if (data.overtimeNormal !== undefined) updateData.overtime_normal = parseFloat(data.overtimeNormal)
  if (data.overtimeSpecial !== undefined) updateData.overtime_special = parseFloat(data.overtimeSpecial)
  if (data.attendanceDaysStandard !== undefined) updateData.attendance_days_standard = parseFloat(data.attendanceDaysStandard)
  if (data.attendanceDaysActual !== undefined) updateData.attendance_days_actual = parseFloat(data.attendanceDaysActual)
  if (data.businessTripDays !== undefined) updateData.business_trip_days = parseInt(data.businessTripDays)
  if (data.absentDays !== undefined) updateData.absent_days = parseInt(data.absentDays)
  if (data.leaveDays !== undefined) updateData.leave_days = parseInt(data.leaveDays)
  if (data.percentage !== undefined) updateData.percentage = parseFloat(data.percentage)
  if (data.status !== undefined) updateData.status = data.status
  if (data.notes !== undefined) updateData.notes = data.notes

  const summary = await prisma.hrAttendanceSummary.update({
    where: { id },
    data: updateData,
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated attendance summary ${id}`
  })

  return summary
}

export async function deleteAttendanceSummary(id: number) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  await prisma.hrAttendanceSummary.delete({
    where: { id }
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted attendance summary ${id}`
  })

  return { success: true }
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

// -----------------------------------------------------------------------------
// LEAVE REQUESTS (FULL CRUD & APPROVALS)
// -----------------------------------------------------------------------------
export async function getLeaves() {
  await requireAuth()
  return prisma.hrLeaveRequest.findMany({
    orderBy: { start_date: 'desc' },
    include: { employee: true }
  })
}

export async function createLeaveRequest(data: {
  employeeId: number
  type: string
  startDate: string | Date
  endDate: string | Date
  reason: string
  attachment?: string | null
  status?: string
}) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const leave = await prisma.hrLeaveRequest.create({
    data: {
      employee_id: Number(data.employeeId),
      type: data.type,
      start_date: new Date(data.startDate),
      end_date: new Date(data.endDate),
      reason: data.reason,
      attachment: data.attachment || null,
      status: data.status || 'Pending'
    },
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Created leave request (${data.type}) for employee ${data.employeeId}`
  })

  return leave
}

export async function updateLeaveRequest(id: number, data: {
  employeeId?: number
  type?: string
  startDate?: string | Date
  endDate?: string | Date
  reason?: string
  attachment?: string | null
  status?: string
}) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const updateData: any = {}
  if (data.employeeId !== undefined) updateData.employee_id = Number(data.employeeId)
  if (data.type !== undefined) updateData.type = data.type
  if (data.startDate !== undefined) updateData.start_date = new Date(data.startDate)
  if (data.endDate !== undefined) updateData.end_date = new Date(data.endDate)
  if (data.reason !== undefined) updateData.reason = data.reason
  if (data.attachment !== undefined) updateData.attachment = data.attachment
  if (data.status !== undefined) updateData.status = data.status

  const leave = await prisma.hrLeaveRequest.update({
    where: { id },
    data: updateData,
    include: { employee: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated leave request ${id}`
  })

  return leave
}

export async function updateLeaveStatus(id: number, status: string) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  const leave = await prisma.hrLeaveRequest.update({
    where: { id },
    data: { status },
    include: { employee: true }
  })
  
  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated leave request ${id} to ${status}`
  })
  
  return leave;
}

export async function deleteLeaveRequest(id: number) {
  const auth = await requireAuth()
  const uid = parseInt(auth.id, 10)

  await prisma.hrLeaveRequest.delete({
    where: { id }
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted leave request ${id}`
  })

  return { success: true }
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
  const uid = parseInt(auth.id, 10)

  const employee = await prisma.user.findUnique({
    where: { id: parseInt(data.employeeId, 10) }
  })
  const netPay = data.basicSalary + (data.allowance || 0) - (data.deduction || 0)

  const payroll = await prisma.hrPayroll.create({
    data: {
      employee_id: parseInt(data.employeeId, 10),
      period: data.period,
      basic_salary: data.basicSalary,
      allowance: data.allowance || 0,
      deduction: data.deduction || 0,
      net_pay: netPay,
      status: data.status || 'Pending'
    }
  })

  // Otomatis masukkan ke antrean Pengeluaran di Finance
  if (netPay > 0) {
    try {
      const category = await prisma.financeCategory.findFirst({
        where: { name: { contains: 'Gaji' } }
      })
      await prisma.financeExpense.create({
        data: {
          date: new Date(),
          description: `Gaji Karyawan: ${employee?.name || 'Karyawan'} (Periode ${data.period})`,
          category: 'Salaries',
          category_id: category?.id || null,
          amount: netPay,
          vendor: employee?.name || 'Karyawan',
          status: 'Pending',
          payroll_id: payroll.id,
          created_by: uid
        }
      })
    } catch (err) {
      console.error('Error auto-creating finance expense for payroll:', err)
    }
  }

  await logActivity({
    userId: uid,
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

  // Juga hapus dari antrean pengeluaran finance jika masih Pending
  await prisma.financeExpense.deleteMany({
    where: { payroll_id: id, status: 'Pending' }
  }).catch(() => {})

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
