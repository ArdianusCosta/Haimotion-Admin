import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth/client'
import { Fingerprint, Trash2, Plus, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export function SecuritySettings() {
  const { t } = useLanguage()
  const { data: passkeys, isPending: isLoading, error: fetchError, refetch } = authClient.useListPasskeys()
  const [isAdding, setIsAdding] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [error, setError] = useState('')

  const fetchPasskeys = () => {
    refetch()
  }

  const handleAddPasskey = async () => {
    if (!deviceName.trim()) {
      setError(t('Please enter a device name.'))
      return
    }
    setIsAdding(true)
    setError('')
    try {
      const { data, error: authError } = await authClient.passkey.addPasskey({
        name: deviceName
      })
      if (authError) {
        setError(authError.message || t('Failed to add passkey'))
      } else {
        setDeviceName('')
        fetchPasskeys()
      }
    } catch (err) {
      setError(t('Network error or cancelled.'))
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeletePasskey = async (id: string) => {
    try {
      await authClient.passkey.deletePasskey({
        id
      })
      fetchPasskeys()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold">{t('Security Settings')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Manage your authentication methods and passkeys.')}</p>
      </div>
      <div className="p-5 space-y-6">
        <div>
          <h3 className="mb-4 text-sm font-medium flex items-center gap-2"><Fingerprint className="size-4" /> {t('Passkeys (WebAuthn)')}</h3>
          
          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
              <AlertCircle className="size-4 shrink-0" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t('Loading passkeys...')}</p>
            ) : !passkeys || passkeys.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">{t('No passkeys registered yet.')}</p>
            ) : (
              <ul className="space-y-2">
                {passkeys?.map((pk: any) => (
                  <li key={pk.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{pk.name || t('Unknown Device')}</span>
                      <span className="text-xs text-muted-foreground">{t('Added: ')}{pk.createdAt ? new Date(pk.createdAt).toLocaleDateString() : t('Unknown')}</span>
                    </div>
                    <button onClick={() => handleDeletePasskey(pk.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium text-foreground">{t('Add New Passkey (e.g. My MacBook)')}</label>
              <input 
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
                placeholder={t('Device Name')} 
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50" 
              />
            </div>
            <button 
              onClick={handleAddPasskey}
              disabled={isAdding}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="size-4" />
              {isAdding ? t('Adding...') : t('Add Passkey')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
