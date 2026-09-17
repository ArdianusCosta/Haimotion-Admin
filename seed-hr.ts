import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding HR data...')

  // Clear existing HR transactional data first
  await prisma.hrLeaveRequest.deleteMany()
  await prisma.hrPayroll.deleteMany()
  await prisma.hrCandidate.deleteMany()

  // Get real user IDs from the users table
  const users = await prisma.user.findMany({ take: 3, orderBy: { id: 'asc' } })

  if (users.length === 0) {
    console.log('No users found in DB. Please create some users first.')
    return
  }

  const u1 = users[0]
  const u2 = users[1] ?? users[0]
  const u3 = users[2] ?? users[0]

  console.log(`Using users: ${users.map(u => u.name || u.email).join(', ')}`)

  // Leave Requests (linked to real user IDs)
  await prisma.hrLeaveRequest.create({
    data: {
      employee_id: u2.id,
      type: 'Annual',
      start_date: new Date('2026-09-10'),
      end_date: new Date('2026-09-15'),
      reason: 'Family Vacation',
      status: 'Approved',
    }
  })

  await prisma.hrLeaveRequest.create({
    data: {
      employee_id: u3.id,
      type: 'Sick',
      start_date: new Date('2026-09-12'),
      end_date: new Date('2026-09-13'),
      reason: 'Fever and headache',
      status: 'Pending',
    }
  })

  // Payrolls (linked to real user IDs)
  await prisma.hrPayroll.create({
    data: {
      employee_id: u1.id,
      period: '2026-09',
      basic_salary: 25000000,
      allowance: 2000000,
      deduction: 500000,
      net_pay: 26500000,
      status: 'Paid',
    }
  })

  await prisma.hrPayroll.create({
    data: {
      employee_id: u2.id,
      period: '2026-09',
      basic_salary: 18000000,
      allowance: 1500000,
      deduction: 0,
      net_pay: 19500000,
      status: 'Pending',
    }
  })

  // Candidates (ATS)
  await prisma.hrCandidate.deleteMany()
  await prisma.hrCandidate.create({
    data: {
      name: 'Michael Brown',
      email: 'michael.b@example.com',
      role_applied: 'Frontend Engineer',
      applied_date: new Date('2026-09-01'),
      rating: 4,
      status: 'Interview',
    }
  })

  await prisma.hrCandidate.create({
    data: {
      name: 'Lisa Wong',
      email: 'lisa.w@example.com',
      role_applied: 'Product Manager',
      applied_date: new Date('2026-09-05'),
      rating: 3,
      status: 'Screening',
    }
  })

  console.log('HR seeding completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
