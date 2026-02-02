import { usePrestigePoints } from '../stores/gameStore'
import { formatNumber } from '../utils/numberFormatter'
import { calculateStrategyPointsMultiplier } from '../utils/decimal'

export function StrategyPointsGauge() {
  const prestigePoints = usePrestigePoints()
  
  // Calculate the effect of current strategy points
  const multiplierBonus = calculateStrategyPointsMultiplier(prestigePoints)
  const bonusPercentage = prestigePoints.times(10) // 10% per point
  
  return (
    <div className="metric-card">
      <div className="card-header">Strategy Points</div>
      <div className="card-value">{formatNumber(prestigePoints)}</div>
      <div className="card-footer">
        {prestigePoints.greaterThan(0) ? (
          <span className="rate-positive">+{formatNumber(bonusPercentage)}% bonus</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  )
}