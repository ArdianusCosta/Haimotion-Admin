import fs from 'fs'
let code = fs.readFileSync('./app/actions/projects.ts', 'utf-8')

const newAction = `
export async function updateProjectMembers(id: number, user_ids: string) {
  try {
    const project = await prisma.project_list.update({
      where: { id },
      data: { user_ids }
    })
    return { success: true, data: project }
  } catch (error) {
    return { success: false, error: 'Failed to update members' }
  }
}
`

if (!code.includes('updateProjectMembers')) {
  code += newAction
  fs.writeFileSync('./app/actions/projects.ts', code)
}
