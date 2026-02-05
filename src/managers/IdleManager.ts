import type { IdleGenerator, GameState, OfflineProgress } from '../types/gameTypes'
import { decimal, add, multiply, greaterThanOrEqual, calculateStrategyPointsMultiplier, ZERO } from '../utils/decimal'
import { getInitialIdleGenerators } from '../data/idleGenerators'

/**
 * Manages idle generation systems and offline progress
 */
export class IdleManager {
  /**
   * Initialize idle generators in the game state if not already present
   */
  public initializeGenerators(gameState: GameState): void {
    const INITIAL_IDLE_GENERATORS = getInitialIdleGenerators() // Get fresh values based on current mode
    
    if (gameState.idleGenerators.length === 0) {
      gameState.idleGenerators = INITIAL_IDLE_GENERATORS.map(generator => ({
        ...generator,
        // Ensure Decimal objects are properly created
        baseProduction: decimal(generator.baseProduction),
        baseCost: decimal(generator.baseCost),
        costMultiplier: decimal(generator.costMultiplier),
      }))
    }
  }

  /**
   * Refresh generators with current game mode values
   */
  public refreshGenerators(gameState: GameState): void {
    // Re-initialize generators to pick up new mode values
    gameState.idleGenerators = []
    this.initializeGenerators(gameState)
  }

  /**
   * Calculate total idle production per second
   */
  public calculateTotalProduction(gameState: GameState): import('decimal.js').default {
    let totalProduction = ZERO
    
    // Sum production from all generators
    for (const generator of gameState.idleGenerators) {
      if (generator.owned > 0) {
        const generatorProduction = multiply(
          decimal(generator.baseProduction),
          decimal(generator.owned)
        )
        
        totalProduction = add(totalProduction, generatorProduction)
      }
    }
    
    // Apply global idle multiplier
    totalProduction = multiply(totalProduction, decimal(gameState.idleMultiplier))
    
    return totalProduction
  }

  /**
   * Update idle progress for a given time period
   */
  public updateIdleProgress(gameState: GameState, deltaTimeSeconds: number): import('decimal.js').default {
    const totalProduction = this.calculateTotalProduction(gameState)
    
    if (totalProduction.equals(ZERO)) {
      return ZERO
    }
    
    // Calculate earnings for this time period
    const earnings = multiply(totalProduction, decimal(deltaTimeSeconds))
    
    return earnings
  }

  /**
   * Calculate offline progress when player returns
   */
  public calculateOfflineProgress(gameState: GameState, offlineTimeSeconds: number): OfflineProgress {
    const offlineHours = offlineTimeSeconds / 3600 // Convert seconds to hours
    
    // Apply offline time cap
    const cappedHours = Math.min(offlineHours, gameState.maxOfflineHours)
    const cappedByTime = offlineHours > gameState.maxOfflineHours
    
    // Apply offline efficiency rate (starts at 0%, unlocked via prestige)
    const effectiveHours = cappedHours * gameState.offlineProgressRate
    const cappedByEfficiency = gameState.offlineProgressRate < 1.0
    
    // Calculate idle earnings
    const totalProduction = this.calculateTotalProduction(gameState)
    let idleEarnings = multiply(totalProduction, decimal(effectiveHours * 3600))
    
    // Apply strategy points bonus to offline idle earnings
    const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
    idleEarnings = multiply(idleEarnings, strategyBonus)
    
    // No automation earnings for now (will be added when automation system is implemented)
    const automationEarnings = ZERO
    
    // Total currency earned
    const currencyEarned = add(idleEarnings, automationEarnings)
    
    return {
      timeOffline: offlineTimeSeconds,
      currencyEarned,
      clicksSimulated: 0, // No automated clicks from idle system
      idleEarnings,
      automationEarnings,
      cappedByTime,
      cappedByEfficiency,
    }
  }

  /**
   * Check if player can afford a generator purchase
   */
  public canAffordGenerator(generator: IdleGenerator, gameState: GameState, amount: number = 1): boolean {
    if (!generator.unlocked) {
      return false
    }
    
    const cost = this.getGeneratorCost(generator, amount)
    return greaterThanOrEqual(gameState.currency, cost)
  }

  /**
   * Calculate the cost of purchasing generators
   */
  public getGeneratorCost(generator: IdleGenerator, amount: number = 1): import('decimal.js').default {
    let totalCost = ZERO
    
    for (let i = 0; i < amount; i++) {
      const currentOwned = generator.owned + i
      const multiplier = decimal(generator.costMultiplier).pow(currentOwned)
      const cost = multiply(decimal(generator.baseCost), multiplier)
      totalCost = add(totalCost, cost)
    }
    
    // Round up to nearest integer
    return totalCost.ceil()
  }

  /**
   * Purchase idle generators
   */
  public purchaseGenerator(generatorId: string, gameState: GameState, amount: number = 1): boolean {
    const generator = gameState.idleGenerators.find(g => g.id === generatorId)
    
    if (!generator) {
      console.warn(`Generator not found: ${generatorId}`)
      return false
    }

    if (!this.canAffordGenerator(generator, gameState, amount)) {
      return false
    }
    
    const cost = this.getGeneratorCost(generator, amount)
    
    try {
      // Deduct cost
      gameState.currency = gameState.currency.minus(cost)
      
      // Add generators
      generator.owned += amount
      
      return true
    } catch (error) {
      console.error(`Error purchasing generator ${generatorId}:`, error)
      return false
    }
  }

  /**
   * Get generator by ID
   */
  public getGenerator(generatorId: string, gameState: GameState): IdleGenerator | undefined {
    return gameState.idleGenerators.find(g => g.id === generatorId)
  }

  /**
   * Get all unlocked generators
   */
  public getUnlockedGenerators(gameState: GameState): IdleGenerator[] {
    return gameState.idleGenerators.filter(g => g.unlocked)
  }

  /**
   * Update generator unlock conditions
   */
  public updateGeneratorUnlocks(gameState: GameState): void {
    for (const generator of gameState.idleGenerators) {
      if (!generator.unlocked && generator.unlockCondition) {
        try {
          const shouldUnlock = generator.unlockCondition(gameState)
          if (shouldUnlock) {
            console.log(`Unlocking generator: ${generator.name} (totalEarned: ${gameState.totalEarned.toString()})`)
            generator.unlocked = true
          }
        } catch (error) {
          console.warn(`Error checking unlock condition for generator ${generator.id}:`, error)
        }
      }
    }
  }

  /**
   * Calculate the maximum number of generators that can be purchased
   */
  public getMaxAffordableGenerators(generator: IdleGenerator, gameState: GameState): number {
    if (!generator.unlocked) {
      return 0
    }

    const currency = decimal(gameState.currency)
    let totalCost = decimal(0)
    let count = 0

    // Calculate how many we can afford by simulating purchases
    for (let i = 0; i < 1000; i++) { // Cap at 1000 to prevent infinite loops
      const currentOwned = generator.owned + i
      const costMultiplier = decimal(generator.costMultiplier).pow(currentOwned)
      const cost = multiply(decimal(generator.baseCost), costMultiplier).ceil()
      
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
   * Purchase maximum affordable generators
   */
  public purchaseMaxGenerators(generatorId: string, gameState: GameState): number {
    const generator = gameState.idleGenerators.find(g => g.id === generatorId)
    
    if (!generator) {
      console.warn(`Generator not found: ${generatorId}`)
      return 0
    }

    const maxAffordable = this.getMaxAffordableGenerators(generator, gameState)
    if (maxAffordable === 0) {
      return 0
    }

    try {
      const totalCost = this.getGeneratorCost(generator, maxAffordable)
      
      // Deduct cost
      gameState.currency = gameState.currency.minus(totalCost)
      
      // Add generators
      generator.owned += maxAffordable
      
      // Update unlock status
      generator.unlocked = true
      
      // Check if any other generators should be unlocked
      this.updateGeneratorUnlocks(gameState)
      
      return maxAffordable
    } catch (error) {
      console.error(`Error purchasing max generators ${generatorId}:`, error)
      return 0
    }
  }

  /**
   * Reset generators (for prestige)
   */
  public resetGenerators(gameState: GameState): void {
    for (const generator of gameState.idleGenerators) {
      generator.owned = 0
      // Keep unlock status for generators that should remain unlocked
      if (generator.unlockCondition) {
        generator.unlocked = generator.unlockCondition(gameState)
      }
    }
  }
}