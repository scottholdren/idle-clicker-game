import type { Upgrade, GameState } from '../types/gameTypes'
import { decimal, greaterThanOrEqual, multiply } from '../utils/decimal'
import { getInitialUpgrades } from '../data/upgrades'

/**
 * Manages upgrade purchases, validation, and effects
 */
export class UpgradeManager {
  /**
   * Initialize upgrades in the game state if not already present
   * Also restores upgrade functions from original definitions when loading from save
   */
  public initializeUpgrades(gameState: GameState): void {
    const INITIAL_UPGRADES = getInitialUpgrades() // Get fresh values based on current mode
    
    if (gameState.upgrades.length === 0) {
      // First time initialization - create all upgrades from scratch
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
    } else {
      // Upgrades exist (loaded from save) - restore functions from original definitions
      for (const upgrade of gameState.upgrades) {
        const originalUpgrade = INITIAL_UPGRADES.find(orig => orig.id === upgrade.id)
        if (originalUpgrade) {
          // Restore the effect apply function
          upgrade.effect.apply = originalUpgrade.effect.apply
          // Restore the unlock condition function
          upgrade.unlockCondition = originalUpgrade.unlockCondition
        } else {
          console.warn(`Original upgrade definition not found for ${upgrade.id}`)
          // Provide fallback functions
          upgrade.effect.apply = () => {}
          upgrade.unlockCondition = () => true
        }
      }
    }
  }

  /**
   * Calculate cumulative effect for an upgrade based on current purchases
   */
  public calculateCumulativeEffect(upgrade: Upgrade): { type: string; value: import('decimal.js').default } {
    const purchases = upgrade.currentPurchases
    
    if (purchases === 0) {
      return { type: upgrade.effect.type, value: decimal(0) }
    }
    
    switch (upgrade.effect.type) {
      case 'clickMultiplier':
        // For multipliers, calculate total multiplier: base^purchases
        const totalMultiplier = decimal(upgrade.effect.value).pow(purchases)
        return { type: 'Total Click Multiplier', value: totalMultiplier }
        
      case 'idleMultiplier':
        // For idle multipliers, calculate total multiplier: base^purchases
        const totalIdleMultiplier = decimal(upgrade.effect.value).pow(purchases)
        return { type: 'Total Idle Multiplier', value: totalIdleMultiplier }
        
      case 'special':
        // For special effects (like base click value), it's additive
        const totalSpecial = decimal(upgrade.effect.value).times(purchases)
        return { type: 'Total Bonus', value: totalSpecial }
        
      default:
        return { type: upgrade.effect.type, value: decimal(upgrade.effect.value).times(purchases) }
    }
  }
  public refreshUpgrades(gameState: GameState): void {
    // Re-initialize upgrades to pick up new mode values
    gameState.upgrades = []
    this.initializeUpgrades(gameState)
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
    let cost: import('decimal.js').default
    
    if (upgrade.currentPurchases === 0) {
      cost = decimal(upgrade.baseCost)
    } else {
      // Exponential cost scaling: baseCost * (costMultiplier ^ currentPurchases)
      const multiplier = decimal(upgrade.costMultiplier).pow(upgrade.currentPurchases)
      cost = multiply(decimal(upgrade.baseCost), multiplier)
    }
    
    // Round up to nearest integer
    return cost.ceil()
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
        const effectValue = decimal(upgrade.effect.value).pow(upgrade.currentPurchases)
        totalEffect = totalEffect.times(effectValue)
      }
    }

    return totalEffect
  }

  /**
   * Calculate the maximum number of upgrades that can be purchased
   */
  public getMaxAffordableUpgrades(upgrade: Upgrade, gameState: GameState): number {
    if (!this.isUpgradeUnlocked(upgrade, gameState)) {
      return 0
    }

    const remainingPurchases = upgrade.maxPurchases - upgrade.currentPurchases
    if (remainingPurchases <= 0) {
      return 0
    }

    const currency = decimal(gameState.currency)
    let totalCost = decimal(0)
    let count = 0

    // Calculate how many we can afford by simulating purchases
    for (let i = 0; i < remainingPurchases; i++) {
      const currentPurchases = upgrade.currentPurchases + i
      const costMultiplier = decimal(upgrade.costMultiplier).pow(currentPurchases)
      const cost = multiply(decimal(upgrade.baseCost), costMultiplier).ceil()
      
      if (totalCost.plus(cost).lessThanOrEqualTo(currency)) {
        totalCost = totalCost.plus(cost)
        count++
      } else {
        break
      }
    }

    return count
  }

  /**
   * Purchase multiple upgrades at once
   */
  public purchaseMaxUpgrades(upgradeId: string, gameState: GameState): number {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId)
    
    if (!upgrade) {
      console.warn(`Upgrade not found: ${upgradeId}`)
      return 0
    }

    const maxAffordable = this.getMaxAffordableUpgrades(upgrade, gameState)
    if (maxAffordable === 0) {
      return 0
    }

    let totalCost = decimal(0)
    let purchasesMade = 0

    try {
      // Purchase as many as we can afford
      for (let i = 0; i < maxAffordable; i++) {
        const cost = this.getUpgradeCost(upgrade)
        
        if (gameState.currency.greaterThanOrEqualTo(cost)) {
          // Deduct cost
          gameState.currency = gameState.currency.minus(cost)
          totalCost = totalCost.plus(cost)
          
          // Apply upgrade effect
          upgrade.effect.apply(gameState)
          
          // Update upgrade state
          upgrade.currentPurchases++
          purchasesMade++
          
          // Mark as purchased if it's a one-time upgrade
          if (upgrade.maxPurchases === 1) {
            gameState.purchasedUpgrades.add(upgradeId)
          }
        } else {
          break
        }
      }

      // Update unlock status for this upgrade
      upgrade.unlocked = true

      // Check if any other upgrades should be unlocked
      this.updateUpgradeUnlocks(gameState)

      return purchasesMade
    } catch (error) {
      console.error(`Error purchasing max upgrades ${upgradeId}:`, error)
      return purchasesMade
    }
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