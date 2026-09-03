'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, Command, Mail, AlertCircle } from 'lucide-react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        onLogin()
      } else {
        setError(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-6 sm:p-10 z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/25">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access your workspace</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500 animate-in slide-in-from-top-2 fade-in">
            <AlertCircle className="size-5 shrink-0" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70 mt-6 shadow-sm"
          >
            {isLoading ? (
              <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>Sign in <ArrowRight className="size-4" /></>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors shadow-sm">
            <Command className="size-4" /> Single Sign-On
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors shadow-sm">
            <Mail className="size-4" /> Google
          </button>
        </div>
      </div>
    </div>
  )
}
