import fs from 'fs'

let code = fs.readFileSync('./components/project-form-dialog.tsx', 'utf-8')

const selectImport = `
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
`

code = code.replace("import { Button }", selectImport + "\nimport { Button }")

const managerSelect = `<select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
                value={formData.manager_id}
                onChange={e => setFormData({...formData, manager_id: e.target.value})}
                required
              >
                <option value="" disabled>Select a PM</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstname} {u.lastname}</option>
                ))}
              </select>`
              
const managerShadcnSelect = `<Select value={formData.manager_id} onValueChange={v => setFormData({...formData, manager_id: v})} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a PM" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.firstname} {u.lastname}</SelectItem>
                  ))}
                </SelectContent>
              </Select>`

code = code.replace(managerSelect, managerShadcnSelect)

const statusSelect = `<select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
                value={formData.status}
                onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}
              >
                <option value={0}>Pending / On Hold</option>
                <option value={2}>Active / In Progress</option>
                <option value={5}>Completed</option>
              </select>`
              
const statusShadcnSelect = `<Select value={formData.status.toString()} onValueChange={v => setFormData({...formData, status: parseInt(v)})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Pending / On Hold</SelectItem>
                  <SelectItem value="2">Active / In Progress</SelectItem>
                  <SelectItem value="5">Completed</SelectItem>
                </SelectContent>
              </Select>`

code = code.replace(statusSelect, statusShadcnSelect)

fs.writeFileSync('./components/project-form-dialog.tsx', code)
