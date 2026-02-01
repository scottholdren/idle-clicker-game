import Decimal from 'decimal.js'
import type { 
  GameEngine as IGameEngine, 
  GameState, 
  OfflineProgress,
  Upgrade,
  IdleGenerator,
  AutomationSystem,
  Achievement,
  SaveData,
  GameSettings
} from '../types/gameTypes'
import { useGameStore } from '../stores/gameStore'
import { decimal, add, multiply, greaterThanOrEqual, ZERO, ONE } from '../utils/decimal'

/**
 * Core Game Engine implementation
 */
export class GameEngine implements IGameEngine {
  private updateInterval: number | null = null
  private lastUpdateTime: number = Date.now()

  constructor() {
    this.startGameLoop()
  }

  /**
   * Get the current game store state
   */
  private getStore() {
    return useGameStore.getState()
  }

  /**
   * Start the main game loop
   */
  private startGameLoop(): void {
    this.updateInterval = window.setInterval(() => {
      this.update()
    }, 100) // Update every 100ms for smooth gameplay
  }

  /**
   * Stop the game loop
   */
  public stopGameLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * Main game update loop
   */
  private update(): void {
    const now = Date.now()
    const deltaTime = (now - this.lastUpdateTime) / 1000 // Convert to seconds
    this.lastUpdateTime = now

    // Update idle progress
    const idleEarnings = this.updateIdleProgress(deltaTime)
    
    // Update automation systems
    this.updateAutomation(deltaTime)
    
    // Check for achievements
    this.checkAchievements()
    
    // Auto-save if enabled
    this.handleAutoSave()
    
    // Update last active time
    this.getStore().updateLastActiveTime()
  }

  /**
   * Perform a click action
   */
  public performClick(): Decimal {
    const state = this.getGameState()
    const clickValue = multiply(state.baseClickValue, state.clickMultiplier)
    
    // Update currency and click count
    this.getStore().updateCurrency(clickValue)
    this.getStore().addClicks(1)
    
    return clickValue
  }

  /**
   * Update idle progress
   */
  public updateIdleProgress(deltaTime: number): Decimal {
    const state = this.getGameState()
    
    // Calculate total idle production
    const totalProduction = this.calculateTotalIdleProduction()
    
    if (totalProduction.equals(ZERO)) {
      return ZERO
    }
    
    // Calculate earnings for this time period
    const earnings = multiply(totalProduction, decimal(deltaTime))
    
    // Update currency
    this.getStore().updateCurrency(earnings)
    
    return earnings
  }

  /**
   * Calculate offline progress
   */
  public calculateOfflineProgress(offlineTime: number): OfflineProgress {
    const state = this.getGameState()
    const offlineHours = offlineTime / 3600 // Convert seconds to hours
    
    // Apply offline time cap
    const cappedHours = Math.min(offlineHours, state.maxOfflineHours)
    const cappedByTime = offlineHours > state.maxOfflineHours
    
    // Apply offline efficiency rate
    const effectiveHours = cappedHours * state.offlineProgressRate
    const cappedByEfficiency = state.offlineProgressRate < 1.0
    
    // Calculate idle earnings
    const totalProduction = this.calculateTotalIdleProduction()
    const idleEarnings = multiply(totalProduction, decimal(effectiveHours * 3600))
    
    // Calculate automation earnings
    const automationEarnings = this.calculateAutomationEarnings(effectiveHours * 3600)
    
    // Total currency earned
    const currencyEarned = add(idleEarnings, automationEarnings)
    
    // Simulate clicks (automation only)
    const clicksSimulated = this.calculateAutomationClicks(effectiveHours * 3600)
    
    return {
      timeOffline: offlineTime,
      currencyEarned,
      clicksSimulated,
      idleEarnings,
      automationEarnings,
      cappedByTime,
      cappedByEfficiency,
    }
  }

  /**
   * Calculate total idle production per second
   */
  public calculateTotalIdleProduction(): Decimal {
    const state = this.getGameState()
    let totalProduction = ZERO
    
    // Sum production from all generators
    for (const generator of state.idleGenerators) {
      if (generator.owned > 0) {
        const generatorProduction = multiply(
          generator.baseProduction,
          decimal(generator.owned)
        )
        totalProduction = add(totalProduction, generatorProduction)
      }
    }
    
    // Apply global idle multiplier
    totalProduction = multiply(totalProduction, state.idleMultiplier)
    
    return totalProduction
  }

  /**
   * Update automation systems
   */
  private updateAutomation(deltaTime: number): void {
    const state = this.getGameState()
    
    for (const automation of state.automationSystems) {
      if (automation.owned > 0) {
        // Calculate clicks per this update period
        const clicksPerSecond = multiply(automation.clicksPerSecond, decimal(automation.owned))
        const clicksThisUpdate = multiply(clicksPerSecond, decimal(deltaTime))
        
        // Perform automated clicks
        const totalClicks = Math.floor(clicksThisUpdate.toNumber())
        for (let i = 0; i < totalClicks; i++) {
          this.performClick()
        }
      }
    }
  }

  /**
   * Calculate automation earnings for offline progress
   */
  private calculateAutomationEarnings(seconds: number): Decimal {
    const state = this.getGameState()
    let totalEarnings = ZERO
    
    for (const automation of state.automationSystems) {
      if (automation.owned > 0) {
        const clicksPerSecond = multiply(automation.clicksPerSecond, decimal(automation.owned))
        const totalClicks = multiply(clicksPerSecond, decimal(seconds))
        const clickValue = multiply(state.baseClickValue, state.clickMultiplier)
        const earnings = multiply(totalClicks, clickValue)
        
        totalEarnings = add(totalEarnings, earnings)
      }
    }
    
    return totalEarnings
  }

  /**
   * Calculate automation clicks for offline progress
   */
  private calculateAutomationClicks(seconds: number): number {
    const state = this.getGameState()
    let totalClicks = 0
    
    for (const automation of state.automationSystems) {
      if (automation.owned > 0) {
        const clicksPerSecond = multiply(automation.clicksPerSecond, decimal(automation.owned))
        const clicks = multiply(clicksPerSecond, decimal(seconds))
        totalClicks += Math.floor(clicks.toNumber())
      }
    }
    
    return totalClicks
  }

  /**
   * Purchase an upgrade
   */
  public purchaseUpgrade(upgradeId: string): boolean {
    const state = this.getGameState()
    const upgrade = state.upgrades.find(u => u.id === upgradeId)
    
    if (!upgrade || !this.canAffordUpgrade(upgrade)) {
      return false
    }
    
    const cost = this.getUpgradeCost(upgrade)
    
    // Deduct cost
    this.getStore().updateCurrency(cost.negated())
    
    // Apply upgrade effect
    upgrade.effect.apply(state)
    
    // Update upgrade state
    upgrade.currentPurchases++
    
    // Mark as purchased if it's a one-time upgrade
    if (upgrade.maxPurchases === 1) {
      state.purchasedUpgrades.add(upgradeId)
    }
    
    return true
  }

  /**
   * Check if player can afford an upgrade
   */
  public canAffordUpgrade(upgrade: Upgrade): boolean {
    const state = this.getGameState()
    
    if (!upgrade.unlocked || upgrade.currentPurchases >= upgrade.maxPurchases) {
      return false
    }
    
    const cost = this.getUpgradeCost(upgrade)
    return greaterThanOrEqual(state.currency, cost)
  }

  /**
   * Get the cost of an upgrade
   */
  public getUpgradeCost(upgrade: Upgrade): Decimal {
    if (upgrade.currentPurchases === 0) {
      return upgrade.baseCost
    }
    
    // Exponential cost scaling
    const multiplier = upgrade.costMultiplier.pow(upgrade.currentPurchases)
    return multiply(upgrade.baseCost, multiplier)
  }

  /**
   * Purchase idle generators
   */
  public purchaseGenerator(generatorId: string, amount: number = 1): boolean {
    const state = this.getGameState()
    const generator = state.idleGenerators.find(g => g.id === generatorId)
    
    if (!generator || !this.canAffordGenerator(generator, amount)) {
      return false
    }
    
    const cost = this.getGeneratorCost(generator, amount)
    
    // Deduct cost
    this.getStore().updateCurrency(cost.negated())
    
    // Add generators
    generator.owned += amount
    
    return true
  }

  /**
   * Check if player can afford generators
   */
  public canAffordGenerator(generator: IdleGenerator, amount: number = 1): boolean {
    const state = this.getGameState()
    
    if (!generator.unlocked) {
      return false
    }
    
    const cost = this.getGeneratorCost(generator, amount)
    return greaterThanOrEqual(state.currency, cost)
  }

  /**
   * Get the cost of purchasing generators
   */
  public getGeneratorCost(generator: IdleGenerator, amount: number = 1): Decimal {
    let totalCost = ZERO
    
    for (let i = 0; i < amount; i++) {
      const currentOwned = generator.owned + i
      const multiplier = generator.costMultiplier.pow(currentOwned)
      const cost = multiply(generator.baseCost, multiplier)
      totalCost = add(totalCost, cost)
    }
    
    return totalCost
  }

  /**
   * Check if player can prestige
   */
  public canPrestige(): boolean {
    // Implement prestige requirements
    // For now, require at least 1000 total currency earned
    const state = this.getGameState()
    return greaterThanOrEqual(state.totalEarned, decimal(1000))
  }

  /**
   * Perform prestige reset
   */
  public performPrestige(): void {
    if (!this.canPrestige()) {
      return
    }
    
    const prestigeGain = this.calculatePrestigeGain()
    const state = this.getGameState()
    
    // Reset base progress
    const newState: GameState = {
      ...state,
      currency: ZERO,
      totalClicks: 0,
      totalEarned: ZERO,
      baseClickValue: ONE,
      clickMultiplier: ONE,
      idleGenerators: state.idleGenerators.map(g => ({ ...g, owned: 0 })),
      idleMultiplier: ONE,
      upgrades: state.upgrades.map(u => ({ ...u, currentPurchases: 0 })),
      purchasedUpgrades: new Set<string>(),
      automationSystems: state.automationSystems.map(a => ({ ...a, owned: 0 })),
      
      // Keep prestige progress
      prestigePoints: add(state.prestigePoints, prestigeGain),
      totalPrestiges: state.totalPrestiges + 1,
      
      // Keep meta prestige and achievements
      metaPrestigePoints: state.metaPrestigePoints,
      metaPrestigeUpgrades: state.metaPrestigeUpgrades,
      purchasedMetaPrestigeUpgrades: state.purchasedMetaPrestigeUpgrades,
      totalMetaPrestiges: state.totalMetaPrestiges,
      achievements: state.achievements,
      unlockedAchievements: state.unlockedAchievements,
      
      // Reset times
      gameStartTime: Date.now(),
      lastSaveTime: Date.now(),
      lastActiveTime: Date.now(),
    }
    
    this.getStore().setGameState(newState)
  }

  /**
   * Calculate prestige gain
   */
  public calculatePrestigeGain(): Decimal {
    const state = this.getGameState()
    // Simple formula: sqrt(totalEarned / 1000)
    const gain = state.totalEarned.dividedBy(1000).sqrt().floor()
    return gain.greaterThan(ZERO) ? gain : ONE
  }

  /**
   * Purchase prestige upgrade
   */
  public purchasePrestigeUpgrade(upgradeId: string): boolean {
    // Implementation will be added when prestige upgrades are defined
    return false
  }

  /**
   * Check if player can meta prestige
   */
  public canMetaPrestige(): boolean {
    const state = this.getGameState()
    return state.totalPrestiges >= 10 && greaterThanOrEqual(state.prestigePoints, decimal(1000))
  }

  /**
   * Perform meta prestige reset
   */
  public performMetaPrestige(): void {
    if (!this.canMetaPrestige()) {
      return
    }
    
    const metaPrestigeGain = this.calculateMetaPrestigeGain()
    const state = this.getGameState()
    
    // Reset everything except meta prestige and achievements
    const newState: GameState = {
      ...state,
      currency: ZERO,
      totalClicks: 0,
      totalEarned: ZERO,
      baseClickValue: ONE,
      clickMultiplier: ONE,
      idleGenerators: state.idleGenerators.map(g => ({ ...g, owned: 0 })),
      idleMultiplier: ONE,
      offlineProgressRate: 0,
      maxOfflineHours: 1,
      upgrades: state.upgrades.map(u => ({ ...u, currentPurchases: 0 })),
      purchasedUpgrades: new Set<string>(),
      prestigePoints: ZERO,
      prestigeUpgrades: state.prestigeUpgrades.map(u => ({ ...u, currentPurchases: 0 })),
      purchasedPrestigeUpgrades: new Set<string>(),
      totalPrestiges: 0,
      automationSystems: state.automationSystems.map(a => ({ ...a, owned: 0 })),
      
      // Keep meta prestige progress
      metaPrestigePoints: add(state.metaPrestigePoints, metaPrestigeGain),
      totalMetaPrestiges: state.totalMetaPrestiges + 1,
      
      // Keep achievements
      achievements: state.achievements,
      unlockedAchievements: state.unlockedAchievements,
      
      // Reset times
      gameStartTime: Date.now(),
      lastSaveTime: Date.now(),
      lastActiveTime: Date.now(),
    }
    
    this.getStore().setGameState(newState)
  }

  /**
   * Calculate meta prestige gain
   */
  public calculateMetaPrestigeGain(): Decimal {
    const state = this.getGameState()
    // Formula: sqrt(prestigePoints / 100)
    const gain = state.prestigePoints.dividedBy(100).sqrt().floor()
    return gain.greaterThan(ZERO) ? gain : ONE
  }

  /**
   * Purchase meta prestige upgrade
   */
  public purchaseMetaPrestigeUpgrade(upgradeId: string): boolean {
    // Implementation will be added when meta prestige upgrades are defined
    return false
  }

  /**
   * Purchase automation systems
   */
  public purchaseAutomation(automationId: string, amount: number = 1): boolean {
    const state = this.getGameState()
    const automation = state.automationSystems.find(a => a.id === automationId)
    
    if (!automation || !this.canAffordAutomation(automation, amount)) {
      return false
    }
    
    const cost = this.getAutomationCost(automation, amount)
    
    // Deduct cost
    this.getStore().updateCurrency(cost.negated())
    
    // Add automation
    automation.owned += amount
    
    return true
  }

  /**
   * Check if player can afford automation
   */
  public canAffordAutomation(automation: AutomationSystem, amount: number = 1): boolean {
    const state = this.getGameState()
    
    if (!automation.unlocked) {
      return false
    }
    
    const cost = this.getAutomationCost(automation, amount)
    return greaterThanOrEqual(state.currency, cost)
  }

  /**
   * Get automation cost
   */
  public getAutomationCost(automation: AutomationSystem, amount: number = 1): Decimal {
    let totalCost = ZERO
    
    for (let i = 0; i < amount; i++) {
      const currentOwned = automation.owned + i
      const multiplier = automation.costMultiplier.pow(currentOwned)
      const cost = multiply(automation.baseCost, multiplier)
      totalCost = add(totalCost, cost)
    }
    
    return totalCost
  }

  /**
   * Check achievements
   */
  public checkAchievements(): Achievement[] {
    const state = this.getGameState()
    const newlyUnlocked: Achievement[] = []
    
    for (const achievement of state.achievements) {
      if (!achievement.unlocked && achievement.unlockCondition(state)) {
        achievement.unlocked = true
        state.unlockedAchievements.add(achievement.id)
        
        // Apply reward if exists
        if (achievement.reward) {
          achievement.reward.apply(state)
        }
        
        newlyUnlocked.push(achievement)
      }
    }
    
    return newlyUnlocked
  }

  /**
   * Unlock specific achievement
   */
  public unlockAchievement(achievementId: string): boolean {
    const state = this.getGameState()
    const achievement = state.achievements.find(a => a.id === achievementId)
    
    if (!achievement || achievement.unlocked) {
      return false
    }
    
    achievement.unlocked = true
    state.unlockedAchievements.add(achievementId)
    
    if (achievement.reward) {
      achievement.reward.apply(state)
    }
    
    return true
  }

  /**
   * Save game
   */
  public saveGame(): void {
    this.getStore().saveGame()
  }

  /**
   * Load game
   */
  public loadGame(saveData: SaveData): boolean {
    try {
      this.getStore().loadGame(saveData)
      return true
    } catch (error) {
      console.error('Failed to load game:', error)
      return false
    }
  }

  /**
   * Export save
   */
  public exportSave(): string {
    return this.getStore().exportSave()
  }

  /**
   * Import save
   */
  public importSave(saveString: string): boolean {
    return this.getStore().importSave(saveString)
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return this.getStore().getGameState()
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<GameSettings>): void {
    this.getStore().updateSettings(settings)
  }

  /**
   * Reset game
   */
  public resetGame(): void {
    this.getStore().resetGame()
  }

  /**
   * Handle auto-save
   */
  private handleAutoSave(): void {
    const state = this.getGameState()
    
    if (!state.settings.autoSave) {
      return
    }
    
    const now = Date.now()
    const timeSinceLastSave = (now - state.lastSaveTime) / 1000
    
    if (timeSinceLastSave >= state.settings.autoSaveInterval) {
      this.saveGame()
    }
  }
}

/**
 * Global game engine instance
 */
export const gameEngine = new GameEngine()