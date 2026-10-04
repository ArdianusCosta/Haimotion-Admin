"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Search, FileText, Briefcase, Users, FolderOpen } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { globalSearch, SearchResult } from "@/app/actions/search"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebounce(search, 300)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return []
      const res = await globalSearch(debouncedSearch)
      if (res.success && res.data) {
        return res.data
      }
      return []
    },
    enabled: debouncedSearch.length >= 2
  })

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderOpen className="mr-2 h-4 w-4" />
      case 'task': return <Briefcase className="mr-2 h-4 w-4" />
      case 'client': return <Users className="mr-2 h-4 w-4" />
      case 'invoice': return <FileText className="mr-2 h-4 w-4" />
      case 'user': return <User className="mr-2 h-4 w-4" />
      default: return <FileText className="mr-2 h-4 w-4" />
    }
  }

  // Group results
  const groupedResults = React.useMemo(() => {
    if (!results) return {}
    return results.reduce((acc: Record<string, SearchResult[]>, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    }, {})
  }, [results])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full max-w-[200px] lg:max-w-[300px]"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type a command or search..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? "Searching..." : "No results found."}
          </CommandEmpty>
          
          {Object.keys(groupedResults).map(type => (
            <React.Fragment key={type}>
              <CommandGroup heading={type.charAt(0).toUpperCase() + type.slice(1)}>
                {groupedResults[type].map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    onSelect={() => runCommand(() => router.push(item.url))}
                  >
                    {getIcon(item.type)}
                    <span>{item.title}</span>
                    {item.subtitle && <span className="ml-2 text-xs text-muted-foreground">- {item.subtitle}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
