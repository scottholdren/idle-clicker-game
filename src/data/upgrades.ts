import type { Upgrade } from '../types/gameTypes'
import { decimal } from '../utils/decimal'

/**
 * Initial upgrades available in the game
 * Fixed Decimal deserialization issues
 */
export const INITIAL_UPGRADES: Upgrade[] = [
  // Click Multiplier Upgrades
  {
    id: 'click-power-1',
    name: 'Better Clicking',
    description: 'Doubles your click power',
    baseCost: decimal(10),
    costMultiplier: decimal(2),
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
    name: 'Super Clicking',
    description: 'Triples your click power',
    baseCost: decimal(100),
    costMultiplier: decimal(2.5),
    maxPurchases: 5,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= 50,
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
    name: 'Mega Clicking',
    description: 'Multiplies your click power by 5',
    baseCost: decimal(1000),
    costMultiplier: decimal(3),
    maxPurchases: 3,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(500)),
    effect: {
      type: 'clickMultiplier',
      value: decimal(5),
      apply: (gameState) => {
        gameState.clickMultiplier = gameState.clickMultiplier.times(5)
      }
    }
  },
  
  // Base Click Value Upgrades
  {
    id: 'base-value-1',
    name: 'Stronger Fingers',
    description: 'Increases base click value by 1',
    baseCost: decimal(25),
    costMultiplier: decimal(1.8),
    maxPurchases: 20,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => gameState.totalClicks >= 25,
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
    name: 'Power Gloves',
    description: 'Increases base click value by 5',
    baseCost: decimal(250),
    costMultiplier: decimal(2.2),
    maxPurchases: 10,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(100)),
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
    name: 'Passive Income',
    description: 'Unlocks basic idle generation (requires prestige)',
    baseCost: decimal(500),
    costMultiplier: decimal(1),
    maxPurchases: 1,
    currentPurchases: 0,
    unlocked: false,
    unlockCondition: (gameState) => decimal(gameState.totalEarned).greaterThanOrEqualTo(decimal(1000)),
    effect: {
      type: 'idleMultiplier',
      value: decimal(1.5),
      apply: (gameState) => {
        gameState.idleMultiplier = gameState.idleMultiplier.times(1.5)
      }
    }
  }
]