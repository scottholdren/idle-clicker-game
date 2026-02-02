import React from 'react'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { calculateStrategyPointsMultiplier } from '../utils/decimal'
import Tooltip from './Tooltip'

interface EngagementMultiplierTooltipProps {
  children: React.ReactNode
}

export const EngagementMultiplierTooltip: React.FC<EngagementMultiplierTooltipProps> = ({ children }) => {
  const gameState = gameEngine.getGameState()
  
  // Calculate individual components
  const baseClickValue = gameState.baseClickValue
  const clickMultiplier = gameState.clickMultiplier
  const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
  
  // Calculate intermediate values
  const baseMultiplier = baseClickValue.times(clickMultiplier)
  const totalMultiplier = baseMultiplier.times(strategyBonus)
  
  const tooltipContent = (
    <div className="tooltip-content">
      <div className="tooltip-title">Click Multiplier Breakdown</div>
      
      <div className="tooltip-section">
        <div className="tooltip-breakdown">
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Base Click Value:</span>
            <span className="tooltip-breakdown-value">{formatNumber(baseClickValue)}</span>
          </div>
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Upgrade Multiplier:</span>
            <span className="tooltip-breakdown-value">x{formatNumber(clickMultiplier)}</span>
          </div>
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Strategy Points Bonus:</span>
            <span className="tooltip-breakdown-value">x{formatNumber(strategyBonus)}</span>
          </div>
        </div>
      </div>
      
      <div className="tooltip-section">
        <div className="tooltip-breakdown">
          <div className="tooltip-breakdown-item tooltip-total">
            <span className="tooltip-breakdown-label">Total per Click:</span>
            <span className="tooltip-breakdown-value">{formatNumber(totalMultiplier)}</span>
          </div>
        </div>
      </div>
      
      <div className="tooltip-section">
        <div className="tooltip-description">
          Each click generates this many clicks based on your upgrades and strategy points.
        </div>
      </div>
    </div>
  )

  return (
    <Tooltip content={tooltipContent} position="bottom" delay={100}>
      {children}
    </Tooltip>
  )
}

export default EngagementMultiplierTooltip