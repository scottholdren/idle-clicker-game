import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Decimal from 'decimal.js'
import { GameState, GameSettings, SerializableGameState, SaveData } from '../types/gameTypes'
import { decimal, ZERO, ONE } from '../utils/decimal'

/**
 * Default game settings
 */
const DEFAULT_SETTINGS: GameSettings = {
  numberFormat: 'suffix',
  autoSave: true,
  autoSaveInterval: 30,
  showTooltips: true,
  showNotifications: true,
  offlineProgressNotification: true,
  theme: 'auto',
}

/**
 * Create initial game state
 */
function createInitialGameState(): GameState {
  const now = Date.now()
  
  return {
    // Basic game data
    currency: ZERO,
    totalClicks: 0,
    totalEarned: ZERO,
    gameStartTime: now,
    lastSaveTime: now,
    lastActiveTime: now,
    
    // Click system
    clickMultiplier: ONE,
    baseClickValue: ONE,
    
    // Idle system
    idleGenerators: [],
    idleMultiplier: ONE,
    offlineProgressRate: 0, // Starts at 0%, unlocked via prestige
    maxOfflineHours: 1,
    
    // Upgrades
    upgrades: [],
    purchasedUpgrades: new Set<string>(),
    
    // Prestige system
    prestigePoints: ZERO,
    prestigeUpgrades: [],
    purchasedPrestigeUpgrades: new Set<string>(),
    totalPrestiges: 0,
    
    // Meta prestige system
    metaPrestigePoints: ZERO,
    metaPrestigeUpgrades: [],
    purchasedMetaPrestigeUpgrades: new Set<string>(),
    totalMetaPrestiges: 0,
    
    // Automation
    automationSystems: [],
    
    // Achievements
    achievements: [],
    unlockedAchievements: new Set<string>(),
    
    // Settings
    settings: { ...DEFAULT_SETTINGS },
  }
}

/**
 * Convert GameState to SerializableGameState for persistence
 */
function serializeGameState(state: GameState): SerializableGameState {
  return {
    currency: state.currency.toString(),
    totalClicks: state.totalClicks,
    totalEarned: state.totalEarned.toString(),
    gameStartTime: state.gameStartTime,
    lastSaveTime: state.lastSaveTime,
    lastActiveTime: state.lastActiveTime,
    
    clickMultiplier: state.clickMultiplier.toString(),
    baseClickValue: state.baseClickValue.toString(),
    
    idleGenerators: state.idleGenerators.map(gen => ({
      ...gen,
      baseProduction: gen.baseProduction.toString(),
      baseCost: gen.baseCost.toString(),
      costMultiplier: gen.costMultiplier.toString(),
    })),
    idleMultiplier: state.idleMultiplier.toString(),
    offlineProgressRate: state.offlineProgressRate,
    maxOfflineHours: state.maxOfflineHours,
    
    upgrades: state.upgrades.map(upgrade => ({
      ...upgrade,
      baseCost: upgrade.baseCost.toString(),
      costMultiplier: upgrade.costMultiplier.toString(),
      effect: {
        ...upgrade.effect,
        value: upgrade.effect.value.toString(),
      },
    })),
    purchasedUpgrades: Array.from(state.purchasedUpgrades),
    
    prestigePoints: state.prestigePoints.toString(),
    prestigeUpgrades: state.prestigeUpgrades.map(upgrade => ({
      ...upgrade,
      baseCost: upgrade.baseCost.toString(),
      costMultiplier: upgrade.costMultiplier.toString(),
      effect: {
        ...upgrade.effect,
        value: upgrade.effect.value.toString(),
      },
    })),
    purchasedPrestigeUpgrades: Array.from(state.purchasedPrestigeUpgrades),
    totalPrestiges: state.totalPrestiges,
    
    metaPrestigePoints: state.metaPrestigePoints.toString(),
    metaPrestigeUpgrades: state.metaPrestigeUpgrades.map(upgrade => ({
      ...upgrade,
      baseCost: upgrade.baseCost.toString(),
      costMultiplier: upgrade.costMultiplier.toString(),
      effect: {
        ...upgrade.effect,
        value: upgrade.effect.value.toString(),
      },
    })),
    purchasedMetaPrestigeUpgrades: Array.from(state.purchasedMetaPrestigeUpgrades),
    totalMetaPrestiges: state.totalMetaPrestiges,
    
    automationSystems: state.automationSystems.map(auto => ({
      ...auto,
      baseCost: auto.baseCost.toString(),
      costMultiplier: auto.costMultiplier.toString(),
      clicksPerSecond: auto.clicksPerSecond.toString(),
      efficiency: auto.efficiency.toString(),
    })),
    
    achievements: state.achievements.map(achievement => ({
      ...achievement,
      reward: achievement.reward ? {
        ...achievement.reward,
        value: achievement.reward.value.toString(),
      } : undefined,
    })),
    unlockedAchievements: Array.from(state.unlockedAchievements),
    
    settings: state.settings,
  }
}

/**
 * Convert SerializableGameState back to GameState
 */
function deserializeGameState(serialized: SerializableGameState): GameState {
  return {
    currency: decimal(serialized.currency),
    totalClicks: serialized.totalClicks,
    totalEarned: decimal(serialized.totalEarned),
    gameStartTime: serialized.gameStartTime,
    lastSaveTime: serialized.lastSaveTime,
    lastActiveTime: serialized.lastActiveTime,
    
    clickMultiplier: decimal(serialized.clickMultiplier),
    baseClickValue: decimal(serialized.baseClickValue),
    
    idleGenerators: serialized.idleGenerators.map(gen => ({
      ...gen,
      baseProduction: decimal(gen.baseProduction),
      baseCost: decimal(gen.baseCost),
      costMultiplier: decimal(gen.costMultiplier),
    })),
    idleMultiplier: decimal(serialized.idleMultiplier),
    offlineProgressRate: serialized.offlineProgressRate,
    maxOfflineHours: serialized.maxOfflineHours,
    
    upgrades: serialized.upgrades.map(upgrade => ({
      ...upgrade,
      baseCost: decimal(upgrade.baseCost),
      costMultiplier: decimal(upgrade.costMultiplier),
      effect: {
        ...upgrade.effect,
        value: decimal(upgrade.effect.value),
        apply: () => {}, // Will be restored by game engine
      },
    })),
    purchasedUpgrades: new Set(serialized.purchasedUpgrades),
    
    prestigePoints: decimal(serialized.prestigePoints),
    prestigeUpgrades: serialized.prestigeUpgrades.map(upgrade => ({
      ...upgrade,
      baseCost: decimal(upgrade.baseCost),
      costMultiplier: decimal(upgrade.costMultiplier),
      effect: {
        ...upgrade.effect,
        value: decimal(upgrade.effect.value),
        apply: () => {}, // Will be restored by game engine
      },
    })),
    purchasedPrestigeUpgrades: new Set(serialized.purchasedPrestigeUpgrades),
    totalPrestiges: serialized.totalPrestiges,
    
    metaPrestigePoints: decimal(serialized.metaPrestigePoints),
    metaPrestigeUpgrades: serialized.metaPrestigeUpgrades.map(upgrade => ({
      ...upgrade,
      baseCost: decimal(upgrade.baseCost),
      costMultiplier: decimal(upgrade.costMultiplier),
      effect: {
        ...upgrade.effect,
        value: decimal(upgrade.effect.value),
        apply: () => {}, // Will be restored by game engine
      },
    })),
    purchasedMetaPrestigeUpgrades: new Set(serialized.purchasedMetaPrestigeUpgrades),
    totalMetaPrestiges: serialized.totalMetaPrestiges,
    
    automationSystems: serialized.automationSystems.map(auto => ({
      ...auto,
      baseCost: decimal(auto.baseCost),
      costMultiplier: decimal(auto.costMultiplier),
      clicksPerSecond: decimal(auto.clicksPerSecond),
      efficiency: decimal(auto.efficiency),
    })),
    
    achievements: serialized.achievements.map(achievement => ({
      ...achievement,
      unlockCondition: () => false, // Will be restored by game engine
      reward: achievement.reward ? {
        ...achievement.reward,
        value: decimal(achievement.reward.value),
        apply: () => {}, // Will be restored by game engine
      } : undefined,
    })),
    unlockedAchievements: new Set(serialized.unlockedAchievements),
    
    settings: serialized.settings,
  }
}

/**
 * Game store interface
 */
interface GameStore {
  // Game state
  gameState: GameState
  
  // Actions
  updateCurrency: (amount: Decimal) => void
  setCurrency: (amount: Decimal) => void
  addClicks: (count: number) => void
  updateLastActiveTime: () => void
  updateSettings: (settings: Partial<GameSettings>) => void
  resetGame: () => void
  
  // Save/Load
  saveGame: () => void
  loadGame: (saveData: SaveData) => void
  exportSave: () => string
  importSave: (saveString: string) => boolean
  
  // Utility
  getGameState: () => GameState
  setGameState: (state: GameState) => void
}

/**
 * Create the game store with persistence
 */
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      gameState: createInitialGameState(),
      
      // Actions
      updateCurrency: (amount: Decimal) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            currency: state.gameState.currency.plus(amount),
            totalEarned: state.gameState.totalEarned.plus(amount.isPositive() ? amount : ZERO),
            lastActiveTime: Date.now(),
          },
        }))
      },
      
      setCurrency: (amount: Decimal) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            currency: amount,
            lastActiveTime: Date.now(),
          },
        }))
      },
      
      addClicks: (count: number) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            totalClicks: state.gameState.totalClicks + count,
            lastActiveTime: Date.now(),
          },
        }))
      },
      
      updateLastActiveTime: () => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            lastActiveTime: Date.now(),
          },
        }))
      },
      
      updateSettings: (settings: Partial<GameSettings>) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            settings: {
              ...state.gameState.settings,
              ...settings,
            },
          },
        }))
      },
      
      resetGame: () => {
        set({ gameState: createInitialGameState() })
      },
      
      // Save/Load
      saveGame: () => {
        const state = get().gameState
        const now = Date.now()
        
        set((currentState) => ({
          gameState: {
            ...currentState.gameState,
            lastSaveTime: now,
          },
        }))
      },
      
      loadGame: (saveData: SaveData) => {
        try {
          const gameState = deserializeGameState(saveData.gameState)
          set({ gameState })
        } catch (error) {
          console.error('Failed to load game:', error)
          throw new Error('Invalid save data')
        }
      },
      
      exportSave: () => {
        const state = get().gameState
        const saveData: SaveData = {
          version: '1.0.0',
          timestamp: Date.now(),
          gameState: serializeGameState(state),
          settings: state.settings,
        }
        
        return JSON.stringify(saveData)
      },
      
      importSave: (saveString: string) => {
        try {
          const saveData: SaveData = JSON.parse(saveString)
          
          // Validate save data structure
          if (!saveData.version || !saveData.gameState || !saveData.settings) {
            throw new Error('Invalid save data structure')
          }
          
          get().loadGame(saveData)
          return true
        } catch (error) {
          console.error('Failed to import save:', error)
          return false
        }
      },
      
      // Utility
      getGameState: () => get().gameState,
      
      setGameState: (state: GameState) => {
        set({ gameState: state })
      },
    }),
    {
      name: 'idle-clicker-game-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Custom serialization to handle Decimal and Set types
      serialize: (state) => {
        const serializedState = {
          ...state,
          gameState: serializeGameState(state.gameState),
        }
        return JSON.stringify(serializedState)
      },
      
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        return {
          ...parsed,
          gameState: deserializeGameState(parsed.gameState),
        }
      },
      
      // Merge function for handling state updates
      merge: (persistedState, currentState) => {
        // If persisted state exists, use it; otherwise use current state
        if (persistedState && persistedState.gameState) {
          return {
            ...currentState,
            ...persistedState,
          }
        }
        return currentState
      },
    }
  )
)

/**
 * Selector hooks for specific parts of the game state
 */
export const useCurrency = () => useGameStore((state) => state.gameState.currency)
export const useClicks = () => useGameStore((state) => state.gameState.totalClicks)
export const useSettings = () => useGameStore((state) => state.gameState.settings)
export const useUpgrades = () => useGameStore((state) => state.gameState.upgrades)
export const useGenerators = () => useGameStore((state) => state.gameState.idleGenerators)
export const usePrestigePoints = () => useGameStore((state) => state.gameState.prestigePoints)
export const useMetaPrestigePoints = () => useGameStore((state) => state.gameState.metaPrestigePoints)
export const useAchievements = () => useGameStore((state) => state.gameState.achievements)
export const useAutomation = () => useGameStore((state) => state.gameState.automationSystems)

/**
 * Action hooks
 */
export const useGameActions = () => {
  const store = useGameStore()
  return {
    updateCurrency: store.updateCurrency,
    setCurrency: store.setCurrency,
    addClicks: store.addClicks,
    updateLastActiveTime: store.updateLastActiveTime,
    updateSettings: store.updateSettings,
    resetGame: store.resetGame,
    saveGame: store.saveGame,
    loadGame: store.loadGame,
    exportSave: store.exportSave,
    importSave: store.importSave,
    getGameState: store.getGameState,
    setGameState: store.setGameState,
  }
}