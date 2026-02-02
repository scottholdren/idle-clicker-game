import type { IdleGenerator, GameState, OfflineProgress } from '../types/gameTypes'
import { decimal, add, multiply, greaterThanOrEqual, ZERO } from '../utils/decimal'
import { INITIAL_IDLE_GENERATORS } from '../data/idleGenerators'

/**
 * Manages idle generation systems and offline progress
 */
export class IdleManager {
  /**
   * Initialize idle generators in the game state if not already present
   */
  public initializeGenerators(gameState: GameState): void {
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
   * Calculate total idle production per second
   */
  public calculateTotalProduction(gameState: GameState): import('decimal.js').default {
    let totalProduction = ZERO
    
    // Sum production from all generators
    for (const generator of gameState.idleGenerators) {
      if (generator.owned > 0) {
        const generatorProduction = multiply(
          generator.baseProduction,
          decimal(generator.owned)
        )
        totalProduction = add(totalProduction, generatorProduction)
      }
    }
    
    // Apply global idle multiplier
    totalProduction = multiply(totalProduction, gameState.idleMultiplier)
    
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
    const idleEarnings = multiply(totalProduction, decimal(effectiveHours * 3600))
    
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
      const multiplier = generator.costMultiplier.pow(currentOwned)
      const cost = multiply(generator.baseCost, multiplier)
      totalCost = add(totalCost, cost)
    }
    
    return totalCost
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