import fs from 'fs'

let code = fs.readFileSync('./components/project-page.tsx', 'utf-8')

const oldTrigger = `<DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="size-4" /> 
                  {statusFilter === null ? 'Filter' : statusFilter === 2 ? 'Active' : statusFilter === 5 ? 'Done' : 'Pending'}
                </Button>
              </DropdownMenuTrigger>`

const newTrigger = `<DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Filter className="size-4" /> 
                  {statusFilter === null ? 'Filter' : statusFilter === 2 ? 'Active' : statusFilter === 5 ? 'Done' : 'Pending'}
                </Button>
              } />`

code = code.replace(oldTrigger, newTrigger)

fs.writeFileSync('./components/project-page.tsx', code)
