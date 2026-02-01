import React from 'react'
import type { Upgrade } from '../types/gameTypes'
import { useVisibleUpgrades, useCurrency } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { decimal } from '../utils/decimal'

interface UpgradeItemProps {
  upgrade: Upgrade
  canAfford: boolean
  onPurchase: (upgradeId: string) => void
}

const UpgradeItem: React.FC<UpgradeItemProps> = ({ upgrade, canAfford, onPurchase }) => {
  const cost = gameEngine.getUpgradeCost(upgrade)
  const isMaxed = upgrade.currentPurchases >= upgrade.maxPurchases
  
  return (
    <div className={`upgrade-item ${canAfford && !isMaxed ? 'affordable' : 'unaffordable'} ${isMaxed ? 'maxed' : ''}`}>
      <div className="upgrade-header">
        <h3 className="upgrade-name">{upgrade.name}</h3>
        <div className="upgrade-level">
          {upgrade.currentPurchases}/{upgrade.maxPurchases}
        </div>
      </div>
      
      <p className="upgrade-description">{upgrade.description}</p>
      
      <div className="upgrade-details">
        <div className="upgrade-effect">
          Effect: {upgrade.effect.type === 'clickMultiplier' ? 'Click x' : 
                   upgrade.effect.type === 'idleMultiplier' ? 'Idle x' : 
                   upgrade.effect.type === 'special' ? '+' : ''}
          {formatNumber(upgrade.effect.value)}
        </div>
        
        {!isMaxed && (
          <div className="upgrade-cost">
            Cost: {formatNumber(cost)}
          </div>
        )}
      </div>
      
      {!isMaxed && (
        <button 
          className={`upgrade-button ${canAfford ? 'can-afford' : 'cannot-afford'}`}
          onClick={() => onPurchase(upgrade.id)}
          disabled={!canAfford}
        >
          {canAfford ? 'Purchase' : 'Cannot Afford'}
        </button>
      )}
      
      {isMaxed && (
        <div className="upgrade-maxed">MAXED</div>
      )}
    </div>
  )
}

export const UpgradeList: React.FC = () => {
  const upgrades = useVisibleUpgrades()
  const currency = useCurrency()
  
  const handlePurchase = (upgradeId: string) => {
    gameEngine.purchaseUpgrade(upgradeId)
  }
  
  if (upgrades.length === 0) {
    return (
      <div className="upgrade-list empty">
        <p>No upgrades available yet. Keep clicking to unlock upgrades!</p>
      </div>
    )
  }
  
  return (
    <div className="upgrade-list">
      <h2>Upgrades</h2>
      <div className="upgrade-grid">
        {upgrades.map(upgrade => {
          const cost = gameEngine.getUpgradeCost(upgrade)
          const canAfford = decimal(currency).greaterThanOrEqual(cost)
          
          return (
            <UpgradeItem
              key={upgrade.id}
              upgrade={upgrade}
              canAfford={canAfford}
              onPurchase={handlePurchase}
            />
          )
        })}
      </div>
    </div>
  )
}

export default UpgradeList