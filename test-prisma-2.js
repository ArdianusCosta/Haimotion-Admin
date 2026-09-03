const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.project_list.findMany({
    where: { is_archived: false }
  })
  console.log(projects.length)
}
main()
