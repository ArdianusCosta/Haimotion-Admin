'use client'

import { useEffect, useRef } from 'react'

export function useThemeSounds(themeMode: string) {
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass()
        }
      }
    }

    const withAudioContext = (callback: (ctx: AudioContext) => void) => {
      const ctx = audioCtxRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => callback(ctx)).catch(e => console.error(e))
      } else {
        callback(ctx)
      }
    }

    const playHackerTyping = () => withAudioContext((ctx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(120 + Math.random() * 40, ctx.currentTime)
      gain.gain.setValueAtTime(0.02, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    })

    const playHackerClick = () => withAudioContext((ctx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    })

    const playCewekTyping = () => withAudioContext((ctx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      // Cute bubble pop pitches
      const pitches = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      const pitch = pitches[Math.floor(Math.random() * pitches.length)]
      
      osc.frequency.setValueAtTime(pitch, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(pitch + 200, ctx.currentTime + 0.1)
      
      gain.gain.setValueAtTime(0.03, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    })

    const playCewekClick = () => withAudioContext((ctx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      
      // Happy ascending arpeggio effect
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.05) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1) // G5
      
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      initAudio()
      // Ignore modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return
      
      if (themeMode === 'hacker') playHackerTyping()
      else if (themeMode === 'cewek') playCewekTyping()
    }

    const handleClick = (e: MouseEvent) => {
      initAudio()
      const target = e.target as HTMLElement
      // Check if clicking an interactive element
      const isInteractive = target.closest('button') || target.closest('a') || target.closest('input') || target.closest('select') || target.closest('.cursor-pointer') || target.closest('[role="button"]') || target.closest('[role="menuitem"]')
      
      if (isInteractive) {
        if (themeMode === 'hacker') playHackerClick()
        else if (themeMode === 'cewek') playCewekClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClick)
    }
  }, [themeMode])
}
