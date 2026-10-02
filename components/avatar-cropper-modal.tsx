'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, RotateCcw, RotateCw, RefreshCw, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Crop, Sliders, Sun, Contrast, Palette, Circle,
  Square, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Focus,
  Sparkles, Check, Move, Eye, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AvatarCropperModalProps {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (croppedBlob: Blob) => void
  isUploading?: boolean
}

type CropShape = 'circle' | 'rounded' | 'square'
type TabType = 'crop' | 'filters' | 'adjust' | 'shape'

interface FilterPreset {
  name: string
  brightness: number
  contrast: number
  saturation: number
  sepia: number
  grayscale: number
}

const FILTER_PRESETS: FilterPreset[] = [
  { name: 'Normal', brightness: 0, contrast: 0, saturation: 100, sepia: 0, grayscale: 0 },
  { name: 'Vivid', brightness: 10, contrast: 20, saturation: 140, sepia: 0, grayscale: 0 },
  { name: 'B & W', brightness: 5, contrast: 25, saturation: 0, sepia: 0, grayscale: 100 },
  { name: 'Warm', brightness: 5, contrast: 10, saturation: 110, sepia: 30, grayscale: 0 },
  { name: 'Cool', brightness: 0, contrast: 15, saturation: 90, sepia: 0, grayscale: 0 },
  { name: 'Vintage', brightness: -5, contrast: 15, saturation: 80, sepia: 50, grayscale: 0 },
  { name: 'Cyberpunk', brightness: 15, contrast: 30, saturation: 160, sepia: 0, grayscale: 0 },
  { name: 'Soft Dark', brightness: -15, contrast: 20, saturation: 90, sepia: 10, grayscale: 0 },
]

export function AvatarCropperModal({ imageSrc, onCancel, onCropComplete, isUploading }: AvatarCropperModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('crop')

  // Transform States
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Adjustments & Filters
  const [selectedPreset, setSelectedPreset] = useState<string>('Normal')
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [blur, setBlur] = useState(0)
  const [hue, setHue] = useState(0)

  // Shape State
  const [cropShape, setCropShape] = useState<CropShape>('circle')

  // Preview & Canvas Refs
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Load Image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      imageRef.current = img
      handleResetAll()
    }
  }, [imageSrc])

  const handleResetAll = () => {
    setZoom(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setPosition({ x: 0, y: 0 })
    setSelectedPreset('Normal')
    setBrightness(0)
    setContrast(0)
    setSaturation(100)
    setBlur(0)
    setHue(0)
    setCropShape('circle')
  }

  const applyPreset = (preset: FilterPreset) => {
    setSelectedPreset(preset.name)
    setBrightness(preset.brightness)
    setContrast(preset.contrast)
    setSaturation(preset.saturation)
    setHue(0)
    setBlur(0)
  }

  // Draw & Generate Cropped Canvas Output
  const generateCroppedCanvas = useCallback((): HTMLCanvasElement | null => {
    const img = imageRef.current
    if (!img) return null

    const canvas = document.createElement('canvas')
    const cropSize = 400
    canvas.width = cropSize
    canvas.height = cropSize

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.clearRect(0, 0, cropSize, cropSize)

    ctx.save()
    if (cropShape === 'circle') {
      ctx.beginPath()
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2)
      ctx.clip()
    } else if (cropShape === 'rounded') {
      const r = 40
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(cropSize - r, 0)
      ctx.quadraticCurveTo(cropSize, 0, cropSize, r)
      ctx.lineTo(cropSize, cropSize - r)
      ctx.quadraticCurveTo(cropSize, cropSize, cropSize - r, cropSize)
      ctx.lineTo(r, cropSize)
      ctx.quadraticCurveTo(0, cropSize, 0, cropSize - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
      ctx.clip()
    }

    const bVal = 100 + brightness
    const cVal = 100 + contrast
    const sVal = saturation
    ctx.filter = `brightness(${bVal}%) contrast(${cVal}%) saturate(${sVal}%) hue-rotate(${hue}deg) blur(${blur}px)`

    ctx.translate(cropSize / 2, cropSize / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.scale(zoom, zoom)

    const baseScale = Math.max(cropSize / img.width, cropSize / img.height)
    const drawWidth = img.width * baseScale
    const drawHeight = img.height * baseScale

    const posX = (position.x / 256) * cropSize
    const posY = (position.y / 256) * cropSize

    ctx.drawImage(
      img,
      -drawWidth / 2 + posX,
      -drawHeight / 2 + posY,
      drawWidth,
      drawHeight
    )

    ctx.restore()
    return canvas
  }, [zoom, rotation, flipH, flipV, position, brightness, contrast, saturation, hue, blur, cropShape])

  const updatePreview = useCallback(() => {
    const canvas = generateCroppedCanvas()
    if (canvas) {
      setPreviewUrl(canvas.toDataURL('image/png'))
    }
  }, [generateCroppedCanvas])

  useEffect(() => {
    updatePreview()
  }, [zoom, rotation, flipH, flipV, position, brightness, contrast, saturation, hue, blur, cropShape, updatePreview])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.08 : -0.08
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 4))
  }

  const nudge = (dx: number, dy: number) => {
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  const handleSave = () => {
    const canvas = generateCroppedCanvas()
    if (!canvas) return
    canvas.toBlob(blob => {
      if (blob) {
        onCropComplete(blob)
      }
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[95vh] text-foreground">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-3.5 bg-muted/10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
              <Crop className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Studio Avatar Editor</h3>
              <p className="text-xs text-muted-foreground">Adjust position, lighting & live preview</p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Navigation (Equal-width Grid layout, no squishing) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 border-b border-border bg-muted/20 p-2.5">
          <button
            onClick={() => setActiveTab('crop')}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'crop' 
                ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Crop className="size-4" /> Transform
          </button>

          <button
            onClick={() => setActiveTab('filters')}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'filters' 
                ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Palette className="size-4" /> Filters
          </button>

          <button
            onClick={() => setActiveTab('adjust')}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'adjust' 
                ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Sliders className="size-4" /> Lighting
          </button>

          <button
            onClick={() => setActiveTab('shape')}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'shape' 
                ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            <Layers className="size-4" /> Shape
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-[380px]">
          
          {/* Left / Center Interactive Canvas (7 cols) */}
          <div className="md:col-span-7 relative flex flex-col items-center justify-center bg-[#0e0e11] overflow-hidden select-none border-b md:border-b-0 md:border-r border-border">
            
            {/* Cropper Canvas Container */}
            <div 
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="relative w-full h-full min-h-[320px] flex items-center justify-center cursor-move overflow-hidden"
              style={{
                backgroundImage: 'linear-gradient(45deg, #1b1b20 25%, transparent 25%), linear-gradient(-45deg, #1b1b20 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1b1b20 75%), linear-gradient(-45deg, transparent 75%, #1b1b20 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            >
              {/* Image Object */}
              {imageRef.current && (
                <div 
                  className="absolute pointer-events-none transition-transform duration-75 flex items-center justify-center"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${flipH ? -1 : 1 * zoom}, ${flipV ? -1 : 1 * zoom})`,
                    transformOrigin: 'center center',
                    filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`
                  }}
                >
                  <img 
                    src={imageSrc} 
                    alt="Crop target" 
                    className="max-w-none max-h-none object-contain"
                    style={{ width: '256px', height: '256px' }}
                  />
                </div>
              )}

              {/* Mask Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className={`size-64 border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    cropShape === 'circle' ? 'rounded-full' : cropShape === 'rounded' ? 'rounded-3xl' : 'rounded-none'
                  }`}
                >
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                    <div className="border-r border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-b border-white/60" />
                    <div className="border-r border-white/60" />
                    <div className="border-r border-white/60" />
                    <div />
                  </div>
                </div>
              </div>

              {/* Quick Zoom Bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs z-10 shadow-xl">
                <ZoomOut className="size-3.5 opacity-70 cursor-pointer" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} />
                <input 
                  type="range" 
                  min="0.5" 
                  max="4" 
                  step="0.05"
                  value={zoom}
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  className="w-24 accent-primary cursor-pointer h-1.5 rounded-lg"
                />
                <ZoomIn className="size-3.5 opacity-70 cursor-pointer" onClick={() => setZoom(z => Math.min(4, z + 0.2))} />
                <span className="text-[10px] w-8 text-right font-mono font-bold text-primary">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Right Controls Panel (5 cols) */}
          <div className="md:col-span-5 bg-card p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            
            {/* TAB 1: TRANSFORM */}
            {activeTab === 'crop' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Crop className="size-3.5" /> Rotation & Flip
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRotation(r => (r - 90) % 360)} className="text-xs h-8">
                    <RotateCcw className="mr-1.5 size-3.5" /> Rotate -90°
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRotation(r => (r + 90) % 360)} className="text-xs h-8">
                    <RotateCw className="mr-1.5 size-3.5" /> Rotate +90°
                  </Button>
                  <Button variant={flipH ? 'secondary' : 'outline'} size="sm" onClick={() => setFlipH(f => !f)} className="text-xs h-8">
                    <FlipHorizontal className="mr-1.5 size-3.5" /> Flip Horiz
                  </Button>
                  <Button variant={flipV ? 'secondary' : 'outline'} size="sm" onClick={() => setFlipV(f => !f)} className="text-xs h-8">
                    <FlipVertical className="mr-1.5 size-3.5" /> Flip Vert
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fine Angle</span>
                    <span className="font-mono text-primary font-semibold">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={e => setRotation(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Move className="size-3.5" /> Nudge Position
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <Button variant="outline" size="icon" className="size-7" onClick={() => nudge(0, -10)}>
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="size-7" onClick={() => nudge(-10, 0)}>
                        <ArrowLeft className="size-3.5" />
                      </Button>
                      <Button variant="secondary" size="icon" className="size-7" onClick={() => setPosition({ x: 0, y: 0 })}>
                        <Focus className="size-3.5" />
                      </Button>
                      <Button variant="outline" size="icon" className="size-7" onClick={() => nudge(10, 0)}>
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                    <Button variant="outline" size="icon" className="size-7" onClick={() => nudge(0, 10)}>
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FILTERS */}
            {activeTab === 'filters' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Palette className="size-3.5" /> Color Grading Presets
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all ${
                        selectedPreset === preset.name
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
                          : 'border-border bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span>{preset.name}</span>
                      {selectedPreset === preset.name && <Check className="size-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: LIGHTING */}
            {activeTab === 'adjust' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sliders className="size-3.5" /> Manual Adjustments
                </span>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Sun className="size-3.5" /> Brightness</span>
                    <span className="font-mono text-primary font-semibold">{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={brightness}
                    onChange={e => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Contrast className="size-3.5" /> Contrast</span>
                    <span className="font-mono text-primary font-semibold">{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={contrast}
                    onChange={e => setContrast(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Palette className="size-3.5" /> Saturation</span>
                    <span className="font-mono text-primary font-semibold">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={e => setSaturation(parseInt(e.target.value))}
                    className="w-full accent-primary h-1.5 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SHAPE */}
            {activeTab === 'shape' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5" /> Crop Frame Shape
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCropShape('circle')}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      cropShape === 'circle'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <Circle className="size-5" />
                    <span>Circle</span>
                  </button>

                  <button
                    onClick={() => setCropShape('rounded')}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      cropShape === 'rounded'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <div className="size-5 rounded-md border-2 border-current" />
                    <span>Rounded</span>
                  </button>

                  <button
                    onClick={() => setCropShape('square')}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      cropShape === 'square'
                        ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                        : 'border-border bg-card hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    <Square className="size-5" />
                    <span>Square</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIVE PREVIEWS */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Eye className="size-3" /> Live Previews
                </span>
                <button 
                  onClick={handleResetAll} 
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="size-3" /> Reset
                </button>
              </div>

              <div className="flex items-center justify-around bg-muted/20 p-2.5 rounded-xl border border-border/50">
                <div className="flex flex-col items-center gap-1">
                  <div className={`size-[64px] overflow-hidden border-2 border-border shadow-md bg-muted/30 flex items-center justify-center transition-all ${
                    cropShape === 'circle' ? 'rounded-full' : cropShape === 'rounded' ? 'rounded-xl' : 'rounded-none'
                  }`}>
                    {previewUrl ? <img src={previewUrl} alt="Preview 64" className="h-full w-full object-cover" /> : null}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">100px</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className={`size-[44px] overflow-hidden border border-border shadow-sm bg-muted/30 flex items-center justify-center transition-all ${
                    cropShape === 'circle' ? 'rounded-full' : cropShape === 'rounded' ? 'rounded-lg' : 'rounded-none'
                  }`}>
                    {previewUrl ? <img src={previewUrl} alt="Preview 44" className="h-full w-full object-cover" /> : null}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">48px</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className={`size-[28px] overflow-hidden border border-border bg-muted/30 flex items-center justify-center transition-all ${
                    cropShape === 'circle' ? 'rounded-full' : cropShape === 'rounded' ? 'rounded-md' : 'rounded-none'
                  }`}>
                    {previewUrl ? <img src={previewUrl} alt="Preview 28" className="h-full w-full object-cover" /> : null}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">32px</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/10">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Scroll mouse to zoom · Drag image to position
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isUploading} className="min-w-[130px] font-semibold">
              {isUploading ? (
                <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                'Crop & Save'
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
