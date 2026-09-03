'use client'

import { useState, useEffect } from 'react'
import { LoginPage } from './login-page'
import HaiMotionDashboard from './northstar-dashboard'
import { LanguageProvider } from './language-provider'

export function AuthWrapper({ initialSection = 'Dashboard' }: { initialSection?: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const savedState = localStorage.getItem('auth_state')
    const savedUser = localStorage.getItem('auth_user')
    if (savedState === 'true' && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        setIsAuthenticated(true)
      } catch(e) {}
    }
  }, [])

  const handleLogin = () => {
    const savedUser = localStorage.getItem('auth_user')
    if (savedUser) setUser(JSON.parse(savedUser))
    setIsAuthenticated(true)
    localStorage.setItem('auth_state', 'true')
  }

  // Optional: A way to handle logout, we can pass it down via context or props later if needed
  // For now, let's just implement the login wrapper

  if (!mounted) return null

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <LanguageProvider>
      <HaiMotionDashboard initialSection={initialSection} user={user} />
    </LanguageProvider>
  )
}
