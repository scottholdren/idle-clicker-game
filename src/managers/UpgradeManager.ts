import type { Upgrade, GameState } from '../types/gameTypes'
import { decimal, greaterThanOrEqual, multiply } from '../utils/decimal'
import { INITIAL_UPGRADES } from '../data/upgrades'

/**
 * Manages upgrade purchases, validation, and effects
 */
export class UpgradeManager {
  /**
   * Initialize upgrades in the game state if not already present
   */
  public initializeUpgrades(gameState: GameState): void {
    if (gameState.upgrades.length === 0) {
      gameState.upgrades = INITIAL_UPGRADES.map(upgrade => ({
        ...upgrade,
        // Ensure Decimal objects are properly created
        baseCost: decimal(upgrade.baseCost),
        costMultiplier: decimal(upgrade.costMultiplier),
        effect: {
          ...upgrade.effect,
          value: decimal(upgrade.effect.value),
        }
      }))
    }
  }

  /**
   * Get all available upgrades (unlocked and affordable)
   */
  public getAvailableUpgrades(gameState: GameState): Upgrade[] {
    return gameState.upgrades.filter(upgrade => 
      this.isUpgradeUnlocked(upgrade, gameState) && 
      this.canAffordUpgrade(upgrade, gameState) &&
      upgrade.currentPurchases < upgrade.maxPurchases
    )
  }

  /**
   * Get all visible upgrades (unlocked but may not be affordable)
   */
  public getVisibleUpgrades(gameState: GameState): Upgrade[] {
    return gameState.upgrades.filter(upgrade => 
      this.isUpgradeUnlocked(upgrade, gameState)
    )
  }

  /**
   * Check if an upgrade is unlocked
   */
  public isUpgradeUnlocked(upgrade: Upgrade, gameState: GameState): boolean {
    if (!upgrade.unlocked) {
      // Check unlock condition
      if (upgrade.unlockCondition) {
        try {
          return upgrade.unlockCondition(gameState)
        } catch (error) {
          console.warn(`Error checking unlock condition for upgrade ${upgrade.id}:`, error)
          return false
        }
      }
      return false
    }
    return true
  }

  /**
   * Check if player can afford an upgrade
   */
  public canAffordUpgrade(upgrade: Upgrade, gameState: GameState): boolean {
    if (upgrade.currentPurchases >= upgrade.maxPurchases) {
      return false
    }

    // Check if upgrade is unlocked
    if (!this.isUpgradeUnlocked(upgrade, gameState)) {
      return false
    }

    const cost = this.getUpgradeCost(upgrade)
    return greaterThanOrEqual(gameState.currency, cost)
  }

  /**
   * Calculate the current cost of an upgrade
   */
  public getUpgradeCost(upgrade: Upgrade): import('decimal.js').default {
    if (upgrade.currentPurchases === 0) {
      return upgrade.baseCost
    }

    // Exponential cost scaling: baseCost * (costMultiplier ^ currentPurchases)
    const multiplier = upgrade.costMultiplier.pow(upgrade.currentPurchases)
    return multiply(upgrade.baseCost, multiplier)
  }

  /**
   * Purchase an upgrade
   */
  public purchaseUpgrade(upgradeId: string, gameState: GameState): boolean {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId)
    
    if (!upgrade) {
      console.warn(`Upgrade not found: ${upgradeId}`)
      return false
    }

    if (!this.canAffordUpgrade(upgrade, gameState)) {
      return false
    }

    const cost = this.getUpgradeCost(upgrade)

    try {
      // Deduct cost
      gameState.currency = gameState.currency.minus(cost)
      
      // Apply upgrade effect
      upgrade.effect.apply(gameState)
      
      // Update upgrade state
      upgrade.currentPurchases++
      
      // Mark as purchased if it's a one-time upgrade
      if (upgrade.maxPurchases === 1) {
        gameState.purchasedUpgrades.add(upgradeId)
      }

      // Update unlock status for this upgrade
      upgrade.unlocked = true

      // Check if any other upgrades should be unlocked
      this.updateUpgradeUnlocks(gameState)

      return true
    } catch (error) {
      console.error(`Error purchasing upgrade ${upgradeId}:`, error)
      return false
    }
  }

  /**
   * Update unlock status for all upgrades
   */
  public updateUpgradeUnlocks(gameState: GameState): void {
    for (const upgrade of gameState.upgrades) {
      if (!upgrade.unlocked && upgrade.unlockCondition) {
        try {
          upgrade.unlocked = upgrade.unlockCondition(gameState)
        } catch (error) {
          console.warn(`Error checking unlock condition for upgrade ${upgrade.id}:`, error)
        }
      }
    }
  }

  /**
   * Get upgrade by ID
   */
  public getUpgrade(upgradeId: string, gameState: GameState): Upgrade | undefined {
    return gameState.upgrades.find(u => u.id === upgradeId)
  }

  /**
   * Get upgrades by type
   */
  public getUpgradesByType(type: string, gameState: GameState): Upgrade[] {
    return gameState.upgrades.filter(u => u.effect.type === type)
  }

  /**
   * Calculate total effect of all purchased upgrades of a specific type
   */
  public getTotalEffectByType(type: string, gameState: GameState): import('decimal.js').default {
    const upgrades = this.getUpgradesByType(type, gameState)
    let totalEffect = decimal(1)

    for (const upgrade of upgrades) {
      if (upgrade.currentPurchases > 0) {
        // For multiplicative effects, multiply the effect by the number of purchases
        const effectValue = upgrade.effect.value.pow(upgrade.currentPurchases)
        totalEffect = totalEffect.times(effectValue)
      }
    }

    return totalEffect
  }

  /**
   * Reset all upgrades (for prestige)
   */
  public resetUpgrades(gameState: GameState): void {
    for (const upgrade of gameState.upgrades) {
      upgrade.currentPurchases = 0
      // Keep unlock status for upgrades that should remain unlocked
      // Reset unlock status and let the unlock condition determine it
      if (upgrade.unlockCondition) {
        upgrade.unlocked = upgrade.unlockCondition(gameState)
      } else {
        upgrade.unlocked = false
      }
    }
    gameState.purchasedUpgrades.clear()
  }
}