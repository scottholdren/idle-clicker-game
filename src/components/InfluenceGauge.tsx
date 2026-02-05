import React, { useMemo } from 'react'
import { useInfluence, usePrestigePoints } from '../stores/gameStore'
import { formatInteger } from '../utils/numberFormatter'
import { decimal } from '../utils/decimal'
import { gameEngine } from '../engine/gameEngine'

export function InfluenceGauge() {
  const influence = useInfluence()
  const prestigePoints = usePrestigePoints()
  
  const unlockInfo = useMemo(() => {
    // Threshold for next influence: 100 × 2^current_influence
    const currentInfluence = influence.toNumber()
    const threshold = decimal(100).times(decimal(2).pow(currentInfluence))
    const canUnlock = prestigePoints.greaterThanOrEqualTo(threshold)
    
    return {
      threshold,
      canUnlock
    }
  }, [influence, prestigePoints])
  
  const handleUnlock = () => {
    if (!unlockInfo.canUnlock) return
    
    // Use game engine method for proper state management
    gameEngine.purchaseInfluence()
  }
  
  return (
    <div className="metric-card">
      <div className="card-header">Influence</div>
      <div className="card-value">{formatInteger(influence.floor())}</div>
      <div className="card-footer">
        <button 
          className={`buy-button-small ${unlockInfo.canUnlock ? 'can-afford' : 'cannot-afford'}`}
          onClick={handleUnlock}
          disabled={!unlockInfo.canUnlock}
          style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', minWidth: '60px' }}
        >
          Unlock at {formatInteger(unlockInfo.threshold)} SP
        </button>
      </div>
    </div>
  )
}