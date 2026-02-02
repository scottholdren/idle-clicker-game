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
    baseCost: decimal(2500),
    costMultiplier: decimal(4.0),
    maxPurchases: 2,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(250)),
    effect: {
      type: 'special', // Special type for temporary effects
      value: decimal(5),
      apply: (gameState) => {
        // Create a temporary effect instead of permanent multiplier
        const temporaryEffect = {
          id: `viral-moment-${Date.now()}`,
          name: 'Viral Moment',
          type: 'clickMultiplier' as const,
          value: decimal(5),
          startTime: Date.now(),
          duration: 10000, // 10 seconds in milliseconds
          apply: (state) => {
            state.clickMultiplier = state.clickMultiplier.times(5)
          },
          remove: (state) => {
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
    baseCost: decimal(5000),
    costMultiplier: decimal(3.0),
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