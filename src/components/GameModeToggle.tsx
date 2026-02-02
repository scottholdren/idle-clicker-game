import { useState } from 'react'
import { getBaseClickBoost, cycleBaseClickBoost, type BaseClickMode } from '../stores/gameStore'

export function BaseClickToggle() {
  const [currentBoost, setCurrentBoost] = useState<BaseClickMode>(getBaseClickBoost())
  
  const handleToggle = () => {
    const newBoost = cycleBaseClickBoost()
    setCurrentBoost(newBoost)
  }
  
  const getButtonText = () => {
    switch (currentBoost) {
      case 0: return 'Base Click 0'
      case 10: return 'Base Click 10'
      case 100: return 'Base Click 100'
    }
  }
  
  const getTooltipText = () => {
    const next = currentBoost === 0 ? 10 : currentBoost === 10 ? 100 : 0
    return `Current: +${currentBoost} base clicks. Click to switch to +${next}.`
  }
  
  return (
    <button 
      className="mode-toggle-button" 
      onClick={handleToggle}
      title={getTooltipText()}
    >
      {getButtonText()}
    </button>
  )
}