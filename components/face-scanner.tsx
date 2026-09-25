'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as faceapi from '@vladmandic/face-api'
import { Loader2, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FaceScannerProps {
  onFaceDetected: (descriptor: Float32Array) => void
  onCancel: () => void
  isProcessing?: boolean
}

export function FaceScanner({ onFaceDetected, onCancel, isProcessing = false }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isModelsLoaded, setIsModelsLoaded] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [statusText, setStatusText] = useState('Loading AI models...')
  
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ])
        setIsModelsLoaded(true)
        setStatusText('Requesting camera permission...')
      } catch (e) {
        console.error("Failed to load models:", e)
        setStatusText('Error loading models. Check console.')
      }
    }
    loadModels()
    
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (isModelsLoaded) {
      startCamera()
    }
  }, [isModelsLoaded])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setHasCameraPermission(true)
      setStatusText('Please face the camera directly...')
    } catch (e) {
      console.error("Camera error:", e)
      setHasCameraPermission(false)
      setStatusText('Camera access denied or unavailable.')
    }
  }

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    let isDetecting = false
    
    // Create interval to detect faces
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || isProcessing || isDetecting) return
      
      if (videoRef.current.readyState !== 4) return
      
      isDetecting = true
      try {
        const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
        const detections = await faceapi.detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor()
          
        if (detections) {
          // Draw to canvas for visual feedback
          const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight }
          faceapi.matchDimensions(canvasRef.current!, displaySize)
          const resizedDetections = faceapi.resizeResults(detections, displaySize)
          
          const ctx = canvasRef.current!.getContext('2d')
          ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          faceapi.draw.drawDetections(canvasRef.current!, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvasRef.current!, resizedDetections)

          // Return descriptor to parent
          if (!isProcessing) {
            setStatusText('Face detected! Verifying...')
            onFaceDetected(detections.descriptor)
          }
        } else {
          const ctx = canvasRef.current?.getContext('2d')
          if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
          if (!isProcessing) setStatusText('No face detected. Please look at the camera.')
        }
      } catch (err) {
        console.error('Face detection error:', err)
      } finally {
        isDetecting = false
      }
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-border">
        
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera className="size-4" /> AI Face Scan
          </h3>
          <button onClick={() => { stopCamera(); onCancel(); }} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {!isModelsLoaded || hasCameraPermission === false || isProcessing ? (
            <div className="flex flex-col items-center gap-3 text-white">
              {hasCameraPermission === false ? (
                <p className="text-red-400 text-sm">Camera access denied.</p>
              ) : (
                <>
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm">{statusText}</p>
                </>
              )}
            </div>
          ) : null}
          
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            onPlay={handleVideoPlay}
            className={`absolute inset-0 w-full h-full object-cover ${(isModelsLoaded && hasCameraPermission) ? 'opacity-100' : 'opacity-0'}`}
            style={{ transform: 'scaleX(-1)' }} // Mirror the camera
          />
          <canvas 
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${(isModelsLoaded && hasCameraPermission) ? 'opacity-100' : 'opacity-0'}`}
            style={{ transform: 'scaleX(-1)' }} // Mirror the drawing
          />
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-center font-medium text-muted-foreground">
            {isProcessing ? 'Processing...' : statusText}
          </p>
          <Button variant="outline" onClick={() => { stopCamera(); onCancel(); }} disabled={isProcessing} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
