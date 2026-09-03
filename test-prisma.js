const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.project_list.findMany()
  console.log(projects.map(p => ({ id: p.id, is_archived: p.is_archived })))
}
main()
