import type { Upgrade } from '../types/gameTypes'
import { decimal } from '../utils/decimal'

/**
 * Initial upgrades available in the game
 * Fixed Decimal deserialization issues
 * Updated with low costs for quick testing of 4-tier currency system
 */
export const INITIAL_UPGRADES: Upgrade[] = [
  // Click Multiplier Upgrades - Low cost for testing
  {
    id: 'click-power-1',
    name: 'Double Tap',
    description: 'Doubles your click generation',
    baseCost: decimal(5), // Reduced from 10
    costMultiplier: decimal(1.5), // Reduced from 2
    maxPurchases: 10,
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
  
  {
    id: 'click-power-2',
    name: 'Rage Click',
    description: 'Triples your click generation through pure frustration',
    baseCost: decimal(25), // Reduced from 100
    costMultiplier: decimal(1.8), // Reduced from 2.5
    maxPurchases: 5,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= 10, // Reduced from 50
    effect: {
      type: 'clickMultiplier',
      value: decimal(3),
      apply: (gameState) => {
        gameState.clickMultiplier = gameState.clickMultiplier.times(3)
      }
    }
  },
  
  {
    id: 'click-power-3',
    name: 'Viral Moment',
    description: 'Multiplies your click generation by 5x',
    baseCost: decimal(100), // Reduced from 1000
    costMultiplier: decimal(2), // Reduced from 3
    maxPurchases: 3,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(50)), // Reduced from 500
    effect: {
      type: 'clickMultiplier',
      value: decimal(5),
      apply: (gameState) => {
        gameState.clickMultiplier = gameState.clickMultiplier.times(5)
      }
    }
  },
  
  // Base Click Value Upgrades - Low cost for testing
  {
    id: 'base-value-1',
    name: 'Better Content',
    description: 'Increases base click value by 1',
    baseCost: decimal(10), // Reduced from 25
    costMultiplier: decimal(1.5), // Reduced from 1.8
    maxPurchases: 20,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= 5, // Reduced from 25
    effect: {
      type: 'special',
      value: decimal(1),
      apply: (gameState) => {
        gameState.baseClickValue = gameState.baseClickValue.plus(1)
      }
    }
  },
  
  {
    id: 'base-value-2',
    name: 'Trending Topic',
    description: 'Increases base click value by 5',
    baseCost: decimal(50), // Reduced from 250
    costMultiplier: decimal(1.8), // Reduced from 2.2
    maxPurchases: 10,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(25)), // Reduced from 100
    effect: {
      type: 'special',
      value: decimal(5),
      apply: (gameState) => {
        gameState.baseClickValue = gameState.baseClickValue.plus(5)
      }
    }
  },
  
  // Idle Multiplier Upgrades (for later when idle system is implemented)
  {
    id: 'idle-boost-1',
    name: 'Background Process',
    description: 'Unlocks passive view generation (requires prestige)',
    baseCost: decimal(100), // Reduced from 500
    costMultiplier: decimal(1),
    maxPurchases: 1,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(75)), // Reduced from 1000
    effect: {
      type: 'idleMultiplier',
      value: decimal(1.5),
      apply: (gameState) => {
        gameState.idleMultiplier = gameState.idleMultiplier.times(1.5)
      }
    }
  },

  // New 4-tier currency system upgrades
  {
    id: 'view-converter-1',
    name: 'View Optimizer',
    description: 'Improves Views to Clicks conversion rate (10:1 → 8:1)',
    baseCost: decimal(200),
    costMultiplier: decimal(2),
    maxPurchases: 5,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.views).greaterThanOrEqualTo(decimal(100)),
    effect: {
      type: 'special',
      value: decimal(0.2), // 20% improvement per purchase
      apply: (gameState) => {
        // This will be handled in the conversion logic
      }
    }
  },

  {
    id: 'engagement-multiplier-1',
    name: 'Emotional Hook',
    description: 'Increases engagement multiplier by 0.5x',
    baseCost: decimal(500),
    costMultiplier: decimal(2.5),
    maxPurchases: 10,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(200)),
    effect: {
      type: 'special',
      value: decimal(0.5),
      apply: (gameState) => {
        gameState.engagement = gameState.engagement.plus(0.5)
      }
    }
  }
]