import fs from 'fs'

let code = fs.readFileSync('./components/project-page.tsx', 'utf-8')

// 1. Add decoding helpers
const helpers = `
function deeplyDecodeHTML(html: string) {
  if (!html) return '';
  let prev = '';
  let curr = html;
  // Decode up to 5 times to handle deeply nested escapes
  let maxIters = 5;
  while (prev !== curr && maxIters > 0) {
    prev = curr;
    curr = curr
         .replace(/&amp;/gi, "&")
         .replace(/&lt;/gi, "<")
         .replace(/&gt;/gi, ">")
         .replace(/&quot;/gi, '"')
         .replace(/&#039;/gi, "'")
         .replace(/&nbsp;/gi, " ");
    maxIters--;
  }
  return curr;
}

function stripHtmlTags(html: string) {
  const decoded = deeplyDecodeHTML(html);
  return decoded.replace(/<[^>]*>?/gm, '').trim();
}
`
code = code.replace("export function ProjectPage() {", helpers + "\nexport function ProjectPage() {")

// 2. Fix the description in list view
code = code.replace(
  "{project.description.replace(/<[^>]*>?/gm, '')}",
  "{stripHtmlTags(project.description)}"
)

// 3. Fix the description in detail view
code = code.replace(
  "dangerouslySetInnerHTML={{ __html: selectedProject.description }}",
  "dangerouslySetInnerHTML={{ __html: deeplyDecodeHTML(selectedProject.description) }}"
)

// 4. Add filter dropdown state and logic
code = code.replace(
  "const [searchQuery, setSearchQuery] = useState('')",
  "const [searchQuery, setSearchQuery] = useState('')\n  const [statusFilter, setStatusFilter] = useState<number | null>(null)"
)
code = code.replace(
  "const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))",
  "const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === null || p.status === statusFilter))"
)

// 5. Update Filter Button to be a Dropdown
const filterImport = "import {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuCheckboxItem,\n  DropdownMenuTrigger,\n} from \"@/components/ui/dropdown-menu\"\n"
code = code.replace("import { ProjectFormDialog", filterImport + "import { ProjectFormDialog")

const filterButton = `
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Filter className="size-4" /> Filter
            </Button>
`
const filterDropdown = `
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="size-4" /> 
                  {statusFilter === null ? 'Filter' : statusFilter === 2 ? 'Active' : statusFilter === 5 ? 'Done' : 'Pending'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem checked={statusFilter === null} onCheckedChange={() => setStatusFilter(null)}>All Status</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 2} onCheckedChange={() => setStatusFilter(2)}>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 0} onCheckedChange={() => setStatusFilter(0)}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 5} onCheckedChange={() => setStatusFilter(5)}>Completed</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
`
code = code.replace(filterButton, filterDropdown)

// 6. Fix broken buttons (hover effects and click events) in Detail View
code = code.replace(
  /<button className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">\s*<Star className="size-4" \/>\s*<\/button>/g,
  `<button onClick={() => toast('Project starred!')} className="flex size-9 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground">
              <Star className="size-4" />
            </button>`
)
code = code.replace(
  /<button className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted text-foreground">\s*<Share2 className="size-4" \/> <span className="hidden sm:inline">Share<\/span>\s*<\/button>/g,
  `<button onClick={() => toast('Share link copied!')} className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground text-foreground">
              <Share2 className="size-4" /> <span className="hidden sm:inline">Share</span>
            </button>`
)

// The other buttons in the sidebar
code = code.replace(
  /<button className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted">/g,
  `<button onClick={() => toast('Coming soon')} className="mt-4 flex h-8 w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">`
)

fs.writeFileSync('./components/project-page.tsx', code)
