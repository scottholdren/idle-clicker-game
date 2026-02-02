import { useState } from 'react'
import { getGameMode, setGameMode, type GameMode } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'

export function GameModeToggle() {
  const [currentMode, setCurrentMode] = useState<GameMode>(getGameMode())
  
  const handleToggle = () => {
    const newMode: GameMode = currentMode === 'testing' ? 'production' : 'testing'
    setGameMode(newMode)
    setCurrentMode(newMode)
    
    // Refresh game data with new mode values
    gameEngine.refreshGameMode()
    
    // Show confirmation message
    const modeText = newMode === 'testing' ? 'Testing (low costs)' : 'Production (realistic costs)'
    alert(`Switched to ${modeText} mode.\n\nGame data has been refreshed with new values.`)
  }
  
  return (
    <button 
      className="mode-toggle-button" 
      onClick={handleToggle}
      title={`Current mode: ${currentMode}. Click to switch to ${currentMode === 'testing' ? 'production' : 'testing'} mode.`}
    >
      {currentMode === 'testing' ? 'Testing' : 'Production'}
    </button>
  )
}