import type { Upgrade, TemporaryEffect } from '../types/gameTypes'
import { decimal } from '../utils/decimal'
import { getGameMode } from '../stores/gameStore'

/**
 * Get cost multiplier based on game mode
 */
const getCostMultiplier = (testingValue: number, productionValue: number) => {
  return getGameMode() === 'testing' ? decimal(testingValue) : decimal(productionValue)
}

/**
 * Get cost value based on game mode
 */
const getCost = (testingValue: number, productionValue: number) => {
  return getGameMode() === 'testing' ? decimal(testingValue) : decimal(productionValue)
}

/**
 * Get unlock threshold based on game mode
 */
const getUnlockThreshold = (testingValue: number, productionValue: number) => {
  return getGameMode() === 'testing' ? testingValue : productionValue
}

/**
 * Get initial upgrades with current game mode values
 * This function is called each time to get fresh values based on current mode
 */
export const getInitialUpgrades = (): Upgrade[] => [
  // Double Tap
  {
    id: 'click-power-1',
    name: 'Double Tap',
    description: 'Doubles your click generation (+100% clicks per click)',
    baseCost: getCost(5, 100), // Testing: 5, Production: 100
    costMultiplier: getCostMultiplier(1.6, 2.0), // Testing: 1.6, Production: 2.0
    maxPurchases: 5,
    currentPurchases: 0,
    unlocked: true,
    unlockCondition: () => true,
    effect: {
      type: 'clickMultiplier',
      value: decimal(2),
      apply: (gameState) => {
        gameState.clickMultiplier = gameState.clickMultiplier.times(2)
      }
    }
  },
  
  // Better Content
  {
    id: 'base-value-1',
    name: 'Better Content',
    description: 'Increases base click value by +1',
    baseCost: getCost(10, 500), // Testing: 10, Production: 500
    costMultiplier: getCostMultiplier(1.7, 2.5), // Testing: 1.7, Production: 2.5
    maxPurchases: 10,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= getUnlockThreshold(5, 100), // Testing: 5, Production: 100
    effect: {
      type: 'special',
      value: decimal(1),
      apply: (gameState) => {
        gameState.baseClickValue = gameState.baseClickValue.plus(1)
      }
    }
  },
  
  // Rage Click
  {
    id: 'click-power-2',
    name: 'Rage Click',
    description: 'Quadruples your click generation (+300% clicks per click)',
    baseCost: getCost(50, 2500), // Testing: 50, Production: 2500
    costMultiplier: getCostMultiplier(2, 3.0), // Testing: 2, Production: 3.0
    maxPurchases: 3,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= getUnlockThreshold(25, 500), // Testing: 25, Production: 500
    effect: {
      type: 'clickMultiplier',
      value: decimal(4), // +300% means 4x total
      apply: (gameState) => {
        gameState.clickMultiplier = gameState.clickMultiplier.times(4)
      }
    }
  },
  
  // Viral Moment - Temporary boost
  {
    id: 'click-power-3',
    name: 'Viral Moment',
    description: 'Temporarily boosts clicks by 5× for 10 seconds',
    baseCost: getCost(250, 10000), // Testing: 250, Production: 10000
    costMultiplier: getCostMultiplier(3, 4.0), // Testing: 3, Production: 4.0
    maxPurchases: 2,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= getUnlockThreshold(100, 2000), // Testing: 100, Production: 2000
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
  }
]