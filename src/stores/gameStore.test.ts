import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { decimal, ZERO, ONE } from '../utils/decimal'
import { SaveData } from '../types/gameTypes'

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Game Store', () => {
  beforeEach(() => {
    // Clear the store before each test
    useGameStore.getState().resetGame()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const state = useGameStore.getState().gameState
      
      expect(state.currency.equals(ZERO)).toBe(true)
      expect(state.totalClicks).toBe(0)
      expect(state.totalEarned.equals(ZERO)).toBe(true)
      expect(state.baseClickValue.equals(ONE)).toBe(true)
      expect(state.clickMultiplier.equals(ONE)).toBe(true)
      expect(state.offlineProgressRate).toBe(0)
      expect(state.maxOfflineHours).toBe(1)
      expect(state.totalPrestiges).toBe(0)
      expect(state.totalMetaPrestiges).toBe(0)
    })

    it('should have default settings', () => {
      const settings = useGameStore.getState().gameState.settings
      
      expect(settings.numberFormat).toBe('suffix')
      expect(settings.autoSave).toBe(true)
      expect(settings.autoSaveInterval).toBe(30)
      expect(settings.showTooltips).toBe(true)
      expect(settings.showNotifications).toBe(true)
      expect(settings.theme).toBe('auto')
    })
  })

  describe('Currency Management', () => {
    it('should update currency correctly', () => {
      const { updateCurrency } = useGameStore.getState()
      
      updateCurrency(decimal(100))
      expect(useGameStore.getState().gameState.currency.equals(decimal(100))).toBe(true)
      expect(useGameStore.getState().gameState.totalEarned.equals(decimal(100))).toBe(true)
      
      updateCurrency(decimal(50))
      expect(useGameStore.getState().gameState.currency.equals(decimal(150))).toBe(true)
      expect(useGameStore.getState().gameState.totalEarned.equals(decimal(150))).toBe(true)
    })

    it('should not add negative amounts to totalEarned', () => {
      const { updateCurrency } = useGameStore.getState()
      
      updateCurrency(decimal(100))
      updateCurrency(decimal(-50))
      
      expect(useGameStore.getState().gameState.currency.equals(decimal(50))).toBe(true)
      expect(useGameStore.getState().gameState.totalEarned.equals(decimal(100))).toBe(true)
    })

    it('should set currency directly', () => {
      const { setCurrency } = useGameStore.getState()
      
      setCurrency(decimal(500))
      expect(useGameStore.getState().gameState.currency.equals(decimal(500))).toBe(true)
    })
  })

  describe('Click Tracking', () => {
    it('should track total clicks', () => {
      const { addClicks } = useGameStore.getState()
      
      addClicks(5)
      expect(useGameStore.getState().gameState.totalClicks).toBe(5)
      
      addClicks(3)
      expect(useGameStore.getState().gameState.totalClicks).toBe(8)
    })
  })

  describe('Settings Management', () => {
    it('should update settings partially', () => {
      const { updateSettings } = useGameStore.getState()
      
      updateSettings({ numberFormat: 'scientific', autoSave: false })
      
      const settings = useGameStore.getState().gameState.settings
      expect(settings.numberFormat).toBe('scientific')
      expect(settings.autoSave).toBe(false)
      expect(settings.showTooltips).toBe(true) // Should remain unchanged
    })
  })

  describe('Save/Load System', () => {
    it('should export save data correctly', () => {
      const { updateCurrency, addClicks, exportSave } = useGameStore.getState()
      
      // Set up some game state
      updateCurrency(decimal(1000))
      addClicks(50)
      
      const saveString = exportSave()
      const saveData: SaveData = JSON.parse(saveString)
      
      expect(saveData.version).toBe('1.0.0')
      expect(saveData.gameState.currency).toBe('1000')
      expect(saveData.gameState.totalClicks).toBe(50)
      expect(saveData.timestamp).toBeTypeOf('number')
    })

    it('should import save data correctly', () => {
      const { importSave } = useGameStore.getState()
      
      const mockSaveData: SaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: {
          currency: '2000',
          totalClicks: 100,
          totalEarned: '2000',
          gameStartTime: Date.now() - 1000000,
          lastSaveTime: Date.now() - 1000,
          lastActiveTime: Date.now() - 500,
          clickMultiplier: '2',
          baseClickValue: '1',
          idleGenerators: [],
          idleMultiplier: '1',
          offlineProgressRate: 0.5,
          maxOfflineHours: 2,
          upgrades: [],
          purchasedUpgrades: [],
          prestigePoints: '100',
          prestigeUpgrades: [],
          purchasedPrestigeUpgrades: [],
          totalPrestiges: 1,
          metaPrestigePoints: '0',
          metaPrestigeUpgrades: [],
          purchasedMetaPrestigeUpgrades: [],
          totalMetaPrestiges: 0,
          automationSystems: [],
          achievements: [],
          unlockedAchievements: [],
          settings: {
            numberFormat: 'scientific',
            autoSave: true,
            autoSaveInterval: 60,
            showTooltips: false,
            showNotifications: true,
            offlineProgressNotification: true,
            theme: 'dark',
          },
        },
        settings: {
          numberFormat: 'scientific',
          autoSave: true,
          autoSaveInterval: 60,
          showTooltips: false,
          showNotifications: true,
          offlineProgressNotification: true,
          theme: 'dark',
        },
      }
      
      const success = importSave(JSON.stringify(mockSaveData))
      expect(success).toBe(true)
      
      const state = useGameStore.getState().gameState
      expect(state.currency.equals(decimal(2000))).toBe(true)
      expect(state.totalClicks).toBe(100)
      expect(state.clickMultiplier.equals(decimal(2))).toBe(true)
      expect(state.offlineProgressRate).toBe(0.5)
      expect(state.prestigePoints.equals(decimal(100))).toBe(true)
      expect(state.totalPrestiges).toBe(1)
      expect(state.settings.numberFormat).toBe('scientific')
      expect(state.settings.theme).toBe('dark')
    })

    it('should handle invalid save data', () => {
      const { importSave } = useGameStore.getState()
      
      const success1 = importSave('invalid json')
      expect(success1).toBe(false)
      
      const success2 = importSave('{"invalid": "structure"}')
      expect(success2).toBe(false)
    })

    it('should handle round-trip save/load', () => {
      const { updateCurrency, addClicks, updateSettings, exportSave, importSave } = useGameStore.getState()
      
      // Set up complex game state
      updateCurrency(decimal(5000))
      addClicks(200)
      updateSettings({ numberFormat: 'scientific', theme: 'dark' })
      
      // Export and import
      const saveString = exportSave()
      const success = importSave(saveString)
      
      expect(success).toBe(true)
      
      const state = useGameStore.getState().gameState
      expect(state.currency.equals(decimal(5000))).toBe(true)
      expect(state.totalClicks).toBe(200)
      expect(state.settings.numberFormat).toBe('scientific')
      expect(state.settings.theme).toBe('dark')
    })
  })

  describe('Game Reset', () => {
    it('should reset game to initial state', () => {
      const { updateCurrency, addClicks, updateSettings, resetGame } = useGameStore.getState()
      
      // Modify game state
      updateCurrency(decimal(1000))
      addClicks(50)
      updateSettings({ numberFormat: 'scientific' })
      
      // Reset
      resetGame()
      
      const state = useGameStore.getState().gameState
      expect(state.currency.equals(ZERO)).toBe(true)
      expect(state.totalClicks).toBe(0)
      expect(state.settings.numberFormat).toBe('suffix')
    })
  })

  describe('Time Tracking', () => {
    it('should update last active time', () => {
      const { updateLastActiveTime } = useGameStore.getState()
      
      const initialTime = useGameStore.getState().gameState.lastActiveTime
      
      // Wait a bit and update
      setTimeout(() => {
        updateLastActiveTime()
        const newTime = useGameStore.getState().gameState.lastActiveTime
        expect(newTime).toBeGreaterThan(initialTime)
      }, 10)
    })

    it('should update last active time on currency changes', () => {
      const { updateCurrency } = useGameStore.getState()
      
      const initialTime = useGameStore.getState().gameState.lastActiveTime
      
      setTimeout(() => {
        updateCurrency(decimal(100))
        const newTime = useGameStore.getState().gameState.lastActiveTime
        expect(newTime).toBeGreaterThan(initialTime)
      }, 10)
    })
  })
})