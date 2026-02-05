import Decimal from 'decimal.js'
import type { GameState, IdleGenerator, Upgrade } from '../types/gameTypes'
import { decimal } from '../utils/decimal'

/**
 * Purchase decision with efficiency score
 */
export interface PurchaseDecision {
  type: 'generator' | 'upgrade' | 'none'
  id?: string
  name?: string
  amount?: number
  cost?: Decimal
  efficiency?: number
  reason?: string
}

/**
 * Strategy for optimal bot gameplay
 */
export class BotStrategy {
  private recentClickRate: number = 0 // Actual clicks per second observed
  
  /**
   * Update the observed click rate (called by bot during gameplay)
   */
  updateClickRate(clicksPerSecond: number): void {
    this.recentClickRate = clicksPerSecond
  }
  
  /**
   * Get the current click rate for efficiency calculations
   * Falls back to a conservative estimate if no data available
   */
  private getClicksPerSecond(): number {
    // If we have observed data, use it
    if (this.recentClickRate > 0) {
      return this.recentClickRate
    }
    // Otherwise, use a conservative estimate (1 click per second)
    return 1
  }
  
  /**
   * Decide the next optimal purchase
   */
  decideNextPurchase(gameState: GameState): PurchaseDecision {
    const decisions: PurchaseDecision[] = []

    // Evaluate generators
    for (const generator of gameState.idleGenerators) {
      if (!generator.unlocked) {
        continue
      }
      
      const decision = this.evaluateGenerator(generator, gameState)
      // Add all decisions with valid efficiency, regardless of affordability
      if (decision.efficiency !== undefined && decision.efficiency > 0) {
        decisions.push(decision)
      }
    }

    // Evaluate upgrades
    for (const upgrade of gameState.upgrades) {
      if (!upgrade.unlocked || upgrade.maxPurchases !== undefined && upgrade.currentPurchases >= upgrade.maxPurchases) {
        continue
      }
      
      const decision = this.evaluateUpgrade(upgrade, gameState)
      if (decision.efficiency !== undefined && decision.efficiency > 0) {
        decisions.push(decision)
      }
    }

    // Sort by efficiency (higher is better)
    decisions.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))

    // Filter for affordable options only
    const affordableDecisions = decisions.filter(d => d.type !== 'none')

    // Smart purchase logic: save up for better options
    if (decisions.length > 0 && affordableDecisions.length > 0) {
      const bestOption = decisions[0]
      const bestAffordable = affordableDecisions[0]
      
      // If best option is affordable, buy it
      if (bestOption.type !== 'none') {
        return bestOption
      }
      
      // If best option is unaffordable, only buy affordable option if it's "good enough"
      // "Good enough" = at least 50% of the best option's efficiency
      const efficiencyThreshold = 0.5
      const bestEfficiency = bestOption.efficiency || 0
      const affordableEfficiency = bestAffordable.efficiency || 0
      
      if (affordableEfficiency >= bestEfficiency * efficiencyThreshold) {
        return bestAffordable
      }
      
      // Otherwise, save up for the better option
      return { type: 'none', reason: `Saving for ${bestOption.name}` }
    }

    // Return best affordable decision or none
    return affordableDecisions.length > 0 ? affordableDecisions[0] : { type: 'none', reason: 'No affordable purchases' }
  }

  /**
   * Evaluate generator purchase efficiency using payback time
   * Efficiency = 1 / payback_time (higher is better)
   * Payback time = cost / (gain in clicks per second)
   */
  private evaluateGenerator(generator: IdleGenerator, gameState: GameState): PurchaseDecision {
    const cost = this.calculateGeneratorCost(generator)
    
    // Calculate production gain (views per second)
    let productionGain = decimal(generator.baseProduction)
    
    // Apply multipliers to get actual production value
    productionGain = productionGain.times(gameState.idleMultiplier)
    
    // Convert views/sec to clicks/sec (assuming 1 view = 1 click for now)
    const clicksPerSecondGain = productionGain.toNumber()
    
    // Payback time in seconds
    const paybackTime = cost.dividedBy(clicksPerSecondGain).toNumber()
    
    // Efficiency = 1 / payback time (so lower payback = higher efficiency)
    const efficiency = 1 / paybackTime
    
    // Check affordability
    const canAfford = gameState.currency.greaterThanOrEqualTo(cost)
    
    if (!canAfford) {
      return { 
        type: 'none',
        name: generator.name,
        efficiency,
        cost,
        reason: `Need ${cost.toFixed(0)} clicks`
      }
    }

    return {
      type: 'generator',
      id: generator.id,
      name: generator.name,
      amount: 1,
      cost,
      efficiency,
      reason: `${productionGain.toFixed(2)} clicks/s, ${paybackTime.toFixed(1)}s payback`
    }
  }

  /**
   * Evaluate upgrade purchase efficiency
   */
  private evaluateUpgrade(upgrade: Upgrade, gameState: GameState): PurchaseDecision {
    const cost = this.calculateUpgradeCost(upgrade)
    
    const canAfford = gameState.currency.greaterThanOrEqualTo(cost)

    // Estimate value based on upgrade type
    let valueEstimate = 0
    
    if (upgrade.effect.type === 'clickMultiplier') {
      // Click multipliers increase clicks per click
      const multiplierGain = decimal(upgrade.effect.value).toNumber()
      const currentClickValue = gameState.baseClickValue.times(gameState.clickMultiplier).toNumber()
      
      // Extra clicks per click
      const extraValuePerClick = currentClickValue * (multiplierGain - 1)
      
      // Use actual clicks per second based on observed rate
      const clicksPerSecond = this.getClicksPerSecond()
      
      // Gain in clicks/sec (this is what we'll earn extra)
      valueEstimate = extraValuePerClick * clicksPerSecond
    } else if (upgrade.effect.type === 'idleMultiplier') {
      // Idle multipliers scale with current idle production
      const multiplierGain = decimal(upgrade.effect.value).toNumber()
      const currentIdleProduction = this.estimateIdleProduction(gameState)
      valueEstimate = currentIdleProduction * multiplierGain
    } else if (upgrade.effect.type === 'special') {
      // Special upgrades need custom evaluation
      if (upgrade.id === 'base-value-1') {
        // Better Content: +1 base click value + 10% idle multiplier
        // Value = click value increase + idle production increase
        
        // Click value increase: +1 per click
        const clickValueIncrease = 1 * gameState.clickMultiplier.toNumber()
        
        // Idle multiplier increase: 10% of current idle production
        const currentIdleProduction = this.estimateIdleProduction(gameState)
        const idleProductionIncrease = currentIdleProduction * 0.1
        
        // Combined value (weighted by usage)
        // Use actual clicks per second based on observed rate
        const clicksPerSecond = this.getClicksPerSecond()
        const clickValuePerSecond = clickValueIncrease * clicksPerSecond
        
        valueEstimate = clickValuePerSecond + idleProductionIncrease
      } else if (upgrade.id === 'click-power-3') {
        // Viral Moment: 5x click multiplier for 10 seconds (temporary)
        // This is a one-time boost, so we need to amortize it
        
        const currentClickValue = gameState.baseClickValue.times(gameState.clickMultiplier).toNumber()
        const boostMultiplier = 5
        const boostDuration = 10 // seconds
        const clicksPerSecond = this.getClicksPerSecond()
        
        // Total extra clicks gained during boost (4x extra, since 5x - 1x = 4x)
        const extraClicksGained = currentClickValue * (boostMultiplier - 1) * clicksPerSecond * boostDuration
        
        // Amortize over expected time to use it (assume we use it within 60 seconds)
        // This makes it comparable to permanent upgrades on a per-second basis
        const amortizationPeriod = 60 // seconds
        valueEstimate = extraClicksGained / amortizationPeriod
      }
    } else if (upgrade.effect.target) {
      // Targeted effects (e.g., generator boosts)
      const targetGenerator = gameState.idleGenerators.find(g => g.id === upgrade.effect.target)
      if (targetGenerator && targetGenerator.owned > 0) {
        const multiplierGain = decimal(upgrade.effect.value).toNumber()
        const generatorProduction = decimal(targetGenerator.baseProduction).times(targetGenerator.owned).toNumber()
        valueEstimate = generatorProduction * multiplierGain
      }
    }

    // Efficiency: gain per second / cost = 1 / payback_time
    const efficiency = valueEstimate / cost.toNumber()

    if (!canAfford) {
      return { 
        type: 'none',
        name: upgrade.name,
        efficiency,
        reason: `Need ${cost.toFixed(0)} clicks`
      }
    }

    return {
      type: 'upgrade',
      id: upgrade.id,
      name: upgrade.name,
      amount: 1,
      cost,
      efficiency,
      reason: `Est. value ${valueEstimate.toFixed(2)}/s for ${cost.toFixed(0)} clicks`
    }
  }

  /**
   * Calculate generator cost
   */
  private calculateGeneratorCost(generator: IdleGenerator): Decimal {
    const multiplier = decimal(generator.costMultiplier).pow(generator.owned)
    return decimal(generator.baseCost).times(multiplier).ceil()
  }

  /**
   * Calculate upgrade cost
   */
  private calculateUpgradeCost(upgrade: Upgrade): Decimal {
    const multiplier = decimal(upgrade.costMultiplier).pow(upgrade.currentPurchases)
    return decimal(upgrade.baseCost).times(multiplier).ceil()
  }

  /**
   * Estimate current idle production
   */
  private estimateIdleProduction(gameState: GameState): number {
    let total = 0
    for (const generator of gameState.idleGenerators) {
      if (generator.owned > 0) {
        let production = decimal(generator.baseProduction).times(generator.owned)
        total += production.toNumber()
      }
    }
    return total * gameState.idleMultiplier.toNumber()
  }

  /**
   * Determine if prestige is beneficial
   * Prestige when SP gain is at least 25% of current SP (or at least 1 SP if starting from 0)
   */
  shouldPrestige(gameState: GameState, currentPrestigeDuration: number): boolean {
    // Calculate potential SP gain
    const threshold = 50000
    const potentialGain = gameState.totalEarned.dividedBy(threshold).pow(0.6).floor()
    
    // Must be able to gain at least 1 SP
    if (potentialGain.lessThanOrEqualTo(0)) {
      return false
    }

    // Calculate gain as percentage of current SP
    const currentSP = gameState.prestigePoints
    const gainPercent = potentialGain.dividedBy(currentSP.plus(1)).toNumber()
    
    // Prestige when gain is at least 25% of current SP
    return gainPercent >= 0.25
  }

  /**
   * Determine if we should spend clicks in passive mode
   * Returns number of clicks to perform
   */
  shouldClickInPassiveMode(gameState: GameState, clicksAvailable: number): number {
    // Early game: use all clicks to bootstrap
    if (gameState.idleGenerators.every(g => g.owned === 0)) {
      return clicksAvailable
    }

    // If we can afford something valuable, use clicks
    const decision = this.decideNextPurchase(gameState)
    if (decision.type !== 'none' && decision.cost) {
      const clickValue = gameState.baseClickValue.times(gameState.clickMultiplier)
      const clicksNeeded = decision.cost.dividedBy(clickValue).ceil().toNumber()
      
      // Use up to available clicks to reach the purchase
      return Math.min(clicksAvailable, clicksNeeded)
    }

    // Otherwise, save clicks for later
    return 0
  }
}
