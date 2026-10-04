'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App-level error:', error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4 py-8">
      <div className="flex max-w-[420px] flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight">Terjadi Kesalahan</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Sistem mengalami kegagalan saat memuat halaman atau data. Detail: {error.message || 'Unknown error occurred'}. 
          Silakan muat ulang halaman ini.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={() => reset()} className="w-full sm:w-auto flex items-center gap-2">
            <RefreshCcw className="size-4" />
            Coba Lagi
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full sm:w-auto">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  )
}
