import type { IdleGenerator } from '../types/gameTypes'
import { decimal } from '../utils/decimal'

/**
 * Initial idle generators available in the game
 * Note: Idle progression starts at 0% efficiency until unlocked via prestige
 * Updated with low costs for quick testing of 4-tier currency system
 */
export const INITIAL_IDLE_GENERATORS: IdleGenerator[] = [
  {
    id: 'bot',
    name: 'Click Bot',
    description: 'A simple bot that generates views automatically',
    baseProduction: decimal(0.5), // 0.5 views per second (increased from 0.1)
    baseCost: decimal(10), // Reduced from 15
    costMultiplier: decimal(1.1), // Reduced from 1.15
    owned: 0,
    unlocked: true, // First generator is always unlocked
  },
  
  {
    id: 'script-farm',
    name: 'Script Farm',
    description: 'A collection of scripts generating engagement views',
    baseProduction: decimal(2), // 2 views per second (increased from 1)
    baseCost: decimal(50), // Reduced from 100
    costMultiplier: decimal(1.1), // Reduced from 1.15
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(25)), // Low unlock requirement
  },
  
  {
    id: 'botnet',
    name: 'Botnet',
    description: 'A network of compromised devices working for you',
    baseProduction: decimal(10), // 10 views per second (increased from 8)
    baseCost: decimal(200), // Reduced from 1100
    costMultiplier: decimal(1.1), // Reduced from 1.15
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(100)), // Low unlock requirement
  },
  
  {
    id: 'ai-farm',
    name: 'AI Content Farm',
    description: 'AI-generated content that hooks users automatically',
    baseProduction: decimal(50), // 50 views per second (increased from 47)
    baseCost: decimal(1000), // Reduced from 12000
    costMultiplier: decimal(1.1), // Reduced from 1.15
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(500)), // Low unlock requirement
  },
  
  {
    id: 'algorithm',
    name: 'Recommendation Algorithm',
    description: 'Sophisticated algorithm that maximizes engagement',
    baseProduction: decimal(200), // 200 views per second (reduced from 260)
    baseCost: decimal(5000), // Reduced from 130000
    costMultiplier: decimal(1.1), // Reduced from 1.15
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(2000)), // Low unlock requirement
  },
  
  {
    id: 'platform',
    name: 'Social Platform',
    description: 'Your own platform that harvests attention at scale',
    baseProduction: decimal(1000), // 1000 views per second (reduced from 1400)
    baseCost: decimal(25000), // Reduced from 1400000
    costMultiplier: decimal(1.1), // Reduced from 1.15
    owned: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(10000)), // Low unlock requirement
  },
]