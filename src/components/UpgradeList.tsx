import React from 'react'
import type { Upgrade } from '../types/gameTypes'
import { useVisibleUpgrades, useCurrency } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber, formatInteger } from '../utils/numberFormatter'
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
                className={`buy-button-small ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                onClick={() => onPurchase(upgrade.id)}
                disabled={!canAfford}
              >
                Buy for {formatInteger(cost)} clicks
              </button>
              {maxAffordable > 1 && (
                <button 
                  className={`buy-button-small max-buy ${maxAffordable > 0 ? 'can-afford' : 'cannot-afford'}`}
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
          {formatInteger(upgrade.currentPurchases)}/{formatInteger(upgrade.maxPurchases)}
        </div>
      </div>
      
      <div className="upgrade-details-row">
        <p className="upgrade-description">{upgrade.description}</p>
        <div className="upgrade-stats">
          {upgrade.currentPurchases > 0 ? (
            <div className="upgrade-effect">
              <span style={{ color: '#888888' }}>Level: </span>
              <span style={{ color: '#4caf50' }}>
                {cumulativeEffect.type.includes('Multiplier') ? 
                  `x${formatInteger(cumulativeEffect.value)}` :
                  `+${formatInteger(cumulativeEffect.value)}`}
              </span>
            </div>
          ) : (
            <div className="upgrade-effect" style={{ color: '#888888' }}>
              Level: {upgrade.effect.type === 'clickMultiplier' ? 'x1' : 
                      upgrade.effect.type === 'idleMultiplier' ? 'x1' : 
                      upgrade.effect.type === 'special' ? '+0' : 
                      '+0'}
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
  
  return (
    <div className="upgrade-list">
      <h2>
        Engagement Signals
        <EngagementMultiplierTooltip>
          <span className="section-summary"> ({formatNumber(totalClickMultiplier)} {totalClickMultiplier.equals(1) ? 'click' : 'clicks'} per click)</span>
        </EngagementMultiplierTooltip>
      </h2>
      {(!upgrades || upgrades.length === 0) ? (
        <div className="upgrade-grid">
          <p style={{ textAlign: 'center' }}>None available - Keep clicking to unlock them!</p>
        </div>
      ) : (
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
      )}
    </div>
  )
}

export default UpgradeList