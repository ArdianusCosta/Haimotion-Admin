import React, { useState } from 'react'
import { Globe, Search, Calendar, AlertCircle, CheckCircle2, Server, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DomainData {
  expiresAt?: string;
  createdAt?: string;
  registrar?: string;
  nameServers?: string[];
  status?: string;
  raw?: any;
}

export function ProjectDomainChecker({ defaultDomain = '' }: { defaultDomain?: string }) {
  const [domain, setDomain] = useState(defaultDomain)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DomainData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!domain) return;
    
    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      const response = await fetch(`/api/whois?domain=${encodeURIComponent(cleanDomain)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch domain info')
      }

      // Try to find expiration date from common WHOIS json keys
      const expiresAt = data.registryExpiryDate || 
                        data.registrarRegistrationExpirationDate ||
                        data.expires || 
                        data.expirationDate || 
                        null;
                        
      const createdAt = data.creationDate || 
                        data.created || 
                        data.registered || 
                        data.registrationTime || 
                        null;

      let registrar = data.registrar || data.sponsoringRegistrar || null;
      
      // Alias common registrars for Indonesian users
      if (registrar) {
        const rLow = registrar.toLowerCase();
        if (rLow.includes('neva angkasa') || rLow.includes('digital registra') || rLow.includes('karyacipta mandiri')) {
          registrar = 'Domainesia';
        } else if (rLow.includes('niagahoster') || rLow.includes('web media technology')) {
          registrar = 'Niagahoster';
        } else if (rLow.includes('rumahweb')) {
          registrar = 'Rumahweb';
        } else if (rLow.includes('idwebhost') || rLow.includes('jagoan')) {
          registrar = 'Jagoan Hosting / IDwebhost';
        }
      }

      let nameServers: string[] = [];
      if (data.nameServer) {
        if (Array.isArray(data.nameServer)) {
          nameServers = data.nameServer;
        } else if (typeof data.nameServer === 'string') {
          nameServers = data.nameServer.split(/[\s,]+/).filter(Boolean);
        }
      }

      setResult({
        expiresAt,
        createdAt,
        registrar,
        nameServers,
        raw: data
      })
      
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-semibold text-foreground"><Globe className="size-4" /> Domain Status & WHOIS</h2>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com atau example.id"
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
        </div>
        <Button onClick={handleCheck} disabled={isLoading || !domain} className="h-10 shrink-0 px-5">
          {isLoading ? <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Search className="mr-2 size-4" />}
          Check Domain
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="size-4" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-border bg-muted/20 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {result.createdAt && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="size-3.5" /> Registered On
                </p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(result.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
            
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="size-3.5" /> Expires On
              </p>
              {result.expiresAt ? (
                <p className="text-sm font-medium text-foreground">
                  {new Date(result.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle className="size-3.5" />
                  <span className="text-sm font-medium">Tidak Ditemukan</span>
                </div>
              )}
            </div>
            
            {result.registrar && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <CheckCircle2 className="size-3.5" /> Registrar
                </p>
                <p className="text-sm font-semibold text-primary">{result.registrar}</p>
              </div>
            )}
            
            {result.nameServers && result.nameServers.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Server className="size-3.5" /> Name Servers (Hosting)
                </p>
                <ul className="text-sm font-medium text-foreground space-y-1">
                  {result.nameServers.map((ns, idx) => (
                    <li key={idx} className="uppercase break-all line-clamp-1">{ns}</li>
                  ))}
                </ul>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  )
}
