'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from './login-page'
import HaiMotionDashboard from './northstar-dashboard'
import { LanguageProvider } from './language-provider'
import { authClient } from '@/lib/auth/client'

export function AuthWrapper({ initialSection = 'Dashboard', slug, serverUser }: { initialSection?: string, slug?: string[], serverUser?: any }) {
  const { data: session, isPending } = authClient.useSession();
  const [mounted, setMounted] = useState(false)
  const [localUser, setLocalUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('auth_user')
    if (stored) {
      try {
        setLocalUser(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  if (!mounted || isPending) return null

  const activeUser = serverUser || session?.user || localUser;

  if (!activeUser) {
    return <LoginPage onLogin={() => {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        try {
          setLocalUser(JSON.parse(stored))
        } catch (e) {}
      }
      window.location.reload();
    }} />
  }

  return (
    <LanguageProvider>
      <HaiMotionDashboard initialSection={initialSection} user={activeUser} slug={slug} />
    </LanguageProvider>
  )
}
