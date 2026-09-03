import fs from 'fs'
let code = fs.readFileSync('./components/project-page.tsx', 'utf-8')
code = code.replace(
  `const { data: projectsRes, isLoading } = useQuery({`,
  `const { data: projectsRes, isLoading, error: projectsError } = useQuery({`
)
code = code.replace(
  `const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === null || p.status === statusFilter))`,
  `const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === null || p.status === statusFilter))
  
  if (projectsError) {
    console.error("Projects Fetch Error:", projectsError)
  }`
)
fs.writeFileSync('./components/project-page.tsx', code)
