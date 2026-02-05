import { gameEngine } from '../engine/gameEngine'
import { BotLogger, type BotSession } from './BotLogger'
import { BotStrategy } from './BotStrategy'
import { calculateStrategyPointsMultiplier } from '../utils/decimal'
import type { GameState } from '../types/gameTypes'
import { useGameStore } from '../stores/gameStore'

export interface BotConfig {
  mode: 'active' | 'passive'
  speed: 'realtime' | 'simulated'
  simulationSpeed?: number // For simulated mode (e.g., 10 = 10x speed)
  maxPrestiges?: number // Stop after N prestiges
  maxDuration?: number // Stop after N milliseconds
  maxSP?: number // Stop when reaching this many SP
  maxInfluence?: number // Stop when reaching this much influence
}

export type BotStatus = 'idle' | 'running' | 'paused' | 'completed'

/**
 * Main bot controller for automated gameplay
 */
export class GameBot {
  private logger: BotLogger
  private strategy: BotStrategy
  private status: BotStatus = 'idle'
  private config: BotConfig | null = null
  private lastCompletedSession: BotSession | null = null // Store last completed session
  
  // Timing
  private updateInterval: number | null = null
  private lastUpdateTime: number = 0
  private prestigeStartTime: number = 0
  
  // Passive mode state
  private passiveClickBank: number = 0
  private lastPassiveClickTime: number = 0
  
  // Stats
  private currentPrestigeNumber: number = 0
  private manualClicksThisPrestige: number = 0
  private totalClicksThisPrestige: number = 0
  
  // Click rate tracking
  private clickRateWindow: number[] = [] // Recent click counts per update
  private clickRateWindowSize: number = 10 // Track last 10 updates

  constructor() {
    this.logger = new BotLogger()
    this.strategy = new BotStrategy()
  }

  /**
   * Start the bot
   */
  start(config: BotConfig): void {
    if (this.status === 'running') {
      return
    }

    this.config = config
    this.status = 'running'
    this.currentPrestigeNumber = 0
    this.prestigeStartTime = Date.now()
    
    // Set simulation speed in game state using the store
    const simulationSpeed = config.speed === 'simulated' && config.simulationSpeed ? config.simulationSpeed : 1
    const currentState = gameEngine.getGameState()
    currentState.simulationSpeed = simulationSpeed
    useGameStore.getState().setGameState(currentState)
    
    // Start logging session
    this.logger.startSession(config.mode, config.speed, config.simulationSpeed)
    
    // Start first prestige log
    const gameState = gameEngine.getGameState()
    this.logger.startPrestige(this.currentPrestigeNumber, gameState.prestigePoints)
    
    // Initialize timing
    this.lastUpdateTime = Date.now()
    this.lastPassiveClickTime = Date.now()
    this.passiveClickBank = 0
    this.manualClicksThisPrestige = 0
    this.totalClicksThisPrestige = 0
    
    // Start update loop
    const updateRate = config.speed === 'realtime' ? 100 : 50 // ms (slower for simulated to reduce load)
    this.updateInterval = window.setInterval(() => this.update(), updateRate)
  }

  /**
   * Stop the bot
   */
  stop(): BotSession | null {
    if (this.status !== 'running' && this.status !== 'paused') {
      return null
    }

    this.status = 'completed'
    
    // Reset simulation speed to normal
    const currentState = gameEngine.getGameState()
    currentState.simulationSpeed = 1
    useGameStore.getState().setGameState(currentState)
    
    // Stop update loop
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    // End current prestige log
    this.endPrestigeLog()
    
    // End session and get report
    const gameState = gameEngine.getGameState()
    const session = this.logger.endSession(this.exportGameState(gameState))
    
    // Store the completed session
    this.lastCompletedSession = session
    
    return session
  }

  /**
   * Pause the bot
   */
  pause(): void {
    if (this.status === 'running') {
      this.status = 'paused'
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
        this.updateInterval = null
      }
    }
  }

  /**
   * Resume the bot
   */
  resume(): void {
    if (this.status === 'paused' && this.config) {
      this.status = 'running'
      const updateRate = this.config.speed === 'realtime' ? 100 : 50
      this.updateInterval = window.setInterval(() => this.update(), updateRate)
    }
  }

  /**
   * Main update loop
   */
  private update(): void {
    if (!this.config || this.status !== 'running') {
      return
    }

    const now = Date.now()
    let deltaTime = (now - this.lastUpdateTime) / 1000 // seconds
    
    // Apply simulation speed multiplier
    if (this.config.speed === 'simulated' && this.config.simulationSpeed) {
      deltaTime *= this.config.simulationSpeed
    }
    
    this.lastUpdateTime = now

    // Limit deltaTime to prevent excessive updates in a single frame
    // This prevents the bot from overwhelming the game engine
    const maxDeltaTime = 1.0 // Max 1 second of game time per update
    if (deltaTime > maxDeltaTime) {
      deltaTime = maxDeltaTime
    }

    // Update passive click bank
    if (this.config.mode === 'passive') {
      this.updatePassiveClicks(deltaTime)
    }

    // Perform actions
    if (this.config.mode === 'active') {
      this.performActiveActions(deltaTime)
    } else {
      this.performPassiveActions(deltaTime)
    }

    // Check prestige condition
    this.checkPrestige()

    // Check stop conditions
    this.checkStopConditions()
  }

  /**
   * Update passive click bank (100 clicks per hour)
   */
  private updatePassiveClicks(deltaTime: number): void {
    const clicksPerSecond = 100 / 3600 // 100 clicks per hour
    this.passiveClickBank += clicksPerSecond * deltaTime
  }

  /**
   * Perform actions in active mode
   */
  private performActiveActions(deltaTime: number): void {
    const gameState = gameEngine.getGameState()
    
    // Click continuously (assume 10 clicks per second in active mode)
    // But cap at 100 clicks per update to prevent overwhelming the system
    const clicksToPerform = Math.min(Math.floor(10 * deltaTime), 100)
    for (let i = 0; i < clicksToPerform; i++) {
      gameEngine.performClick()
      this.manualClicksThisPrestige++
      this.totalClicksThisPrestige++
    }
    
    // Track click rate for strategy
    this.updateClickRate(clicksToPerform, deltaTime)

    // Make purchases
    this.makePurchases(gameState)
  }

  /**
   * Perform actions in passive mode
   */
  private performPassiveActions(deltaTime: number): void {
    const gameState = gameEngine.getGameState()
    
    // Decide if we should use clicks
    const availableClicks = Math.floor(this.passiveClickBank)
    let clicksUsed = 0
    
    if (availableClicks > 0) {
      const clicksToUse = this.strategy.shouldClickInPassiveMode(gameState, availableClicks)
      
      if (clicksToUse > 0) {
        for (let i = 0; i < clicksToUse; i++) {
          gameEngine.performClick()
          this.manualClicksThisPrestige++
          this.totalClicksThisPrestige++
        }
        this.passiveClickBank -= clicksToUse
        clicksUsed = clicksToUse
      }
    }
    
    // Track click rate for strategy
    this.updateClickRate(clicksUsed, deltaTime)

    // Make purchases (passive mode still auto-purchases)
    this.makePurchases(gameState)
  }
  
  /**
   * Update click rate tracking for strategy calculations
   */
  private updateClickRate(clicksThisUpdate: number, deltaTime: number): void {
    // Calculate clicks per second for this update
    const clicksPerSecond = deltaTime > 0 ? clicksThisUpdate / deltaTime : 0
    
    // Add to rolling window
    this.clickRateWindow.push(clicksPerSecond)
    if (this.clickRateWindow.length > this.clickRateWindowSize) {
      this.clickRateWindow.shift()
    }
    
    // Calculate average click rate
    const avgClickRate = this.clickRateWindow.reduce((sum, rate) => sum + rate, 0) / this.clickRateWindow.length
    
    // Update strategy with current click rate
    this.strategy.updateClickRate(avgClickRate)
  }

  /**
   * Make optimal purchases
   */
  private makePurchases(gameState: GameState): void {
    // Adjust batch size based on simulation speed
    // At low speeds (≤10x), make 1 purchase per update for accurate UI feedback
    // At high speeds (>10x), batch purchases for better performance
    const simulationSpeed = this.config?.simulationSpeed || 1
    const maxPurchasesPerUpdate = simulationSpeed <= 10 ? 1 : 10
    
    let purchasesMade = 0
    
    while (purchasesMade < maxPurchasesPerUpdate) {
      // Refresh game state to get latest unlock status
      gameState = gameEngine.getGameState()
      
      const decision = this.strategy.decideNextPurchase(gameState)
      
      if (decision.type === 'none') {
        break
      }

      let success = false
      
      if (decision.type === 'generator' && decision.id) {
        success = gameEngine.purchaseGenerator(decision.id, decision.amount || 1)
      } else if (decision.type === 'upgrade' && decision.id) {
        success = gameEngine.purchaseUpgrade(decision.id)
      }

      if (success && decision.cost && decision.name) {
        this.logger.logPurchase(
          decision.type,
          decision.id || 'unknown',
          decision.name,
          decision.amount || 1,
          decision.cost,
          decision.reason || 'Optimal purchase'
        )
        purchasesMade++
      } else {
        break
      }
    }
  }

  /**
   * Check if we should prestige
   */
  private checkPrestige(): void {
    const gameState = gameEngine.getGameState()
    const currentDuration = Date.now() - this.prestigeStartTime
    
    if (gameEngine.canPrestige() && this.strategy.shouldPrestige(gameState, currentDuration)) {
      this.performPrestige()
    }
  }

  /**
   * Perform prestige
   */
  private performPrestige(): void {
    const gameState = gameEngine.getGameState()
    const gainedSP = gameEngine.calculatePrestigeGain()
    
    // End current prestige log
    this.endPrestigeLog()
    
    // Perform prestige
    gameEngine.performPrestige()
    
    // Start new prestige
    this.currentPrestigeNumber++
    this.prestigeStartTime = Date.now()
    this.manualClicksThisPrestige = 0
    this.totalClicksThisPrestige = 0
    
    const newGameState = gameEngine.getGameState()
    this.logger.startPrestige(this.currentPrestigeNumber, newGameState.prestigePoints)
  }

  /**
   * End prestige logging
   */
  private endPrestigeLog(): void {
    const gameState = gameEngine.getGameState()
    const gainedSP = gameEngine.calculatePrestigeGain()
    const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
    
    this.logger.endPrestige(
      gainedSP,
      gameState.prestigePoints.plus(gainedSP),
      this.totalClicksThisPrestige,
      this.manualClicksThisPrestige,
      {
        clickMultiplier: gameState.clickMultiplier,
        idleMultiplier: gameState.idleMultiplier,
        strategyBonus,
        engagement: gameState.engagement
      },
      gameState.currency,
      gameState.views
    )
  }

  /**
   * Check stop conditions
   */
  private checkStopConditions(): void {
    if (!this.config) return

    const gameState = gameEngine.getGameState()
    const session = this.logger.getCurrentSession()
    
    if (!session) return

    // Check max prestiges
    if (this.config.maxPrestiges && session.prestiges.length >= this.config.maxPrestiges) {
      this.stop()
      return
    }

    // Check max duration
    if (this.config.maxDuration) {
      const elapsed = Date.now() - session.startTime
      if (elapsed >= this.config.maxDuration) {
        this.stop()
        return
      }
    }

    // Check max SP
    if (this.config.maxSP && gameState.prestigePoints.greaterThanOrEqualTo(this.config.maxSP)) {
      this.stop()
      return
    }

    // Check max influence
    if (this.config.maxInfluence && gameState.influence.greaterThanOrEqualTo(this.config.maxInfluence)) {
      this.stop()
      return
    }
  }

  /**
   * Export game state for save/load
   */
  private exportGameState(gameState: GameState): any {
    return {
      currency: gameState.currency.toString(),
      views: gameState.views.toString(),
      totalEarned: gameState.totalEarned.toString(),
      prestigePoints: gameState.prestigePoints.toString(),
      influence: gameState.influence.toString(),
      engagement: gameState.engagement,
      generators: gameState.idleGenerators.map(g => ({
        id: g.id,
        owned: g.owned
      })),
      upgrades: gameState.upgrades.map(u => ({
        id: u.id,
        currentPurchases: u.currentPurchases
      }))
    }
  }

  /**
   * Get current status
   */
  getStatus(): BotStatus {
    return this.status
  }

  /**
   * Get current session
   */
  getCurrentSession(): BotSession | null {
    return this.logger.getCurrentSession()
  }

  /**
   * Get last completed session
   */
  getLastCompletedSession(): BotSession | null {
    return this.lastCompletedSession
  }
}
