import { usePrestigePoints } from '../stores/gameStore'
import { formatInteger, formatNumber } from '../utils/numberFormatter'
import { calculateStrategyPointsMultiplier } from '../utils/decimal'

export function StrategyPointsGauge() {
  const prestigePoints = usePrestigePoints()
  
  // Calculate the effect of current strategy points
  const multiplierBonus = calculateStrategyPointsMultiplier(prestigePoints)
  
  return (
    <div className="metric-card">
      <div className="card-header">Strategy Points</div>
      <div className="card-value">{formatInteger(prestigePoints)}</div>
      <div className="card-footer">
        {prestigePoints.greaterThan(0) ? (
          <span className="rate-positive">x{formatNumber(multiplierBonus)}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  )
}