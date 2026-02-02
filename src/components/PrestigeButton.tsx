import { useMemo } from 'react'
import { useGameStore, getGameMode } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { decimal } from '../utils/decimal'

export function PrestigeButton() {
  const gameState = useGameStore((state) => state.gameState)
  
  const prestigeInfo = useMemo(() => {
    const canPrestige = gameEngine.canPrestige()
    const prestigeGain = gameEngine.calculatePrestigeGain()
    const totalEarned = gameState.totalEarned
    const required = decimal(getGameMode() === 'testing' ? 1000 : 50000) // Dynamic threshold
    const remaining = required.minus(totalEarned)
    
    return {
      canPrestige,
      prestigeGain,
      totalEarned,
      required,
      remaining: remaining.greaterThan(0) ? remaining : decimal(0)
    }
  }, [gameState.totalEarned])
  
  const handlePrestige = () => {
    if (!prestigeInfo.canPrestige) return
    
    const confirmMessage = `Are you sure you want to Shift Strategy?\n\nThis will reset your progress but grant you ${formatNumber(prestigeInfo.prestigeGain)} strategy points for permanent bonuses.\n\nThis action cannot be undone.`
    
    if (window.confirm(confirmMessage)) {
      gameEngine.performPrestige()
    }
  }
  
  return (
    <div className="prestige-section">
      <div className="prestige-info">
        <div className="prestige-title">Strategy Shift</div>
        
        {prestigeInfo.canPrestige ? (
          <div className="prestige-ready">
            <div className="prestige-gain">
              Gain: {formatNumber(prestigeInfo.prestigeGain)} strategy points
            </div>
          </div>
        ) : (
          <div className="prestige-not-ready">
            <div className="prestige-requirement">
              Requirement: {formatNumber(prestigeInfo.required)} total clicks
            </div>
            <div className="prestige-progress">
              Progress: {formatNumber(prestigeInfo.totalEarned.floor())} / {formatNumber(prestigeInfo.required)}
            </div>
          </div>
        )}
      </div>
      
      <button 
        className={`prestige-button ${prestigeInfo.canPrestige ? 'prestige-available' : 'prestige-unavailable'}`}
        onClick={handlePrestige}
        disabled={!prestigeInfo.canPrestige}
      >
        Shift Strategy
      </button>
    </div>
  )
}