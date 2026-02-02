import React from 'react'
import type { Upgrade } from '../types/gameTypes'
import { useVisibleUpgrades, useCurrency } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { decimal, calculateStrategyPointsMultiplier } from '../utils/decimal'
import EngagementMultiplierTooltip from './EngagementMultiplierTooltip'

interface UpgradeItemProps {
  upgrade: Upgrade
  canAfford: boolean
  onPurchase: (upgradeId: string) => void
}

const UpgradeItem: React.FC<UpgradeItemProps> = ({ upgrade, canAfford, onPurchase }) => {
  const cost = gameEngine.getUpgradeCost(upgrade)
  const isMaxed = upgrade.currentPurchases >= upgrade.maxPurchases
  const maxAffordable = gameEngine.getMaxAffordableUpgrades(upgrade)
  
  // Calculate cumulative effect
  const cumulativeEffect = gameEngine.calculateUpgradeCumulativeEffect(upgrade)
  
  const handleMaxPurchase = () => {
    try {
      const purchased = gameEngine.purchaseMaxUpgrades(upgrade.id)
      console.log(`Purchased ${purchased} ${upgrade.name} upgrades`)
    } catch (error) {
      console.error('Error purchasing max upgrades:', error)
    }
  }
  
  return (
    <div className={`upgrade-item ${isMaxed ? 'maxed' : ''}`}>
      <div className="upgrade-header">
        <div className="upgrade-title-row">
          <h3 className="upgrade-name">{upgrade.name}</h3>
          {!isMaxed && (
            <div className="upgrade-buttons">
              <button 
                className={`upgrade-button-small ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                onClick={() => onPurchase(upgrade.id)}
                disabled={!canAfford}
              >
                Buy for {formatNumber(cost)} clicks
              </button>
              {maxAffordable > 1 && (
                <button 
                  className={`upgrade-button-small max-buy ${maxAffordable > 0 ? 'can-afford' : 'cannot-afford'}`}
                  onClick={handleMaxPurchase}
                  disabled={maxAffordable === 0}
                >
                  Max ({maxAffordable})
                </button>
              )}
            </div>
          )}
          {isMaxed && (
            <div className="upgrade-maxed-small">MAX</div>
          )}
        </div>
        <div className="upgrade-level">
          {upgrade.currentPurchases}/{upgrade.maxPurchases}
        </div>
      </div>
      
      <div className="upgrade-details-row">
        <p className="upgrade-description">{upgrade.description}</p>
        <div className="upgrade-stats">
          {upgrade.currentPurchases > 0 ? (
            <div className="upgrade-effect">
              {cumulativeEffect.type}: {
                cumulativeEffect.type.includes('Multiplier') ? 
                  `${formatNumber(cumulativeEffect.value)}x` :
                  `+${formatNumber(cumulativeEffect.value)}`
              }
            </div>
          ) : (
            <div className="upgrade-effect">
              Next: {upgrade.effect.type === 'clickMultiplier' ? 'Click x' : 
                     upgrade.effect.type === 'idleMultiplier' ? 'Idle x' : 
                     upgrade.effect.type === 'special' ? '+' : ''}
              {formatNumber(upgrade.effect.value)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const UpgradeList: React.FC = () => {
  const upgrades = useVisibleUpgrades()
  const currency = useCurrency()
  
  // Calculate total click multiplier (base × multiplier × strategy bonus)
  const gameState = gameEngine.getGameState()
  const baseClickMultiplier = gameState.baseClickValue.times(gameState.clickMultiplier)
  const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
  const totalClickMultiplier = baseClickMultiplier.times(strategyBonus)
  
  const handlePurchase = (upgradeId: string) => {
    try {
      gameEngine.purchaseUpgrade(upgradeId)
    } catch (error) {
      console.error('Error purchasing upgrade:', error)
    }
  }
  
  if (!upgrades || upgrades.length === 0) {
    return (
      <div className="upgrade-list empty">
        <p>No upgrades available yet. Keep generating clicks to unlock improvements!</p>
      </div>
    )
  }
  
  return (
    <div className="upgrade-list">
      <h2>
        Engagement Signals
        <EngagementMultiplierTooltip>
          <span className="section-summary"> ({formatNumber(totalClickMultiplier)} clicks per click)</span>
        </EngagementMultiplierTooltip>
      </h2>
      <div className="upgrade-grid">
        {upgrades.map(upgrade => {
          try {
            const cost = gameEngine.getUpgradeCost(upgrade)
            const canAfford = decimal(currency).greaterThanOrEqualTo(cost)
            
            return (
              <UpgradeItem
                key={upgrade.id}
                upgrade={upgrade}
                canAfford={canAfford}
                onPurchase={handlePurchase}
              />
            )
          } catch (error) {
            console.error(`Error rendering upgrade ${upgrade.id}:`, error)
            return null
          }
        })}
      </div>
    </div>
  )
}

export default UpgradeList