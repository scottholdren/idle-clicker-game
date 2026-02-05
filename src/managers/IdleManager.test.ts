import { describe, it, expect, beforeEach } from 'vitest'
import { IdleManager } from './IdleManager'
import { decimal, ZERO, ONE } from '../utils/decimal'
import type { GameState } from '../types/gameTypes'

describe('IdleManager', () => {
  let idleManager: IdleManager
  let mockGameState: GameState

  beforeEach(() => {
    idleManager = new IdleManager()
    
    // Create a minimal mock game state
    mockGameState = {
      currency: decimal(100), // Clicks
      views: ZERO, // Views
      engagement: 1, // Engagement level
      influence: ZERO, // Influence
      totalClicks: 0,
      totalEarned: ZERO,
      gameStartTime: Date.now(),
      lastSaveTime: Date.now(),
      lastActiveTime: Date.now(),
      baseClickValue: ONE,
      clickMultiplier: ONE,
      idleGenerators: [],
      idleMultiplier: ONE,
      offlineProgressRate: 0, // Starts at 0% (no offline progress initially)
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
      settings: {
        numberFormat: 'suffix',
        autoSave: true,
        autoSaveInterval: 30,
        showTooltips: true,
        showNotifications: true,
        offlineProgressNotification: true,
        theme: 'auto',
      },
    }
  })

  describe('Generator Initialization', () => {
    it('should initialize generators when none exist', () => {
      expect(mockGameState.idleGenerators.length).toBe(0)
      
      idleManager.initializeGenerators(mockGameState)
      
      expect(mockGameState.idleGenerators.length).toBeGreaterThan(0)
      expect(mockGameState.idleGenerators[0].id).toBe('bot')
      expect(mockGameState.idleGenerators[0].unlocked).toBe(true)
    })

    it('should not reinitialize generators if they already exist', () => {
      idleManager.initializeGenerators(mockGameState)
      const initialCount = mockGameState.idleGenerators.length
      
      idleManager.initializeGenerators(mockGameState)
      
      expect(mockGameState.idleGenerators.length).toBe(initialCount)
    })
  })

  describe('Production Calculation', () => {
    beforeEach(() => {
      idleManager.initializeGenerators(mockGameState)
    })

    it('should calculate zero production with no generators owned', () => {
      const production = idleManager.calculateTotalProduction(mockGameState)
      expect(production.equals(ZERO)).toBe(true)
    })

    it('should calculate production from owned generators', () => {
      // Give the player 1 bot (0.5 production per second)
      mockGameState.idleGenerators[0].owned = 1
      
      const production = idleManager.calculateTotalProduction(mockGameState)
      expect(production.equals(decimal(0.5))).toBe(true)
    })

    it('should apply idle multiplier to production', () => {
      mockGameState.idleGenerators[0].owned = 1
      mockGameState.idleMultiplier = decimal(2)
      
      const production = idleManager.calculateTotalProduction(mockGameState)
      expect(production.equals(decimal(1.0))).toBe(true) // 0.5 * 2
    })
  })

  describe('Generator Purchase', () => {
    beforeEach(() => {
      idleManager.initializeGenerators(mockGameState)
      mockGameState.currency = decimal(100) // Enough to buy bot (costs 15)
    })

    it('should allow purchasing affordable generators', () => {
      const canAfford = idleManager.canAffordGenerator(mockGameState.idleGenerators[0], mockGameState, 1)
      expect(canAfford).toBe(true)
    })

    it('should not allow purchasing unaffordable generators', () => {
      mockGameState.currency = decimal(5) // Not enough for bot (costs 15)
      
      const canAfford = idleManager.canAffordGenerator(mockGameState.idleGenerators[0], mockGameState, 1)
      expect(canAfford).toBe(false)
    })

    it('should successfully purchase generators', () => {
      const initialCurrency = mockGameState.currency
      const generator = mockGameState.idleGenerators[0]
      const cost = idleManager.getGeneratorCost(generator, 1)
      
      const success = idleManager.purchaseGenerator('bot', mockGameState, 1)
      
      expect(success).toBe(true)
      expect(generator.owned).toBe(1)
      expect(mockGameState.currency.equals(initialCurrency.minus(cost))).toBe(true)
    })
  })

  describe('Offline Progress', () => {
    beforeEach(() => {
      idleManager.initializeGenerators(mockGameState)
      mockGameState.idleGenerators[0].owned = 1 // 1 bot = 0.1/sec
    })

    it('should calculate zero offline progress with 0% efficiency', () => {
      mockGameState.offlineProgressRate = 0 // No offline progress initially
      
      const progress = idleManager.calculateOfflineProgress(mockGameState, 3600) // 1 hour
      
      expect(progress.idleEarnings.equals(ZERO)).toBe(true)
      expect(progress.cappedByEfficiency).toBe(true)
    })

    it('should calculate offline progress with efficiency', () => {
      mockGameState.offlineProgressRate = 0.5 // 50% efficiency
      mockGameState.maxOfflineHours = 2
      
      const progress = idleManager.calculateOfflineProgress(mockGameState, 3600) // 1 hour
      
      // 1 hour * 0.5 efficiency * 0.5 production/sec * 3600 sec/hour = 900
      expect(progress.idleEarnings.equals(decimal(900))).toBe(true)
      expect(progress.cappedByTime).toBe(false)
      expect(progress.cappedByEfficiency).toBe(true)
    })

    it('should cap offline progress by time', () => {
      mockGameState.offlineProgressRate = 1.0 // 100% efficiency
      mockGameState.maxOfflineHours = 1 // 1 hour cap
      
      const progress = idleManager.calculateOfflineProgress(mockGameState, 7200) // 2 hours
      
      // Capped to 1 hour: 1 hour * 1.0 efficiency * 0.5 production/sec * 3600 sec/hour = 1800
      expect(progress.idleEarnings.equals(decimal(1800))).toBe(true)
      expect(progress.cappedByTime).toBe(true)
      expect(progress.cappedByEfficiency).toBe(false)
    })
  })
})