import React, { useState, useCallback, useRef, useEffect } from 'react'
import { gameEngine } from '../engine/gameEngine'
import { useCurrency, useTotalClicksPerSecond } from '../stores/gameStore'
import { useClickMultiplierEffects } from '../hooks/useTemporaryEffects'
import { TemporaryEffectProgressBar } from './TemporaryEffectProgressBar'
import { formatNumber } from '../utils/numberFormatter'
import { getRateColorClass, formatRate } from '../utils/rateColors'
import { decimal } from '../utils/decimal'

interface ClickButtonProps {
  className?: string
  disabled?: boolean
  showFloatingNumbers?: boolean
}

interface FloatingNumber {
  id: number
  value: string
  x: number
  y: number
  timestamp: number
}

/**
 * Modern analytics-style clickable card component
 */
export const ClickButton: React.FC<ClickButtonProps> = ({
  className = '',
  disabled = false,
  showFloatingNumbers = true,
}) => {
  const currency = useCurrency()
  const totalClicksPerSecond = useTotalClicksPerSecond()
  const activeClickEffects = useClickMultiplierEffects()
  const [isPressed, setIsPressed] = useState(false)
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([])
  const [clickValue, setClickValue] = useState(decimal(1))
  const buttonRef = useRef<HTMLDivElement>(null)
  const floatingIdRef = useRef(0)

  const hasActiveEffect = activeClickEffects.length > 0

  // Update click value when game state changes
  useEffect(() => {
    const state = gameEngine.getGameState()
    const baseValue = decimal(state.baseClickValue)
    const multiplier = decimal(state.clickMultiplier)
    const currentClickValue = baseValue.times(multiplier)
    setClickValue(currentClickValue)
  }, [currency])

  // Clean up old floating numbers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setFloatingNumbers(prev => 
        prev.filter(num => now - num.timestamp < 2000)
      )
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    const earnedValue = gameEngine.performClick()
    setClickValue(earnedValue)

    // Visual feedback
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    // Create floating number effect
    if (showFloatingNumbers && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const newFloatingNumber: FloatingNumber = {
        id: floatingIdRef.current++,
        value: `+${formatNumber(earnedValue)}`,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        timestamp: Date.now(),
      }
      
      setFloatingNumbers(prev => [...prev, newFloatingNumber])
    }
  }, [disabled, showFloatingNumbers])

  return (
    <div className="click-button-container">
      <div
        ref={buttonRef}
        className={`analytics-card ${className} ${isPressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''} ${hasActiveEffect ? 'has-effect' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Click to earn ${formatNumber(clickValue)} clicks`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
      >
        <div className="card-header">Clicks</div>
        <div className="card-value">{formatNumber(currency.floor())}</div>
        <div className={`card-footer ${getRateColorClass(totalClicksPerSecond)}`}>
          {formatRate(totalClicksPerSecond.floor(), formatNumber)}
        </div>
        
        {/* Progress bar for active temporary effects */}
        {hasActiveEffect && (
          <TemporaryEffectProgressBar effects={activeClickEffects} />
        )}
      </div>

      {/* Floating numbers */}
      {showFloatingNumbers && floatingNumbers.map(num => (
        <FloatingNumberComponent
          key={num.id}
          number={num}
        />
      ))}
    </div>
  )
}

/**
 * Floating number animation component
 */
const FloatingNumberComponent: React.FC<{ number: FloatingNumber }> = ({ number }) => {
  const [opacity, setOpacity] = useState(1)
  const [translateY, setTranslateY] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const duration = 2000

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setOpacity(1 - progress)
      setTranslateY(-50 * easeOut)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        left: `${number.x}px`,
        top: `${number.y}px`,
        color: '#10b981',
        fontWeight: 'bold',
        fontSize: '16px',
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${translateY}px)`,
        zIndex: 1000,
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      {number.value}
    </div>
  )
}

export default ClickButton