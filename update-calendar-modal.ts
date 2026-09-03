import fs from 'fs'

const filePath = './components/calendar-page.tsx'
let code = fs.readFileSync(filePath, 'utf8')

// 1. Add state
code = code.replace(
  "const [isDialogOpen, setIsDialogOpen] = useState(false)",
  "const [isDialogOpen, setIsDialogOpen] = useState(false)\n  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)"
)

// 2. Add DialogDescription to import
if (!code.includes('DialogDescription')) {
  code = code.replace(
    "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter }",
    "import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription }"
  )
}

// 3. Update handleDeleteEvent
code = code.replace(
  /const handleDeleteEvent = \(\) => {\n    if \(\!selectedEventId\) return\n    if \(\!confirm\('Are you sure you want to delete this event\?'\)\) return\n\n    setIsSubmitting\(true\)\n    deleteEventMutation\.mutate\(selectedEventId, {\n      onSettled: \(\) => setIsSubmitting\(false\)\n    }\)\n  }/,
  `const handleDeleteEvent = () => {
    if (!selectedEventId) return
    setIsSubmitting(true)
    deleteEventMutation.mutate(selectedEventId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setIsDialogOpen(false)
        toast.success('Event deleted successfully')
        queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
      },
      onSettled: () => setIsSubmitting(false)
    })
  }`
)

// Also need to remove the onSuccess from deleteEventMutation definition to avoid double toast,
// but the replacement above overrides the onSettled, wait let's just keep mutation definition and replace the function

code = code.replace(
  /const handleDeleteEvent = \(\) => {[\s\S]*?onSettled: \(\) => setIsSubmitting\(false\)[\s\S]*?}\)\n  }/,
  `const handleDeleteEvent = () => {
    if (!selectedEventId) return
    setIsSubmitting(true)
    deleteEventMutation.mutate(selectedEventId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setIsDialogOpen(false)
      },
      onSettled: () => setIsSubmitting(false)
    })
  }`
)


// 4. Update the delete button in the dialog to open the confirmation modal instead of calling handleDeleteEvent directly
code = code.replace(
  /onClick=\{handleDeleteEvent\}/,
  "onClick={() => setIsDeleteDialogOpen(true)}"
)

// 5. Add the confirmation dialog
const confirmDialog = `
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Event</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this event? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteEvent} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
`

code = code.replace(
  /(<Dialog open=\{isDialogOpen\} onOpenChange=\{setIsDialogOpen\}>)/,
  `${confirmDialog}\n          $1`
)

fs.writeFileSync(filePath, code)
