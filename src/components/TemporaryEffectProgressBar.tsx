import React, { useState, useEffect, useRef } from 'react'
import { formatNumber } from '../utils/numberFormatter'

/**
 * Reusable progress bar component for temporary effects
 */
interface TemporaryEffectProgressBarProps {
  effects: Array<{
    id: string
    name: string
    type: string
    value: any
    startTime: number
    duration: number
  }>
  className?: string
}

export const TemporaryEffectProgressBar: React.FC<TemporaryEffectProgressBarProps> = ({ 
  effects, 
  className = '' 
}) => {
  const [progress, setProgress] = useState(100)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentEffect, setCurrentEffect] = useState<any>(null)
  const animationRef = useRef<number>()
  
  // Store the effect when it first appears
  useEffect(() => {
    if (effects.length > 0 && !currentEffect) {
      setCurrentEffect(effects[0])
    }
  }, [effects, currentEffect])
  
  useEffect(() => {
    if (!currentEffect) return
    
    const updateProgress = () => {
      const now = Date.now()
      const elapsed = now - currentEffect.startTime
      const remaining = Math.max(0, currentEffect.duration - elapsed)
      // Progress represents time remaining (shrinks from left to right)
      const progressPercent = Math.max(0, (remaining / currentEffect.duration) * 100)
      
      setProgress(progressPercent)
      setTimeRemaining(Math.ceil(remaining / 1000))
      
      // Continue animation if there's time remaining
      if (remaining > 0) {
        animationRef.current = requestAnimationFrame(updateProgress)
      } else {
        // Ensure it goes to 0 when done and clear the effect
        setProgress(0)
        setTimeRemaining(0)
        setCurrentEffect(null)
      }
    }
    
    // Start the animation
    animationRef.current = requestAnimationFrame(updateProgress)
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [currentEffect])
  
  if (!currentEffect && effects.length === 0) return null
  
  const effect = currentEffect || effects[0]
  
  return (
    <div className={`effect-progress-bar ${className}`}>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-bar-text">
        {effect.name} ×{formatNumber(effect.value)} ({timeRemaining}s)
      </div>
    </div>
  )
}

export default TemporaryEffectProgressBar