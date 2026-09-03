import fs from 'fs'

let code = fs.readFileSync('./components/project-contributors-dialog.tsx', 'utf-8')

code = code.replace(
  `// Dummy mutation function just to map to real API when ready
export async function updateProjectMembersAction(projectId: number, userIds: string) {
  const res = await fetch('/api/projects/members', {
    method: 'POST',
    body: JSON.stringify({ projectId, userIds })
  })
  return res.json()
}`,
  `import { updateProjectMembers } from '@/app/actions/projects'`
)

code = code.replace(
  `// Use the generic fetch since we don't want to import server actions directly in client component if they're complex, 
      // but wait, we can just use a server action if we create one.
      const res = await fetch('/api/projects/' + project.id + '/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: newUserIds })
      })
      if (!res.ok) throw new Error('Failed to update members')
      return res.json()`,
  `const res = await updateProjectMembers(project.id, newUserIds)
      if (!res.success) throw new Error(res.error)
      return res.data`
)

fs.writeFileSync('./components/project-contributors-dialog.tsx', code)
