import React from 'react'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { calculateStrategyPointsMultiplier, calculateViewToClickEfficiency, decimal } from '../utils/decimal'
import { useGenerators } from '../stores/gameStore'
import Tooltip from './Tooltip'

interface TrafficSourcesTooltipProps {
  children: React.ReactNode
}

export const TrafficSourcesTooltip: React.FC<TrafficSourcesTooltipProps> = ({ children }) => {
  const gameState = gameEngine.getGameState()
  const generators = useGenerators()
  
  // Calculate base views per second from generators
  let baseViewsPerSecond = decimal(0)
  for (const generator of generators) {
    if (generator.owned > 0) {
      const generatorProduction = decimal(generator.baseProduction).times(generator.owned)
      baseViewsPerSecond = baseViewsPerSecond.plus(generatorProduction)
    }
  }
  
  // Apply multipliers
  const idleMultiplier = gameState.idleMultiplier
  const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
  const engagementLevel = gameState.engagement
  
  // Calculate view-to-click efficiency based on total earned clicks, prestige multiplier, and engagement
  const efficiency = calculateViewToClickEfficiency(gameState.totalEarned, strategyBonus, engagementLevel)
  const efficiencyPercent = efficiency.times(100)
  const maxEfficiency = engagementLevel > 1 ? 100 : 50
  
  // Calculate intermediate values
  const viewsAfterMultiplier = baseViewsPerSecond.times(idleMultiplier)
  const viewsAfterStrategy = viewsAfterMultiplier.times(strategyBonus)
  const totalViewsPerSecond = viewsAfterStrategy.times(engagementLevel)
  const clicksPerSecond = totalViewsPerSecond.times(efficiency)
  
  const tooltipContent = (
    <div className="tooltip-content">
      <div className="tooltip-title">Traffic Sources Breakdown</div>
      
      <div className="tooltip-section">
        <div className="tooltip-breakdown">
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Base Views/sec:</span>
            <span className="tooltip-breakdown-value">{formatNumber(baseViewsPerSecond)}</span>
          </div>
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Idle Multiplier:</span>
            <span className="tooltip-breakdown-value">x{formatNumber(idleMultiplier)}</span>
          </div>
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Strategy Points Bonus:</span>
            <span className="tooltip-breakdown-value">x{formatNumber(strategyBonus)}</span>
          </div>
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Engagement Multiplier:</span>
            <span className="tooltip-breakdown-value">x{engagementLevel}</span>
          </div>
        </div>
      </div>
      
      <div className="tooltip-section">
        <div className="tooltip-breakdown">
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">Total Views/sec:</span>
            <span className="tooltip-breakdown-value">{formatNumber(totalViewsPerSecond)}</span>
          </div>
          <div className="tooltip-breakdown-item">
            <span className="tooltip-breakdown-label">View-to-Click Efficiency:</span>
            <span className="tooltip-breakdown-value">{formatNumber(efficiencyPercent)}%</span>
          </div>
          <div className="tooltip-breakdown-item tooltip-total">
            <span className="tooltip-breakdown-label">Clicks/sec:</span>
            <span className="tooltip-breakdown-value">{formatNumber(clicksPerSecond)}</span>
          </div>
        </div>
      </div>
      
      <div className="tooltip-section">
        <div className="tooltip-description">
          Traffic sources generate views passively. View-to-click efficiency improves by 0.1% per 1000 clicks (base: 10%, max: {maxEfficiency}%). Engagement affects both the rate of efficiency gain and the maximum cap.
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

export default TrafficSourcesTooltip