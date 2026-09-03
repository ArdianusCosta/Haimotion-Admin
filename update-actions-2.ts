import fs from 'fs'
let code = fs.readFileSync('./app/actions/projects.ts', 'utf-8')

code = code.replace(
  `const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    const formattedProject = {`,
  `const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    let deliveryConfidence = 'On Track'
    if (pendingTasks > 0 && progress < 30) deliveryConfidence = 'At Risk'
    if (pendingTasks > 0 && tasks.some(t => t.status === 0)) deliveryConfidence = 'Blocked'
    
    const formattedProject = {`
)

code = code.replace(
  `pendingTasks,
        progress
      }`,
  `pendingTasks,
        progress,
        deliveryConfidence
      }`
)

fs.writeFileSync('./app/actions/projects.ts', code)
