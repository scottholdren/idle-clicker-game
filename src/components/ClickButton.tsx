import React, { useState, useCallback, useRef, useEffect } from 'react'
import { gameEngine } from '../engine/gameEngine'
import { useCurrency } from '../stores/gameStore'
import { formatNumber } from '../utils/numberFormatter'
import { decimal } from '../utils/decimal'

interface ClickButtonProps {
  className?: string
  disabled?: boolean
  showClickValue?: boolean
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
 * Main clickable button component
 */
export const ClickButton: React.FC<ClickButtonProps> = ({
  className = '',
  disabled = false,
  showClickValue = true,
  showFloatingNumbers = true,
}) => {
  const currency = useCurrency()
  const [isPressed, setIsPressed] = useState(false)
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([])
  const [clickValue, setClickValue] = useState(decimal(1))
  const buttonRef = useRef<HTMLButtonElement>(null)
  const floatingIdRef = useRef(0)

  // Update click value when game state changes
  useEffect(() => {
    const state = gameEngine.getGameState()
    const currentClickValue = state.baseClickValue.times(state.clickMultiplier)
    setClickValue(currentClickValue)
  }, [currency]) // Re-calculate when currency changes (indicating game state update)

  // Clean up old floating numbers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setFloatingNumbers(prev => 
        prev.filter(num => now - num.timestamp < 2000) // Remove after 2 seconds
      )
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // Perform the click in the game engine
    const earnedValue = gameEngine.performClick()
    
    // Update click value for display
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
        x: x + (Math.random() - 0.5) * 40, // Add some randomness
        y: y + (Math.random() - 0.5) * 20,
        timestamp: Date.now(),
      }
      
      setFloatingNumbers(prev => [...prev, newFloatingNumber])
    }
  }, [disabled, showFloatingNumbers])

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true)
    }
  }, [disabled])

  const handleMouseUp = useCallback(() => {
    setIsPressed(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false)
  }, [])

  return (
    <div className="click-button-container" style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        className={`click-button ${className} ${isPressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '4px solid #333',
          backgroundColor: isPressed ? '#4CAF50' : '#45a049',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.1s ease',
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          boxShadow: isPressed 
            ? 'inset 0 4px 8px rgba(0,0,0,0.3)' 
            : '0 4px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          userSelect: 'none',
          outline: 'none',
          position: 'relative',
          overflow: 'visible',
        }}
        aria-label={`Click to earn ${formatNumber(clickValue)} currency`}
      >
        <div style={{ fontSize: '24px' }}>💰</div>
        <div>CLICK</div>
        {showClickValue && (
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            +{formatNumber(clickValue)}
          </div>
        )}
      </button>

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
    // Start animation
    const startTime = Date.now()
    const duration = 2000 // 2 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out animation
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
        color: '#4CAF50',
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