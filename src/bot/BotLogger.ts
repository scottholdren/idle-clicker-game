import Decimal from 'decimal.js'
import { formatNumber, formatInteger } from '../utils/numberFormatter'

/**
 * Types for bot logging
 */
export interface PurchaseLog {
  timestamp: number
  type: 'generator' | 'upgrade' | 'influence'
  id: string
  name: string
  amount: number
  cost: Decimal
  reason: string
}

export interface PrestigeLog {
  prestigeNumber: number
  startTime: number
  endTime: number
  duration: number // milliseconds
  startingSP: Decimal
  gainedSP: Decimal
  endingSP: Decimal
  totalClicks: number
  manualClicks: number
  clickRate: number // clicks per second
  purchases: PurchaseLog[]
  finalMultipliers: {
    clickMultiplier: Decimal
    idleMultiplier: Decimal
    strategyBonus: Decimal
    engagement: number
  }
  finalCurrency: Decimal
  finalViews: Decimal
}

export interface BotSession {
  sessionId: string
  mode: 'active' | 'passive'
  speed: 'realtime' | 'simulated'
  simulationSpeed?: number // multiplier for simulated mode
  startTime: number
  endTime?: number
  prestiges: PrestigeLog[]
  finalGameState?: any
}

/**
 * Logger for bot activities
 */
export class BotLogger {
  private currentSession: BotSession | null = null
  private currentPrestige: PrestigeLog | null = null
  private sessionStartTime: number = 0

  /**
   * Start a new bot session
   */
  startSession(mode: 'active' | 'passive', speed: 'realtime' | 'simulated', simulationSpeed?: number): void {
    this.sessionStartTime = Date.now()
    this.currentSession = {
      sessionId: `bot-${Date.now()}`,
      mode,
      speed,
      simulationSpeed,
      startTime: this.sessionStartTime,
      prestiges: []
    }
    console.log(`[Bot] Session started: ${mode} mode, ${speed} speed${simulationSpeed ? ` (${simulationSpeed}x)` : ''}`)
  }

  /**
   * Start logging a new prestige
   */
  startPrestige(prestigeNumber: number, startingSP: Decimal): void {
    if (!this.currentSession) {
      throw new Error('No active session')
    }

    this.currentPrestige = {
      prestigeNumber,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      startingSP,
      gainedSP: new Decimal(0),
      endingSP: startingSP,
      totalClicks: 0,
      manualClicks: 0,
      clickRate: 0,
      purchases: [],
      finalMultipliers: {
        clickMultiplier: new Decimal(1),
        idleMultiplier: new Decimal(1),
        strategyBonus: new Decimal(1),
        engagement: 1
      },
      finalCurrency: new Decimal(0),
      finalViews: new Decimal(0)
    }
  }

  /**
   * Log a purchase
   */
  logPurchase(
    type: 'generator' | 'upgrade' | 'influence',
    id: string,
    name: string,
    amount: number,
    cost: Decimal,
    reason: string
  ): void {
    if (!this.currentPrestige) {
      return
    }

    this.currentPrestige.purchases.push({
      timestamp: Date.now(),
      type,
      id,
      name,
      amount,
      cost,
      reason
    })
  }

  /**
   * End the current prestige
   */
  endPrestige(
    gainedSP: Decimal,
    endingSP: Decimal,
    totalClicks: number,
    manualClicks: number,
    finalMultipliers: PrestigeLog['finalMultipliers'],
    finalCurrency: Decimal,
    finalViews: Decimal
  ): void {
    if (!this.currentPrestige || !this.currentSession) {
      return
    }

    const endTime = Date.now()
    this.currentPrestige.endTime = endTime
    this.currentPrestige.duration = endTime - this.currentPrestige.startTime
    this.currentPrestige.gainedSP = gainedSP
    this.currentPrestige.endingSP = endingSP
    this.currentPrestige.totalClicks = totalClicks
    this.currentPrestige.manualClicks = manualClicks
    this.currentPrestige.clickRate = manualClicks / (this.currentPrestige.duration / 1000)
    this.currentPrestige.finalMultipliers = finalMultipliers
    this.currentPrestige.finalCurrency = finalCurrency
    this.currentPrestige.finalViews = finalViews

    this.currentSession.prestiges.push(this.currentPrestige)
    
    console.log(`[Bot] Prestige ${this.currentPrestige.prestigeNumber} completed in ${(this.currentPrestige.duration / 1000).toFixed(1)}s`)
    console.log(`  Gained ${formatInteger(gainedSP)} SP (${formatInteger(this.currentPrestige.startingSP)} → ${formatInteger(endingSP)})`)
    console.log(`  ${this.currentPrestige.purchases.length} purchases, ${manualClicks} manual clicks`)
    
    this.currentPrestige = null
  }

  /**
   * End the bot session
   */
  endSession(finalGameState: any): BotSession {
    if (!this.currentSession) {
      throw new Error('No active session')
    }

    this.currentSession.endTime = Date.now()
    this.currentSession.finalGameState = finalGameState

    const duration = (this.currentSession.endTime - this.currentSession.startTime) / 1000
    console.log(`[Bot] Session ended after ${duration.toFixed(1)}s`)
    console.log(`  Completed ${this.currentSession.prestiges.length} prestiges`)

    const session = this.currentSession
    this.currentSession = null
    return session
  }

  /**
   * Generate a detailed report
   */
  generateReport(session: BotSession): string {
    const lines: string[] = []
    
    lines.push('='.repeat(80))
    lines.push('BOT SESSION REPORT')
    lines.push('='.repeat(80))
    lines.push(`Session ID: ${session.sessionId}`)
    lines.push(`Mode: ${session.mode}`)
    lines.push(`Speed: ${session.speed}${session.simulationSpeed ? ` (${session.simulationSpeed}x)` : ''}`)
    
    const totalDuration = session.endTime ? (session.endTime - session.startTime) / 1000 : 0
    lines.push(`Total Duration: ${totalDuration.toFixed(1)}s`)
    lines.push(`Total Prestiges: ${session.prestiges.length}`)
    lines.push('')

    // Per-prestige summary
    lines.push('-'.repeat(80))
    lines.push('PRESTIGE SUMMARY')
    lines.push('-'.repeat(80))
    
    for (const prestige of session.prestiges) {
      lines.push(`\nPrestige #${prestige.prestigeNumber}`)
      lines.push(`  Duration: ${(prestige.duration / 1000).toFixed(1)}s`)
      lines.push(`  SP: ${formatInteger(prestige.startingSP)} → ${formatInteger(prestige.endingSP)} (+${formatInteger(prestige.gainedSP)})`)
      lines.push(`  Clicks: ${prestige.manualClicks} manual / ${prestige.totalClicks} total (${prestige.clickRate.toFixed(2)}/s)`)
      lines.push(`  Multipliers:`)
      lines.push(`    Click: x${formatNumber(prestige.finalMultipliers.clickMultiplier)}`)
      lines.push(`    Idle: x${formatNumber(prestige.finalMultipliers.idleMultiplier)}`)
      lines.push(`    Strategy: x${formatNumber(prestige.finalMultipliers.strategyBonus)}`)
      lines.push(`    Engagement: x${formatNumber(prestige.finalMultipliers.engagement)}`)
      lines.push(`  Final State: ${formatInteger(prestige.finalCurrency)} clicks, ${formatInteger(prestige.finalViews)} views`)
      lines.push(`  Purchases: ${prestige.purchases.length}`)
      
      // Group purchases by type
      const generators = prestige.purchases.filter(p => p.type === 'generator')
      const upgrades = prestige.purchases.filter(p => p.type === 'upgrade')
      const influence = prestige.purchases.filter(p => p.type === 'influence')
      
      if (generators.length > 0) {
        lines.push(`    Generators: ${generators.length}`)
        const grouped = this.groupPurchases(generators)
        for (const [name, count] of Object.entries(grouped)) {
          lines.push(`      ${name}: ${count}x`)
        }
      }
      
      if (upgrades.length > 0) {
        lines.push(`    Upgrades: ${upgrades.length}`)
        const grouped = this.groupPurchases(upgrades)
        for (const [name, count] of Object.entries(grouped)) {
          lines.push(`      ${name}: ${count}x`)
        }
      }
      
      if (influence.length > 0) {
        lines.push(`    Influence: ${influence.length}x`)
      }
    }

    lines.push('')
    lines.push('='.repeat(80))
    
    return lines.join('\n')
  }

  /**
   * Group purchases by name and count
   */
  private groupPurchases(purchases: PurchaseLog[]): Record<string, number> {
    const grouped: Record<string, number> = {}
    for (const purchase of purchases) {
      grouped[purchase.name] = (grouped[purchase.name] || 0) + purchase.amount
    }
    return grouped
  }

  /**
   * Export session data as JSON
   */
  exportSession(session: BotSession): string {
    return JSON.stringify(session, (key, value) => {
      // Convert Decimal objects to strings for JSON serialization
      if (value instanceof Decimal) {
        return value.toString()
      }
      return value
    }, 2)
  }

  /**
   * Get current session
   */
  getCurrentSession(): BotSession | null {
    return this.currentSession
  }
}
