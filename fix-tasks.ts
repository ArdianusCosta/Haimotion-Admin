import fs from 'fs'
let code = fs.readFileSync('./app/actions/projects.ts', 'utf-8')

code = code.replace(
  `return {
        ...project,
        manager,
        members,
        stats: {`,
  `return {
        ...project,
        manager,
        members,
        tasks: projectTasks,
        stats: {`
)

fs.writeFileSync('./app/actions/projects.ts', code)
