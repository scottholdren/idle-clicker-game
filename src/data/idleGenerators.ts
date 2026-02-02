import type { IdleGenerator } from '../types/gameTypes'
import { decimal } from '../utils/decimal'
import { getGameMode } from '../stores/gameStore'

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
 * Get initial idle generators with current game mode values
 * This function is called each time to get fresh values based on current mode
 */
export const getInitialIdleGenerators = (): IdleGenerator[] => [
  {
    id: 'bot',
    name: 'Click Bot',
    description: 'A simple bot that generates views automatically',
    baseProduction: decimal(0.5), // Same for both modes - 0.5 views per second
    baseCost: getCost(10, 100), // Testing: 10, Production: 100
    costMultiplier: decimal(1.1), // Same for both modes
    owned: 0,
    unlocked: true, // First generator is always unlocked
  },
  
  {
    id: 'script-farm',
    name: 'Script Farm',
    description: 'A collection of scripts generating engagement views',
    baseProduction: decimal(2), // Same for both modes - 2 views per second
    baseCost: getCost(50, 1000), // Testing: 50, Production: 1000
    costMultiplier: decimal(1.1), // Same for both modes
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(getUnlockThreshold(25, 500))), // Testing: 25, Production: 500
  }
]