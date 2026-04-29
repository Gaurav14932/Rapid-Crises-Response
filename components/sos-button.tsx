'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SOSButtonProps {
  onActivate: () => void
  disabled?: boolean
}

export function SOSButton({ onActivate, disabled }: SOSButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [isPulsing, setIsPulsing] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPressed && !disabled) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            onActivate()
            setIsPressed(false)
            return 0
          }
          return prev + 5
        })
      }, 50)
    } else {
      setHoldProgress(0)
    }
    return () => clearInterval(interval)
  }, [isPressed, disabled, onActivate])

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulsing ring */}
      <div
        className={cn(
          'absolute h-56 w-56 rounded-full bg-emergency/20',
          isPulsing && !disabled && 'animate-ping'
        )}
      />
      <div
        className={cn(
          'absolute h-48 w-48 rounded-full bg-emergency/30',
          isPulsing && !disabled && 'animate-pulse'
        )}
      />
      
      {/* Progress ring */}
      <svg className="absolute h-52 w-52 -rotate-90">
        <circle
          cx="104"
          cy="104"
          r="96"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="104"
          cy="104"
          r="96"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-emergency transition-all duration-100"
          strokeDasharray={`${holdProgress * 6.03} 603`}
        />
      </svg>

      {/* Main button */}
      <button
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !disabled && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        disabled={disabled}
        className={cn(
          'relative z-10 flex h-40 w-40 flex-col items-center justify-center rounded-full',
          'bg-gradient-to-b from-emergency to-red-700',
          'text-emergency-foreground shadow-2xl',
          'transition-all duration-200',
          'border-4 border-emergency/50',
          isPressed && 'scale-95 shadow-inner',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'hover:shadow-emergency/40 hover:shadow-3xl cursor-pointer'
        )}
      >
        <span className="text-5xl font-black tracking-wider">SOS</span>
        <span className="mt-1 text-xs font-medium opacity-80">HOLD FOR 1 SEC</span>
      </button>
    </div>
  )
}
