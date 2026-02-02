import React from 'react'
import { useGameStore } from '../stores/gameStore'
import { formatNumber } from '../utils/numberFormatter'

export const TemporaryEffects: React.FC = () => {
  const temporaryEffects = useGameStore((state) => state.gameState.temporaryEffects)
  
  if (!temporaryEffects || temporaryEffects.length === 0) {
    return null
  }
  
  return (
    <div className="temporary-effects">
      {temporaryEffects.map(effect => {
        const now = Date.now()
        const elapsed = now - effect.startTime
        const remaining = Math.max(0, effect.duration - elapsed)
        const remainingSeconds = Math.ceil(remaining / 1000)
        
        return (
          <div key={effect.id} className="temporary-effect">
            <div className="effect-name">{effect.name}</div>
            <div className="effect-details">
              {effect.type === 'clickMultiplier' ? 'Click ×' : ''}
              {formatNumber(effect.value)} ({remainingSeconds}s)
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TemporaryEffects