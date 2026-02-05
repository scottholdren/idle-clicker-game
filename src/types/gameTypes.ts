import Decimal from 'decimal.js'

/**
 * Core game state interface
 */
export interface GameState {
  // Current dimension (1, 2, or 3)
  currentDimension: 1 | 2 | 3
  
  // Dimension 1: Content (YouTube Creator)
  currency: Decimal // Tier 1: Clicks - base currency from manual clicking
  views: Decimal // Tier 2: Views - passive resource from generators
  engagement: number // Permanent multiplier level for Dim 1 only (purchased with SP, starts at 1)
  
  // Dimension 2: Influence (Corporate) - placeholder for future
  influence: Decimal // Dim 2 prestige currency (not yet implemented)
  
  // Basic game data
  totalClicks: number
  totalEarned: Decimal
  gameStartTime: number
  lastSaveTime: number
  lastActiveTime: number
  
  // Manual click rate tracking
  recentClicks: number[] // Timestamps of recent manual clicks
  
  // Click system
  clickMultiplier: Decimal
  baseClickValue: Decimal
  
  // Idle system
  idleGenerators: IdleGenerator[]
  idleMultiplier: Decimal
  offlineProgressRate: number // 0.0 to 1.0 (starts at 0, unlocked via prestige)
  maxOfflineHours: number
  
  // Upgrades
  upgrades: Upgrade[]
  purchasedUpgrades: Set<string>
  
  // Prestige system
  prestigePoints: Decimal
  prestigeUpgrades: PrestigeUpgrade[]
  purchasedPrestigeUpgrades: Set<string>
  totalPrestiges: number
  
  // Meta prestige system
  metaPrestigePoints: Decimal
  metaPrestigeUpgrades: MetaPrestigeUpgrade[]
  purchasedMetaPrestigeUpgrades: Set<string>
  totalMetaPrestiges: number
  
  // Automation
  automationSystems: AutomationSystem[]
  
  // Achievements
  achievements: Achievement[]
  unlockedAchievements: Set<string>
  
  // Temporary effects
  temporaryEffects: TemporaryEffect[]
  
  // Bot simulation speed (1 = normal, 100 = 100x speed)
  simulationSpeed: number
  
  // Settings
  settings: GameSettings
}

/**
 * Idle generator interface
 */
export interface IdleGenerator {
  id: string
  name: string
  description: string
  baseProduction: Decimal
  baseCost: Decimal
  costMultiplier: Decimal
  owned: number
  unlocked: boolean
  unlockCondition?: (gameState: GameState) => boolean
}

/**
 * Upgrade interface
 */
export interface Upgrade {
  id: string
  name: string
  description: string
  baseCost: Decimal
  costMultiplier: Decimal
  maxPurchases: number
  currentPurchases: number
  unlocked: boolean
  unlockCondition?: (gameState: GameState) => boolean
  effect: UpgradeEffect
}

/**
 * Temporary effect interface
 */
export interface TemporaryEffect {
  id: string
  name: string
  type: 'clickMultiplier' | 'idleMultiplier' | 'special'
  value: Decimal
  startTime: number
  duration: number // in milliseconds
  apply: (gameState: GameState) => void
  remove: (gameState: GameState) => void
}

/**
 * Upgrade effect interface
 */
export interface UpgradeEffect {
  type: 'clickMultiplier' | 'idleMultiplier' | 'automation' | 'special'
  value: Decimal
  target?: string // For targeted effects
  apply: (gameState: GameState) => void
}

/**
 * Prestige upgrade interface
 */
export interface PrestigeUpgrade {
  id: string
  name: string
  description: string
  baseCost: Decimal
  costMultiplier: Decimal
  maxPurchases: number
  currentPurchases: number
  unlocked: boolean
  unlockCondition?: () => boolean
  effect: PrestigeEffect
}

/**
 * Prestige effect interface
 */
export interface PrestigeEffect {
  type: 'offlineRate' | 'offlineTime' | 'globalMultiplier' | 'automation' | 'special'
  value: Decimal
  target?: string
  apply: (gameState: GameState) => void
}

/**
 * Meta prestige upgrade interface
 */
export interface MetaPrestigeUpgrade {
  id: string
  name: string
  description: string
  baseCost: Decimal
  costMultiplier: Decimal
  maxPurchases: number
  currentPurchases: number
  unlocked: boolean
  unlockCondition?: () => boolean
  effect: MetaPrestigeEffect
}

/**
 * Meta prestige effect interface
 */
export interface MetaPrestigeEffect {
  type: 'prestigeMultiplier' | 'globalMultiplier' | 'automation' | 'special'
  value: Decimal
  target?: string
  apply: (gameState: GameState) => void
}

/**
 * Automation system interface
 */
export interface AutomationSystem {
  id: string
  name: string
  description: string
  baseCost: Decimal
  costMultiplier: Decimal
  owned: number
  unlocked: boolean
  unlockCondition?: () => boolean
  clicksPerSecond: Decimal
  efficiency: Decimal // Multiplier for automation effectiveness
}

/**
 * Achievement interface
 */
export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  unlockCondition: (gameState: GameState) => boolean
  reward?: AchievementReward
  category: 'clicking' | 'idle' | 'prestige' | 'meta' | 'special'
}

/**
 * Achievement reward interface
 */
export interface AchievementReward {
  type: 'clickMultiplier' | 'idleMultiplier' | 'currency' | 'special'
  value: Decimal
  apply: (gameState: GameState) => void
}

/**
 * Game settings interface
 */
export interface GameSettings {
  numberFormat: 'suffix' | 'scientific'
  autoSave: boolean
  autoSaveInterval: number // in seconds
  showTooltips: boolean
  showNotifications: boolean
  offlineProgressNotification: boolean
  theme: 'light' | 'dark' | 'auto'
}

/**
 * Save data interface
 */
export interface SaveData {
  version: string
  timestamp: number
  gameState: SerializableGameState
  settings: GameSettings
}

/**
 * Serializable game state (for save/load)
 */
export interface SerializableGameState {
  // Current dimension
  currentDimension: 1 | 2 | 3
  
  // Convert Decimals to strings and Sets to arrays for JSON serialization
  currency: string // Clicks
  views: string // Views
  engagement: number // Engagement level
  influence: string // Influence
  
  totalClicks: number
  totalEarned: string
  gameStartTime: number
  lastSaveTime: number
  lastActiveTime: number
  
  recentClicks: number[]
  
  clickMultiplier: string
  baseClickValue: string
  
  idleGenerators: SerializableIdleGenerator[]
  idleMultiplier: string
  offlineProgressRate: number
  maxOfflineHours: number
  
  upgrades: SerializableUpgrade[]
  purchasedUpgrades: string[]
  
  prestigePoints: string
  prestigeUpgrades: SerializablePrestigeUpgrade[]
  purchasedPrestigeUpgrades: string[]
  totalPrestiges: number
  
  metaPrestigePoints: string
  metaPrestigeUpgrades: SerializableMetaPrestigeUpgrade[]
  purchasedMetaPrestigeUpgrades: string[]
  totalMetaPrestiges: number
  
  automationSystems: SerializableAutomationSystem[]
  
  achievements: SerializableAchievement[]
  unlockedAchievements: string[]
  
  temporaryEffects: SerializableTemporaryEffect[]
  
  simulationSpeed: number
  
  settings: GameSettings
}

/**
 * Serializable versions of complex interfaces
 */
export interface SerializableIdleGenerator extends Omit<IdleGenerator, 'baseProduction' | 'baseCost' | 'costMultiplier'> {
  baseProduction: string
  baseCost: string
  costMultiplier: string
}

export interface SerializableUpgrade extends Omit<Upgrade, 'baseCost' | 'costMultiplier' | 'effect'> {
  baseCost: string
  costMultiplier: string
  effect: SerializableUpgradeEffect
}

export interface SerializableUpgradeEffect extends Omit<UpgradeEffect, 'value' | 'apply'> {
  value: string
}

export interface SerializablePrestigeUpgrade extends Omit<PrestigeUpgrade, 'baseCost' | 'costMultiplier' | 'effect'> {
  baseCost: string
  costMultiplier: string
  effect: SerializablePrestigeEffect
}

export interface SerializablePrestigeEffect extends Omit<PrestigeEffect, 'value' | 'apply'> {
  value: string
}

export interface SerializableMetaPrestigeUpgrade extends Omit<MetaPrestigeUpgrade, 'baseCost' | 'costMultiplier' | 'effect'> {
  baseCost: string
  costMultiplier: string
  effect: SerializableMetaPrestigeEffect
}

export interface SerializableMetaPrestigeEffect extends Omit<MetaPrestigeEffect, 'value' | 'apply'> {
  value: string
}

export interface SerializableAutomationSystem extends Omit<AutomationSystem, 'baseCost' | 'costMultiplier' | 'clicksPerSecond' | 'efficiency'> {
  baseCost: string
  costMultiplier: string
  clicksPerSecond: string
  efficiency: string
}

export interface SerializableAchievement extends Omit<Achievement, 'unlockCondition' | 'reward'> {
  reward?: SerializableAchievementReward
}

export interface SerializableAchievementReward extends Omit<AchievementReward, 'value' | 'apply'> {
  value: string
}

export interface SerializableTemporaryEffect extends Omit<TemporaryEffect, 'value' | 'apply' | 'remove'> {
  value: string
}

/**
 * Offline progress calculation result
 */
export interface OfflineProgress {
  timeOffline: number // in seconds
  currencyEarned: Decimal
  clicksSimulated: number
  idleEarnings: Decimal
  automationEarnings: Decimal
  cappedByTime: boolean
  cappedByEfficiency: boolean
}

/**
 * Game engine interface
 */
export interface GameEngine {
  // Core mechanics
  performClick(): Decimal
  updateIdleProgress(deltaTime: number): Decimal
  calculateOfflineProgress(offlineTime: number): OfflineProgress
  
  // Upgrade system
  purchaseUpgrade(upgradeId: string): boolean
  canAffordUpgrade(upgrade: Upgrade): boolean
  getUpgradeCost(upgrade: Upgrade): Decimal
  
  // Idle generator system
  purchaseGenerator(generatorId: string, amount?: number): boolean
  canAffordGenerator(generator: IdleGenerator, amount?: number): boolean
  getGeneratorCost(generator: IdleGenerator, amount?: number): Decimal
  calculateTotalIdleProduction(): Decimal
  
  // Prestige system
  canPrestige(): boolean
  performPrestige(): void
  calculatePrestigeGain(): Decimal
  purchasePrestigeUpgrade(upgradeId: string): boolean
  
  // Meta prestige system
  canMetaPrestige(): boolean
  performMetaPrestige(): void
  calculateMetaPrestigeGain(): Decimal
  purchaseMetaPrestigeUpgrade(upgradeId: string): boolean
  
  // Automation system
  purchaseAutomation(automationId: string, amount?: number): boolean
  canAffordAutomation(automation: AutomationSystem, amount?: number): boolean
  getAutomationCost(automation: AutomationSystem, amount?: number): Decimal
  
  // Achievement system
  checkAchievements(): Achievement[]
  unlockAchievement(achievementId: string): boolean
  
  // Save system
  saveGame(): void
  loadGame(saveData: SaveData): boolean
  exportSave(): string
  importSave(saveString: string): boolean
  
  // Utility methods
  getGameState(): GameState
  updateSettings(settings: Partial<GameSettings>): void
  resetGame(): void
}

/**
 * Click handler interface
 */
export interface ClickHandler {
  baseClickValue: Decimal
  clickMultipliers: Decimal[]
  
  processClick(): Decimal
  calculateClickValue(): Decimal
  addClickMultiplier(multiplier: Decimal): void
  removeClickMultiplier(index: number): void
  clearClickMultipliers(): void
}

/**
 * Idle system interface
 */
export interface IdleSystem {
  generators: IdleGenerator[]
  globalMultiplier: Decimal
  offlineProgressRate: number
  maxOfflineHours: number
  
  calculateTotalProduction(): Decimal
  updateProduction(deltaTime: number): Decimal
  calculateOfflineProduction(hours: number): Decimal
  purchaseGenerator(generatorId: string, amount?: number): boolean
  getGenerator(generatorId: string): IdleGenerator | undefined
}

/**
 * Event types for game state changes
 */
export type GameEvent = 
  | { type: 'CLICK_PERFORMED'; payload: { amount: Decimal } }
  | { type: 'CURRENCY_EARNED'; payload: { amount: Decimal; source: string } }
  | { type: 'UPGRADE_PURCHASED'; payload: { upgradeId: string; cost: Decimal } }
  | { type: 'GENERATOR_PURCHASED'; payload: { generatorId: string; amount: number; cost: Decimal } }
  | { type: 'PRESTIGE_PERFORMED'; payload: { prestigePoints: Decimal } }
  | { type: 'META_PRESTIGE_PERFORMED'; payload: { metaPrestigePoints: Decimal } }
  | { type: 'ACHIEVEMENT_UNLOCKED'; payload: { achievementId: string } }
  | { type: 'AUTOMATION_PURCHASED'; payload: { automationId: string; amount: number; cost: Decimal } }
  | { type: 'OFFLINE_PROGRESS'; payload: OfflineProgress }
  | { type: 'GAME_SAVED'; payload: { timestamp: number } }
  | { type: 'GAME_LOADED'; payload: { timestamp: number } }