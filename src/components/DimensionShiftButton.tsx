import { gameEngine } from '../engine/gameEngine'
import { useEngagement, useGameState } from '../stores/gameStore'
import './DimensionShiftButton.css'

export function DimensionShiftButton() {
  const engagement = useEngagement()
  const gameState = useGameState()
  const currentDimension = gameState.currentDimension
  
  const canShiftToDim2 = gameEngine.canShiftToDimension2()
  
  const handleShiftToDim2 = () => {
    if (window.confirm('Shift to Dimension 2: Influence?\n\nThis will reset all Dimension 1 progress except Engagement.\n\nYou can return to Dimension 1 later, but it will also be reset.')) {
      gameEngine.shiftToDimension2()
    }
  }
  
  const handleReturnToDim1 = () => {
    if (window.confirm('Return to Dimension 1: Content?\n\nThis will reset your current dimension progress.\n\nEngagement will be preserved.')) {
      gameEngine.returnToDimension1()
    }
  }
  
  // Show shift to Dim 2 button when in Dim 1 and engagement > 1
  if (currentDimension === 1 && canShiftToDim2) {
    return (
      <button 
        className="dimension-shift-button dimension-shift-available"
        onClick={handleShiftToDim2}
      >
        <div className="dimension-shift-title">Dimension 2 Unlocked!</div>
        <div className="dimension-shift-subtitle">Shift to Influence</div>
      </button>
    )
  }
  
  // Show return to Dim 1 button when in Dim 2
  if (currentDimension === 2) {
    return (
      <button 
        className="dimension-shift-button dimension-return"
        onClick={handleReturnToDim1}
      >
        <div className="dimension-shift-title">Return to Dimension 1</div>
        <div className="dimension-shift-subtitle">Content (Engagement: x{engagement})</div>
      </button>
    )
  }
  
  // Show locked state when in Dim 1 but engagement = 1
  if (currentDimension === 1 && engagement === 1) {
    return (
      <div className="dimension-shift-button dimension-shift-locked">
        <div className="dimension-shift-title">Dimension 2 Locked</div>
        <div className="dimension-shift-subtitle">Upgrade Engagement to unlock</div>
      </div>
    )
  }
  
  return null
}
