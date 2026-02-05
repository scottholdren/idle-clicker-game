import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Decimal from 'decimal.js'
import type { GameState, GameSettings, SerializableGameState, SaveData } from '../types/gameTypes'
import { decimal, ZERO, ONE, calculateViewToClickEfficiency, calculateStrategyPointsMultiplier } from '../utils/decimal'
import { getInitialUpgrades } from '../data/upgrades'
import { getInitialIdleGenerators } from '../data/idleGenerators'

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
 * Base click boost for testing/debugging
 */
export type BaseClickMode = 0 | 10 | 100 | 1000 | 10000

/**
 * Current base click boost - starts at 0 for normal gameplay
 */
let currentBaseClickBoost: BaseClickMode = 0

/**
 * Get current base click boost
 */
export const getBaseClickBoost = (): BaseClickMode => currentBaseClickBoost

/**
 * Set base click boost
 */
export const setBaseClickBoost = (boost: BaseClickMode): void => {
  currentBaseClickBoost = boost
}

/**
 * Cycle to next base click boost mode
 */
export const cycleBaseClickBoost = (): BaseClickMode => {
  switch (currentBaseClickBoost) {
    case 0: currentBaseClickBoost = 10; break
    case 10: currentBaseClickBoost = 100; break
    case 100: currentBaseClickBoost = 1000; break
    case 1000: currentBaseClickBoost = 10000; break
    case 10000: currentBaseClickBoost = 0; break
  }
  return currentBaseClickBoost
}

/**
 * Create initial game state
 */
function createInitialGameState(): GameState {
  const now = Date.now()
  
  return {
    // Current dimension
    currentDimension: 1,
    
    // Dimension 1: Content (YouTube Creator)
    currency: ZERO, // Clicks - starts at 0
    views: ZERO, // Views - starts at 0
    engagement: 1, // Engagement level - starts at 1 (x1 multiplier)
    
    // Dimension 2: Influence (Corporate) - placeholder
    influence: ZERO, // Influence - not yet implemented
    
    // Basic game data
    totalClicks: 0,
    totalEarned: ZERO,
    gameStartTime: now,
    lastSaveTime: now,
    lastActiveTime: now,
    
    // Manual click rate tracking
    recentClicks: [], // Array of timestamps for recent clicks
    
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
    
    // Temporary effects
    temporaryEffects: [],
    
    // Bot simulation speed (1 = normal speed)
    simulationSpeed: 1,
    
    // Settings
    settings: { ...DEFAULT_SETTINGS },
  }
}

/**
 * Convert GameState to SerializableGameState for persistence
 */
function serializeGameState(state: GameState): SerializableGameState {
  return {
    currentDimension: state.currentDimension || 1, // Default to Dim 1
    currency: state.currency.toString(),
    views: state.views.toString(),
    engagement: state.engagement,
    influence: state.influence.toString(),
    
    totalClicks: state.totalClicks,
    totalEarned: state.totalEarned.toString(),
    gameStartTime: state.gameStartTime,
    lastSaveTime: state.lastSaveTime,
    lastActiveTime: state.lastActiveTime,
    
    recentClicks: state.recentClicks,
    
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
    
    temporaryEffects: state.temporaryEffects.map(effect => ({
      ...effect,
      value: effect.value.toString(),
    })),
    
    simulationSpeed: state.simulationSpeed,
    
    settings: state.settings,
  }
}

/**
 * Convert SerializableGameState back to GameState
 */
function deserializeGameState(serialized: SerializableGameState): GameState {
  return {
    currentDimension: serialized.currentDimension || 1, // Default to Dim 1 for old saves
    currency: decimal(serialized.currency),
    views: decimal(serialized.views || '0'), // Default to 0 for backward compatibility
    engagement: serialized.engagement || 1, // Default to 1 for backward compatibility
    influence: decimal(serialized.influence || '0'), // Default to 0 for backward compatibility
    
    totalClicks: serialized.totalClicks,
    totalEarned: decimal(serialized.totalEarned),
    gameStartTime: serialized.gameStartTime,
    lastSaveTime: serialized.lastSaveTime,
    lastActiveTime: serialized.lastActiveTime,
    
    recentClicks: serialized.recentClicks || [],
    
    clickMultiplier: decimal(serialized.clickMultiplier),
    baseClickValue: decimal(serialized.baseClickValue),
    
    idleGenerators: serialized.idleGenerators.map(gen => {
      // Find the original generator definition to restore functions
      const INITIAL_IDLE_GENERATORS = getInitialIdleGenerators()
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
      const INITIAL_UPGRADES = getInitialUpgrades()
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
    
    // Ensure temporaryEffects is always an array, even if not in save data
    temporaryEffects: (serialized.temporaryEffects || []).map(effect => ({
      ...effect,
      value: decimal(effect.value),
      apply: () => {}, // Will be restored by game engine
      remove: () => {}, // Will be restored by game engine
    })),
    
    simulationSpeed: serialized.simulationSpeed || 1, // Default to normal speed
    
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
  setEngagement: (level: number) => void
  updateInfluence: (amount: Decimal) => void
  addClicks: (count: number) => void
  addManualClick: () => void
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

      setEngagement: (level: number) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            engagement: level,
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
      
      addManualClick: () => {
        const now = Date.now()
        set((state) => {
          // Add current timestamp and filter out clicks older than 2 seconds
          const recentClicks = [...state.gameState.recentClicks, now]
            .filter(timestamp => now - timestamp <= 2000)
          
          return {
            gameState: {
              ...state.gameState,
              recentClicks,
              totalClicks: state.gameState.totalClicks + 1,
              lastActiveTime: now,
            },
          }
        })
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
        
        // Safety check: ensure gameState exists
        if (!gameState) {
          console.warn('Game state is undefined, returning initial state')
          return createInitialGameState()
        }
        
        // Ensure all Decimal fields are proper Decimal objects and temporaryEffects exists
        return {
          ...gameState,
          currentDimension: gameState.currentDimension || 1, // Default to Dim 1
          currency: decimal(gameState.currency || 0),
          views: decimal(gameState.views || 0),
          engagement: gameState.engagement || 1,
          influence: decimal(gameState.influence || 0),
          totalEarned: decimal(gameState.totalEarned || 0),
          baseClickValue: decimal(gameState.baseClickValue || 1),
          clickMultiplier: decimal(gameState.clickMultiplier || 1),
          idleMultiplier: decimal(gameState.idleMultiplier || 1),
          prestigePoints: decimal(gameState.prestigePoints || 0),
          metaPrestigePoints: decimal(gameState.metaPrestigePoints || 0),
          temporaryEffects: gameState.temporaryEffects || [], // Ensure temporaryEffects exists
          recentClicks: gameState.recentClicks || [], // Ensure recentClicks exists
        }
      },
      
      setGameState: (gameState: GameState) => {
        // Create a new reference for arrays to trigger React re-renders
        set({ 
          gameState: {
            ...gameState,
            upgrades: [...gameState.upgrades],
            idleGenerators: [...gameState.idleGenerators],
          }
        })
      },
      
      setSimulationSpeed: (speed: number) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            simulationSpeed: speed
          }
        }))
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
            currentDimension: persistedState.gameState.currentDimension || 1, // Default to Dim 1
            currency: decimal(persistedState.gameState.currency || 0),
            views: decimal(persistedState.gameState.views || 0),
            engagement: persistedState.gameState.engagement || 1,
            influence: decimal(persistedState.gameState.influence || 0),
            totalEarned: decimal(persistedState.gameState.totalEarned || 0),
            baseClickValue: decimal(persistedState.gameState.baseClickValue || 1),
            clickMultiplier: decimal(persistedState.gameState.clickMultiplier || 1),
            idleMultiplier: decimal(persistedState.gameState.idleMultiplier || 1),
            prestigePoints: decimal(persistedState.gameState.prestigePoints || 0),
            metaPrestigePoints: decimal(persistedState.gameState.metaPrestigePoints || 0),
            recentClicks: persistedState.gameState.recentClicks || [], // Ensure recentClicks exists
            temporaryEffects: persistedState.gameState.temporaryEffects || [], // Ensure temporaryEffects exists
            simulationSpeed: persistedState.gameState.simulationSpeed || 1, // Default to normal speed
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
export const useTotalEarned = () => useGameStore((state) => state.gameState.totalEarned)
export const useMetaPrestigePoints = () => useGameStore((state) => state.gameState.metaPrestigePoints)
export const useAchievements = () => useGameStore((state) => state.gameState.achievements)
export const useAutomation = () => useGameStore((state) => state.gameState.automationSystems)
export const useGameState = () => useGameStore((state) => state.gameState)

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
 * Rate calculation selectors
 */
export const useViewsPerSecond = () => {
  const gameState = useGameStore((state) => state.gameState)
  
  // Calculate total Views production per second from idle generators
  let totalProduction = decimal(0)
  
  for (const generator of gameState.idleGenerators) {
    if (generator.owned > 0) {
      const generatorProduction = decimal(generator.baseProduction).times(generator.owned)
      totalProduction = totalProduction.plus(generatorProduction)
    }
  }
  
  // Apply global idle multiplier
  totalProduction = totalProduction.times(gameState.idleMultiplier)
  
  return totalProduction
}

export const useClicksPerSecondFromViews = () => {
  const gameState = useGameStore((state) => state.gameState)
  const viewsPerSecond = useViewsPerSecond()
  
  // Calculate view-to-click efficiency based on total earned clicks and prestige multiplier
  const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
  const efficiency = calculateViewToClickEfficiency(gameState.totalEarned, strategyBonus, gameState.engagement)
  
  // Views convert to Clicks based on efficiency
  return viewsPerSecond.times(efficiency)
}

/**
 * Calculate total clicks per second from all sources
 */
export const useTotalClicksPerSecond = () => {
  const gameState = useGameStore((state) => state.gameState)
  const clicksFromViews = useClicksPerSecondFromViews()
  
  // Calculate manual click rate from recent clicks (2-second window)
  const now = Date.now()
  const recentClicks = gameState.recentClicks || [] // Safety check for undefined
  const recentClicksInWindow = recentClicks.filter(timestamp => now - timestamp <= 2000)
  const rawManualClickRate = decimal(recentClicksInWindow.length).dividedBy(2) // raw clicks per second
  
  // Calculate the actual currency value per manual click (including all multipliers)
  const baseClickValue = gameState.baseClickValue
  const clickMultiplier = gameState.clickMultiplier
  const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
  const valuePerClick = baseClickValue.times(clickMultiplier).times(strategyBonus)
  
  // Manual click rate in currency per second
  const manualClickRate = rawManualClickRate.times(valuePerClick)
  
  // Combine manual clicks with passive sources
  let totalClickRate = clicksFromViews.plus(manualClickRate)
  
  // Add automation systems if any (they also need to use the multiplied value)
  for (const automation of gameState.automationSystems) {
    if (automation.owned > 0) {
      const rawAutomationRate = decimal(automation.clicksPerSecond).times(automation.owned)
      const automationRate = rawAutomationRate.times(valuePerClick) // Apply same multipliers
      totalClickRate = totalClickRate.plus(automationRate)
    }
  }
  
  return totalClickRate
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
    addManualClick: store.addManualClick,
    updateLastActiveTime: store.updateLastActiveTime,
    updateSettings: store.updateSettings,
    updateInfluence: store.updateInfluence,
    resetGame: store.resetGame,
    saveGame: store.saveGame,
    loadGame: store.loadGame,
    exportSave: store.exportSave,
    importSave: store.importSave,
    getGameState: store.getGameState,
    setGameState: store.setGameState,
  }
}