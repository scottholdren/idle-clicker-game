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
      case 1000: return 'Base Click 1K'
      case 10000: return 'Base Click 10K'
    }
  }
  
  const getTooltipText = () => {
    let next: BaseClickMode
    switch (currentBoost) {
      case 0: next = 10; break
      case 10: next = 100; break
      case 100: next = 1000; break
      case 1000: next = 10000; break
      case 10000: next = 0; break
    }
    const nextText = next === 1000 ? '1K' : next === 10000 ? '10K' : next.toString()
    const currentText = currentBoost === 1000 ? '1K' : currentBoost === 10000 ? '10K' : currentBoost.toString()
    return `Current: +${currentText} base clicks. Click to switch to +${nextText}.`
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