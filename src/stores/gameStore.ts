import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Decimal from 'decimal.js'
import type { GameState, GameSettings, SerializableGameState, SaveData } from '../types/gameTypes'
import { decimal, ZERO, ONE } from '../utils/decimal'
import { INITIAL_UPGRADES } from '../data/upgrades'
import { INITIAL_IDLE_GENERATORS } from '../data/idleGenerators'

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
    // Digital Decay 4-tier currency system
    currency: ZERO, // Clicks - starts at 0
    views: ZERO, // Views - starts at 0
    engagement: ONE, // Engagement - starts at 1x multiplier
    influence: ZERO, // Influence - starts at 0
    
    // Basic game data
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
    views: state.views.toString(),
    engagement: state.engagement.toString(),
    influence: state.influence.toString(),
    
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
    views: decimal(serialized.views || '0'), // Default to 0 for backward compatibility
    engagement: decimal(serialized.engagement || '1'), // Default to 1 for backward compatibility
    influence: decimal(serialized.influence || '0'), // Default to 0 for backward compatibility
    
    totalClicks: serialized.totalClicks,
    totalEarned: decimal(serialized.totalEarned),
    gameStartTime: serialized.gameStartTime,
    lastSaveTime: serialized.lastSaveTime,
    lastActiveTime: serialized.lastActiveTime,
    
    clickMultiplier: decimal(serialized.clickMultiplier),
    baseClickValue: decimal(serialized.baseClickValue),
    
    idleGenerators: serialized.idleGenerators.map(gen => {
      // Find the original generator definition to restore functions
      const originalGenerator = INITIAL_IDLE_GENERATORS.find(orig => orig.id === gen.id)
      if (!originalGenerator) {
        console.warn(`Original generator definition not found for ${gen.id}`)
        return {
          ...gen,
          baseProduction: decimal(gen.baseProduction),
          baseCost: decimal(gen.baseCost),
          costMultiplier: decimal(gen.costMultiplier),
          unlockCondition: () => true, // Fallback always unlocked
        }
      }
      
      return {
        ...gen,
        baseProduction: decimal(gen.baseProduction),
        baseCost: decimal(gen.baseCost),
        costMultiplier: decimal(gen.costMultiplier),
        unlockCondition: originalGenerator.unlockCondition, // Restore original function
      }
    }),
    idleMultiplier: decimal(serialized.idleMultiplier),
    offlineProgressRate: serialized.offlineProgressRate,
    maxOfflineHours: serialized.maxOfflineHours,
    
    upgrades: serialized.upgrades.map(upgrade => {
      // Find the original upgrade definition to restore functions
      const originalUpgrade = INITIAL_UPGRADES.find(orig => orig.id === upgrade.id)
      if (!originalUpgrade) {
        console.warn(`Original upgrade definition not found for ${upgrade.id}`)
        return {
          ...upgrade,
          baseCost: decimal(upgrade.baseCost),
          costMultiplier: decimal(upgrade.costMultiplier),
          effect: {
            ...upgrade.effect,
            value: decimal(upgrade.effect.value),
            apply: () => {}, // Fallback empty function
          },
          unlockCondition: () => true, // Fallback always unlocked
        }
      }
      
      return {
        ...upgrade,
        baseCost: decimal(upgrade.baseCost),
        costMultiplier: decimal(upgrade.costMultiplier),
        effect: {
          ...upgrade.effect,
          value: decimal(upgrade.effect.value),
          apply: originalUpgrade.effect.apply, // Restore original function
        },
        unlockCondition: originalUpgrade.unlockCondition, // Restore original function
      }
    }),
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
  updateViews: (amount: Decimal) => void
  updateEngagement: (amount: Decimal) => void
  updateInfluence: (amount: Decimal) => void
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
      
      // Currency actions
      updateCurrency: (amount: Decimal) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            currency: decimal(state.gameState.currency).plus(amount),
            totalEarned: decimal(state.gameState.totalEarned).plus(amount.isPositive() ? amount : ZERO),
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

      updateViews: (amount: Decimal) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            views: decimal(state.gameState.views).plus(amount),
            lastActiveTime: Date.now(),
          },
        }))
      },

      updateEngagement: (amount: Decimal) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            engagement: decimal(state.gameState.engagement).plus(amount),
            lastActiveTime: Date.now(),
          },
        }))
      },

      updateInfluence: (amount: Decimal) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            influence: decimal(state.gameState.influence).plus(amount),
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
        const gameState = get().gameState
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
        const gameState = get().gameState
        const saveData: SaveData = {
          version: '1.0.0',
          timestamp: Date.now(),
          gameState: serializeGameState(gameState),
          settings: gameState.settings,
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
      getGameState: () => {
        const gameState = get().gameState
        // Ensure all Decimal fields are proper Decimal objects
        return {
          ...gameState,
          currency: decimal(gameState.currency),
          views: decimal(gameState.views),
          engagement: decimal(gameState.engagement),
          influence: decimal(gameState.influence),
          totalEarned: decimal(gameState.totalEarned),
          baseClickValue: decimal(gameState.baseClickValue),
          clickMultiplier: decimal(gameState.clickMultiplier),
          idleMultiplier: decimal(gameState.idleMultiplier),
          prestigePoints: decimal(gameState.prestigePoints),
          metaPrestigePoints: decimal(gameState.metaPrestigePoints),
        }
      },
      
      setGameState: (gameState: GameState) => {
        set({ gameState })
      },
    }),
    {
      name: 'idle-clicker-game-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Merge function for handling state updates
      merge: (persistedState: any, currentState: GameStore) => {
        // If persisted state exists, use it; otherwise use current state
        if (persistedState && persistedState.gameState) {
          // Ensure the persisted state has proper Decimal objects
          const safeGameState = {
            ...persistedState.gameState,
            currency: decimal(persistedState.gameState.currency || 0),
            views: decimal(persistedState.gameState.views || 0),
            engagement: decimal(persistedState.gameState.engagement || 1),
            influence: decimal(persistedState.gameState.influence || 0),
            totalEarned: decimal(persistedState.gameState.totalEarned || 0),
            baseClickValue: decimal(persistedState.gameState.baseClickValue || 1),
            clickMultiplier: decimal(persistedState.gameState.clickMultiplier || 1),
            idleMultiplier: decimal(persistedState.gameState.idleMultiplier || 1),
            prestigePoints: decimal(persistedState.gameState.prestigePoints || 0),
            metaPrestigePoints: decimal(persistedState.gameState.metaPrestigePoints || 0),
          }
          
          return {
            ...currentState,
            ...persistedState,
            gameState: safeGameState,
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
export const useViews = () => useGameStore((state) => state.gameState.views)
export const useEngagement = () => useGameStore((state) => state.gameState.engagement)
export const useInfluence = () => useGameStore((state) => state.gameState.influence)
export const useClicks = () => useGameStore((state) => state.gameState.totalClicks)
export const useSettings = () => useGameStore((state) => state.gameState.settings)
export const useUpgrades = () => useGameStore((state) => state.gameState.upgrades)
export const useGenerators = () => useGameStore((state) => state.gameState.idleGenerators)
export const usePrestigePoints = () => useGameStore((state) => state.gameState.prestigePoints)
export const useMetaPrestigePoints = () => useGameStore((state) => state.gameState.metaPrestigePoints)
export const useAchievements = () => useGameStore((state) => state.gameState.achievements)
export const useAutomation = () => useGameStore((state) => state.gameState.automationSystems)

/**
 * Derived selectors for upgrades
 */
export const useAvailableUpgrades = () => {
  const upgrades = useUpgrades()
  const currency = useCurrency()
  
  // This will trigger re-render when currency or upgrades change
  return upgrades.filter(upgrade => 
    upgrade.unlocked && 
    upgrade.currentPurchases < upgrade.maxPurchases
  )
}

export const useVisibleUpgrades = () => {
  const upgrades = useUpgrades()
  return upgrades.filter(upgrade => upgrade.unlocked)
}

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