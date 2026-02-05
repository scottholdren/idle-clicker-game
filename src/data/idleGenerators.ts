import type { IdleGenerator } from '../types/gameTypes'
import { decimal } from '../utils/decimal'

/**
 * Get initial idle generators - all using production values
 * This function is called each time to get fresh values
 */
export const getInitialIdleGenerators = (): IdleGenerator[] => [
  {
    id: 'bot',
    name: 'Click Bot',
    description: 'A simple bot that generates views automatically',
    baseProduction: decimal(1), // 1 views per second
    baseCost: decimal(100),
    costMultiplier: decimal(1.1),
    owned: 0,
    unlocked: true, // First generator is always unlocked
  },
  
  {
    id: 'script-farm',
    name: 'Script Farm',
    description: 'A collection of scripts generating engagement views',
    baseProduction: decimal(20), // 20 views per second
    baseCost: decimal(1000),
    costMultiplier: decimal(1.1),
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(500)),
  },
  
  {
    id: 'recommendation-engine',
    name: 'Recommendation Engine',
    description: 'Algorithmic content recommendations that scale with strategy',
    baseProduction: decimal(100), // 100 views per second base
    baseCost: decimal(50000),
    costMultiplier: decimal(1.15),
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.prestigePoints).greaterThan(decimal(0)),
  }
]