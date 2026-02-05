import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber, formatInteger, formatIntegerClean } from '../utils/numberFormatter'
import { decimal } from '../utils/decimal'

export function PrestigeButton() {
  const gameState = useGameStore((state) => state.gameState)
  
  const prestigeInfo = useMemo(() => {
    const canPrestige = gameEngine.canPrestige()
    const prestigeGain = gameEngine.calculatePrestigeGain()
    const totalEarned = gameState.totalEarned
    const required = decimal(50000) // Fixed at production value
    const remaining = required.minus(totalEarned)
    
    // Calculate progress to next strategy point
    const currentSP = prestigeGain
    const nextSP = currentSP.plus(1)
    // For power of 0.6: SP = (totalEarned / 50000)^0.6, so totalEarned = (SP^(1/0.6)) * 50000 = SP^1.667 * 50000
    const currentSPThreshold = currentSP.pow(1/0.6).times(50000) // currentSP^1.667 * 50000
    const nextSPThreshold = nextSP.pow(1/0.6).times(50000) // nextSP^1.667 * 50000
    const progressToNext = nextSPThreshold.minus(totalEarned)
    const progressBetween = totalEarned.minus(currentSPThreshold) // Progress since current SP
    const gapBetween = nextSPThreshold.minus(currentSPThreshold) // Gap between current and next SP
    const progressPercent = progressBetween.dividedBy(gapBetween).times(100)
    
    return {
      canPrestige,
      prestigeGain,
      totalEarned,
      required,
      remaining: remaining.greaterThan(0) ? remaining : decimal(0),
      nextSPThreshold,
      progressToNext: progressToNext.greaterThan(0) ? progressToNext : decimal(0),
      progressPercent: progressPercent.greaterThan(100) ? decimal(100) : progressPercent
    }
  }, [gameState.totalEarned])
  
  const handlePrestige = () => {
    if (!prestigeInfo.canPrestige) return
    
    const confirmMessage = `Are you sure you want to Shift Strategy?\n\nThis will reset your progress but grant you ${formatInteger(prestigeInfo.prestigeGain)} strategy points for permanent bonuses.\n\nThis action cannot be undone.`
    
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
              Gain: {formatInteger(prestigeInfo.prestigeGain)} strategy points
            </div>
            <div className="prestige-progress">
              {formatIntegerClean(prestigeInfo.progressToNext)} ({prestigeInfo.progressPercent.toFixed(0)}%) to next strategy point
            </div>
          </div>
        ) : (
          <div className="prestige-not-ready">
            <div className="prestige-requirement">
              Requirement: {formatIntegerClean(prestigeInfo.required)} total clicks
            </div>
            <div className="prestige-progress">
              Progress: {formatIntegerClean(prestigeInfo.totalEarned.floor())} / {formatIntegerClean(prestigeInfo.required)}
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