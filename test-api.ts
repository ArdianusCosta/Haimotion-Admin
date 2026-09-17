// Just to test what happens if I query prisma
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.passkey.findMany().then(console.log).finally(()=>p.$disconnect())
