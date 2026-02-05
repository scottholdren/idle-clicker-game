import type { Upgrade, TemporaryEffect } from '../types/gameTypes'
import { decimal } from '../utils/decimal'

/**
 * Get initial upgrades - all using production values
 * This function is called each time to get fresh values
 */
export const getInitialUpgrades = (): Upgrade[] => [
  // Better Content - First upgrade, unlocked from start
  {
    id: 'base-value-1',
    name: 'Better Content',
    description: 'Increases base click value by +1 and traffic generation by +10%',
    baseCost: decimal(200),
    costMultiplier: decimal(1.5),
    maxPurchases: 10,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(100)),
    effect: {
      type: 'special',
      value: decimal(1),
      apply: (gameState) => {
        // Increase base click value
        gameState.baseClickValue = gameState.baseClickValue.plus(1)
        
        // Increase idle multiplier by 10% (1.1x per level)
        gameState.idleMultiplier = gameState.idleMultiplier.times(1.1)
      }
    }
  },
  
  // Viral Moment - Second upgrade, temporary boost
  {
    id: 'click-power-3',
    name: 'Viral Moment',
    description: 'Temporarily boosts clicks by 5× for 10 seconds',
    baseCost: decimal(800),
    costMultiplier: decimal(2.0),
    maxPurchases: 2,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(250)),
    effect: {
      type: 'special', // Special type for temporary effects
      value: decimal(5),
      apply: (gameState) => {
        // Get simulation speed (default to 1 if not set)
        const simulationSpeed = gameState.simulationSpeed || 1
        
        // Adjust duration based on simulation speed
        // At 100x speed, 10 seconds of game time = 100ms of real time
        const adjustedDuration = 10000 / simulationSpeed
        
        // Create a temporary effect instead of permanent multiplier
        const temporaryEffect = {
          id: `viral-moment-${Date.now()}`,
          name: 'Viral Moment',
          type: 'clickMultiplier' as const,
          value: decimal(5),
          startTime: Date.now(),
          duration: adjustedDuration,
          apply: (state: any) => {
            state.clickMultiplier = state.clickMultiplier.times(5)
          },
          remove: (state: any) => {
            state.clickMultiplier = state.clickMultiplier.dividedBy(5)
          }
        }
        
        // Add the temporary effect to the game state
        gameState.temporaryEffects.push(temporaryEffect)
        
        // Apply the effect immediately
        temporaryEffect.apply(gameState)
      }
    }
  },
  
  // Double Tap - Third upgrade, expensive permanent multiplier
  {
    id: 'click-power-1',
    name: 'Double Tap',
    description: 'Doubles your click generation (+100% clicks per click)',
    baseCost: decimal(1200),
    costMultiplier: decimal(2.0),
    maxPurchases: 3,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(2000)),
    effect: {
      type: 'clickMultiplier',
      value: decimal(2),
      apply: (gameState) => {
        gameState.clickMultiplier = gameState.clickMultiplier.times(2)
      }
    }
  }
]