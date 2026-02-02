import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameEngine } from './gameEngine'
import { useGameStore } from '../stores/gameStore'
import { decimal, ZERO, ONE } from '../utils/decimal'
import type { IdleGenerator, Upgrade, AutomationSystem } from '../types/gameTypes'

// Mock the game store
vi.mock('../stores/gameStore', () => ({
  useGameStore: {
    getState: vi.fn(),
  },
}))

describe('GameEngine', () => {
  let engine: GameEngine
  let mockStore: any

  beforeEach(() => {
    // Create a fresh mock store for each test
    mockStore = {
      gameState: {
        currency: ZERO, // Clicks
        views: ZERO, // Views
        engagement: ONE, // Engagement multiplier
        influence: ZERO, // Influence
        totalClicks: 0,
        totalEarned: ZERO,
        gameStartTime: Date.now(),
        lastSaveTime: Date.now(),
        lastActiveTime: Date.now(),
        recentClicks: [],
        baseClickValue: ONE,
        clickMultiplier: ONE,
        idleGenerators: [],
        idleMultiplier: ONE,
        offlineProgressRate: 0,
        maxOfflineHours: 1,
        upgrades: [],
        purchasedUpgrades: new Set(),
        prestigePoints: ZERO,
        prestigeUpgrades: [],
        purchasedPrestigeUpgrades: new Set(),
        totalPrestiges: 0,
        metaPrestigePoints: ZERO,
        metaPrestigeUpgrades: [],
        purchasedMetaPrestigeUpgrades: new Set(),
        totalMetaPrestiges: 0,
        automationSystems: [],
        achievements: [],
        unlockedAchievements: new Set(),
        temporaryEffects: [],
        settings: {
          numberFormat: 'suffix',
          autoSave: true,
          autoSaveInterval: 30,
          showTooltips: true,
          showNotifications: true,
          offlineProgressNotification: true,
          theme: 'auto',
        },
      },
      updateCurrency: vi.fn(),
      setCurrency: vi.fn(),
      addClicks: vi.fn(),
      addManualClick: vi.fn(),
      updateLastActiveTime: vi.fn(),
      updateSettings: vi.fn(),
      resetGame: vi.fn(),
      saveGame: vi.fn(),
      loadGame: vi.fn(),
      exportSave: vi.fn(),
      importSave: vi.fn(),
      getGameState: vi.fn(),
      setGameState: vi.fn(),
    }

    // Make getGameState return the current gameState
    mockStore.getGameState.mockReturnValue(mockStore.gameState)

    // Mock the useGameStore to return our mock
    ;(useGameStore.getState as any).mockReturnValue(mockStore)

    // Create engine instance (but stop the game loop for testing)
    engine = new GameEngine()
    engine.stopGameLoop()
  })

  describe('Click System', () => {
    it('should perform clicks correctly', () => {
      const clickValue = engine.performClick()
      
      expect(clickValue.equals(ONE)).toBe(true)
      expect(mockStore.updateCurrency).toHaveBeenCalledWith(ONE)
      expect(mockStore.addManualClick).toHaveBeenCalled()
    })

    it('should apply click multipliers', () => {
      mockStore.gameState.clickMultiplier = decimal(5)
      
      const clickValue = engine.performClick()
      
      expect(clickValue.equals(decimal(5))).toBe(true)
      expect(mockStore.updateCurrency).toHaveBeenCalledWith(decimal(5))
    })

    it('should use custom base click value', () => {
      mockStore.gameState.baseClickValue = decimal(10)
      mockStore.gameState.clickMultiplier = decimal(2)
      
      const clickValue = engine.performClick()
      
      expect(clickValue.equals(decimal(20))).toBe(true)
    })
  })

  describe('Idle System', () => {
    it('should calculate zero production with no generators', () => {
      const production = engine.calculateTotalIdleProduction()
      expect(production.equals(ZERO)).toBe(true)
    })

    it('should calculate production from generators', () => {
      const generator: IdleGenerator = {
        id: 'gen1',
        name: 'Generator 1',
        description: 'Test generator',
        baseProduction: decimal(10),
        baseCost: decimal(100),
        costMultiplier: decimal(1.15),
        owned: 3,
        unlocked: true,
      }
      
      mockStore.gameState.idleGenerators = [generator]
      mockStore.gameState.idleMultiplier = decimal(2)
      
      const production = engine.calculateTotalIdleProduction()
      expect(production.equals(decimal(60))).toBe(true) // 10 * 3 * 2
    })

    it('should update idle progress', () => {
      const generator: IdleGenerator = {
        id: 'gen1',
        name: 'Generator 1',
        description: 'Test generator',
        baseProduction: decimal(10),
        baseCost: decimal(100),
        costMultiplier: decimal(1.15),
        owned: 1,
        unlocked: true,
      }
      
      mockStore.gameState.idleGenerators = [generator]
      
      const earnings = engine.updateIdleProgress(1) // 1 second
      
      expect(earnings.equals(decimal(10))).toBe(true)
      expect(mockStore.setGameState).toHaveBeenCalled()
      
      // Check that the new state includes the views and converted clicks
      const setGameStateCall = mockStore.setGameState.mock.calls[0][0]
      expect(setGameStateCall.views.equals(decimal(10))).toBe(true) // Views earned
      expect(setGameStateCall.currency.equals(decimal(1))).toBe(true) // 10 views / 10 = 1 click
    })
  })

  describe('Offline Progress', () => {
    it('should calculate offline progress with time cap', () => {
      const generator: IdleGenerator = {
        id: 'gen1',
        name: 'Generator 1',
        description: 'Test generator',
        baseProduction: decimal(10),
        baseCost: decimal(100),
        costMultiplier: decimal(1.15),
        owned: 1,
        unlocked: true,
      }
      
      mockStore.gameState.idleGenerators = [generator]
      mockStore.gameState.offlineProgressRate = 0.5
      mockStore.gameState.maxOfflineHours = 2
      
      const progress = engine.calculateOfflineProgress(10800) // 3 hours
      
      expect(progress.timeOffline).toBe(10800)
      expect(progress.cappedByTime).toBe(true)
      expect(progress.cappedByEfficiency).toBe(true)
      // 2 hours * 0.5 efficiency * 10 production/second * 3600 seconds/hour = 36000
      expect(progress.idleEarnings.equals(decimal(36000))).toBe(true)
    })

    it('should handle zero offline progress rate', () => {
      mockStore.gameState.offlineProgressRate = 0
      
      const progress = engine.calculateOfflineProgress(3600) // 1 hour
      
      expect(progress.idleEarnings.equals(ZERO)).toBe(true)
      expect(progress.cappedByEfficiency).toBe(true)
    })
  })

  describe('Upgrade System', () => {
    it('should check if upgrade is affordable', () => {
      const upgrade: Upgrade = {
        id: 'upgrade1',
        name: 'Test Upgrade',
        description: 'Test upgrade',
        baseCost: decimal(100),
        costMultiplier: decimal(2),
        maxPurchases: 5,
        currentPurchases: 0,
        unlocked: true,
        effect: {
          type: 'clickMultiplier',
          value: decimal(2),
          apply: vi.fn(),
        },
      }
      
      mockStore.gameState.currency = decimal(50)
      expect(engine.canAffordUpgrade(upgrade)).toBe(false)
      
      mockStore.gameState.currency = decimal(150)
      expect(engine.canAffordUpgrade(upgrade)).toBe(true)
    })

    it('should calculate upgrade cost with scaling', () => {
      const upgrade: Upgrade = {
        id: 'upgrade1',
        name: 'Test Upgrade',
        description: 'Test upgrade',
        baseCost: decimal(100),
        costMultiplier: decimal(2),
        maxPurchases: 5,
        currentPurchases: 2,
        unlocked: true,
        effect: {
          type: 'clickMultiplier',
          value: decimal(2),
          apply: vi.fn(),
        },
      }
      
      const cost = engine.getUpgradeCost(upgrade)
      expect(cost.equals(decimal(400))).toBe(true) // 100 * 2^2
    })

    it('should not allow purchasing locked upgrades', () => {
      const upgrade: Upgrade = {
        id: 'upgrade1',
        name: 'Test Upgrade',
        description: 'Test upgrade',
        baseCost: decimal(100),
        costMultiplier: decimal(2),
        maxPurchases: 5,
        currentPurchases: 0,
        unlocked: false,
        effect: {
          type: 'clickMultiplier',
          value: decimal(2),
          apply: vi.fn(),
        },
      }
      
      mockStore.gameState.currency = decimal(1000)
      expect(engine.canAffordUpgrade(upgrade)).toBe(false)
    })
  })

  describe('Generator System', () => {
    it('should calculate generator cost', () => {
      const generator: IdleGenerator = {
        id: 'gen1',
        name: 'Generator 1',
        description: 'Test generator',
        baseProduction: decimal(10),
        baseCost: decimal(100),
        costMultiplier: decimal(1.15),
        owned: 2,
        unlocked: true,
      }
      
      const cost = engine.getGeneratorCost(generator, 1)
      const expectedCost = decimal(100).times(decimal(1.15).pow(2)).ceil()
      expect(cost.equals(expectedCost)).toBe(true)
    })

    it('should calculate cost for multiple generators', () => {
      const generator: IdleGenerator = {
        id: 'gen1',
        name: 'Generator 1',
        description: 'Test generator',
        baseProduction: decimal(10),
        baseCost: decimal(100),
        costMultiplier: decimal(1.15),
        owned: 0,
        unlocked: true,
      }
      
      const cost = engine.getGeneratorCost(generator, 3)
      // Cost for 0th, 1st, and 2nd generators, then ceiling
      const expectedCost = decimal(100)
        .plus(decimal(100).times(decimal(1.15)))
        .plus(decimal(100).times(decimal(1.15).pow(2)))
        .ceil()
      
      expect(cost.toFixed(2)).toBe(expectedCost.toFixed(2))
    })
  })

  describe('Prestige System', () => {
    it('should check prestige requirements', () => {
      mockStore.gameState.totalEarned = decimal(500)
      expect(engine.canPrestige()).toBe(false)
      
      mockStore.gameState.totalEarned = decimal(1500)
      expect(engine.canPrestige()).toBe(true)
    })

    it('should calculate prestige gain', () => {
      mockStore.gameState.totalEarned = decimal(4000)
      const gain = engine.calculatePrestigeGain()
      expect(gain.equals(decimal(2))).toBe(true) // sqrt(4000/1000) = 2
    })

    it('should check meta prestige requirements', () => {
      mockStore.gameState.totalPrestiges = 5
      mockStore.gameState.prestigePoints = decimal(500)
      expect(engine.canMetaPrestige()).toBe(false)
      
      mockStore.gameState.totalPrestiges = 15
      mockStore.gameState.prestigePoints = decimal(1500)
      expect(engine.canMetaPrestige()).toBe(true)
    })
  })

  describe('Automation System', () => {
    it('should calculate automation cost', () => {
      const automation: AutomationSystem = {
        id: 'auto1',
        name: 'Auto Clicker',
        description: 'Clicks automatically',
        baseCost: decimal(1000),
        costMultiplier: decimal(2),
        owned: 1,
        unlocked: true,
        clicksPerSecond: decimal(1),
        efficiency: ONE,
      }
      
      const cost = engine.getAutomationCost(automation, 1)
      expect(cost.equals(decimal(2000))).toBe(true) // 1000 * 2^1
    })

    it('should check automation affordability', () => {
      const automation: AutomationSystem = {
        id: 'auto1',
        name: 'Auto Clicker',
        description: 'Clicks automatically',
        baseCost: decimal(1000),
        costMultiplier: decimal(2),
        owned: 0,
        unlocked: true,
        clicksPerSecond: decimal(1),
        efficiency: ONE,
      }
      
      mockStore.gameState.currency = decimal(500)
      expect(engine.canAffordAutomation(automation)).toBe(false)
      
      mockStore.gameState.currency = decimal(1500)
      expect(engine.canAffordAutomation(automation)).toBe(true)
    })
  })

  describe('Utility Methods', () => {
    it('should get game state', () => {
      const state = engine.getGameState()
      expect(state).toBe(mockStore.gameState)
    })

    it('should update settings', () => {
      const newSettings = { numberFormat: 'scientific' as const }
      engine.updateSettings(newSettings)
      expect(mockStore.updateSettings).toHaveBeenCalledWith(newSettings)
    })

    it('should reset game', () => {
      engine.resetGame()
      expect(mockStore.resetGame).toHaveBeenCalled()
    })

    it('should handle save operations', () => {
      engine.saveGame()
      expect(mockStore.saveGame).toHaveBeenCalled()
      
      mockStore.exportSave.mockReturnValue('save-string')
      const saveString = engine.exportSave()
      expect(saveString).toBe('save-string')
      
      mockStore.importSave.mockReturnValue(true)
      const success = engine.importSave('save-string')
      expect(success).toBe(true)
    })
    it('should apply strategy points bonus to clicks', () => {
      // Set up game state with strategy points
      mockStore.gameState.prestigePoints = decimal(3) // 30% bonus
      mockStore.gameState.baseClickValue = decimal(1)
      mockStore.gameState.clickMultiplier = decimal(1)
      
      const clickValue = engine.performClick()
      
      // Should be base (1) * multiplier (1) * strategy bonus (1.3) = 1.3
      expect(clickValue.equals(decimal(1.3))).toBe(true)
    })
  })
})