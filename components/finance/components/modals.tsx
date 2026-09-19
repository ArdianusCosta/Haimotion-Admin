import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
}

export function ConfirmDeleteModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone. This will permanently delete the record." 
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10">
              <AlertTriangle className="size-5 text-rose-500" />
            </div>
            <DialogTitle className="text-rose-500">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  initialData?: any | null
}
export function InvoiceModal({ open, onOpenChange, onSave, initialData }: InvoiceModalProps) {
  const { t } = useLanguage()
  const [customerName, setCustomerName] = useState(initialData?.customer_name || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')

  // Reset state when modal opens/closes or initialData changes
  React.useEffect(() => {
    if (open) {
      setCustomerName(initialData?.customer_name || '')
      setAmount(initialData?.amount?.toString() || '')
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ customerName, amount: Number(amount) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
            <DialogDescription>
              {initialData ? 'Update the invoice details below.' : 'Add a new invoice to track customer billing.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="PT ABC" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (IDR)</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  initialData?: any | null
}
export function ExpenseModal({ open, onOpenChange, onSave, initialData }: ExpenseModalProps) {
  const [description, setDescription] = useState(initialData?.description || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || 'Operations')

  React.useEffect(() => {
    if (open) {
      setDescription(initialData?.description || '')
      setAmount(initialData?.amount?.toString() || '')
      setCategory(initialData?.category || 'Operations')
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ description, amount: Number(amount), category })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
            <DialogDescription>
              Track your company spending.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Sewa Kantor" />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Salaries">Salaries</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountExp">Amount (IDR)</Label>
              <Input id="amountExp" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  accounts: any[]
}
export function TransactionModal({ open, onOpenChange, onSave, accounts = [] }: TransactionModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('Expense')
  const [accountId, setAccountId] = useState('')

  React.useEffect(() => {
    if (open) {
      setDescription('')
      setAmount('')
      setType('Expense')
      setAccountId(accounts.length > 0 ? accounts[0].id.toString() : '')
    }
  }, [open, accounts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ description, amount: Number(amount), type: type as any, accountId: Number(accountId) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record manual cash or bank transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="txdesc">Description</Label>
              <Input id="txdesc" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="txamt">Amount (IDR)</Label>
              <Input id="txamt" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
