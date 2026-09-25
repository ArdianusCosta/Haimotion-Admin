import { useEffect } from 'react'
import { Filter, Search } from 'lucide-react'
import { useKanban } from './kanban-provider'

export function KanbanHeader() {
  const { 
    searchQuery, setSearchQuery, 
    filterAssignees, setFilterAssignees, 
    showFilterDropdown, setShowFilterDropdown,
    users 
  } = useKanban()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false)
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [setShowFilterDropdown])

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Apps</span><span>/</span><span className="text-foreground">Kanban</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Project Board</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage tasks, track progress, and collaborate with your team.</p>
      </div>
      
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:w-64 focus-within:ring-1 focus-within:ring-ring">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <div className="relative filter-dropdown-container">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted ${filterAssignees.length > 0 ? 'border-primary text-primary bg-primary/5' : ''}`}
            >
              <Filter className="size-4" /> 
              Filter {filterAssignees.length > 0 && `(${filterAssignees.length})`}
            </button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-2 shadow-md animate-in fade-in zoom-in-95">
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground px-1">Filter by Assignee</h4>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                  {users.map((u: any) => {
                    const isSelected = filterAssignees.includes(u.id)
                    return (
                      <div 
                        key={u.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted ${isSelected ? 'bg-muted/50' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setFilterAssignees(filterAssignees.filter(id => id !== u.id))
                          } else {
                            setFilterAssignees([...filterAssignees, u.id])
                          }
                        }}
                      >
                        <div className={`flex size-4 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}>
                           {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                        <span>{u.firstname} {u.lastname}</span>
                      </div>
                    )
                  })}
                </div>
                {filterAssignees.length > 0 && (
                  <button 
                    onClick={() => setFilterAssignees([])}
                    className="mt-2 w-full rounded-sm bg-muted px-2 py-1.5 text-xs font-medium hover:bg-destructive/10 hover:text-destructive"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
