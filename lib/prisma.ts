import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma5: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma5 ?? prismaClientSingleton()

export default prisma

export const __force_invalidate_cache = 2

if (process.env.NODE_ENV !== 'production') globalThis.prisma5 = prisma
