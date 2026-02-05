import { GameBot, type BotConfig } from './GameBot'
import type { BotSession } from './BotLogger'

/**
 * Console interface for the game bot
 * Access via window.botConsole in browser console
 */
export class BotConsole {
  private bot: GameBot
  private lastSession: BotSession | null = null

  constructor() {
    this.bot = new GameBot()
    this.printWelcome()
  }

  /**
   * Print welcome message
   */
  private printWelcome(): void {
    console.log('%c=== Asymptote Game Bot Console ===', 'color: #4caf50; font-weight: bold; font-size: 14px')
    console.log('Available commands:')
    console.log('  botConsole.start(config)  - Start the bot')
    console.log('  botConsole.stop()         - Stop the bot')
    console.log('  botConsole.pause()        - Pause the bot')
    console.log('  botConsole.resume()       - Resume the bot')
    console.log('  botConsole.status()       - Get current status')
    console.log('  botConsole.report()       - Print last session report')
    console.log('  botConsole.export()       - Export last session as JSON')
    console.log('  botConsole.examples()     - Show example configurations')
    console.log('')
  }

  /**
   * Start the bot with configuration
   */
  start(config: BotConfig): void {
    console.log('[BotConsole] Starting bot with config:', config)
    this.bot.start(config)
  }

  /**
   * Stop the bot
   */
  stop(): void {
    const session = this.bot.stop()
    if (session) {
      this.lastSession = session
      console.log('[BotConsole] Bot stopped. Use botConsole.report() to see results.')
    }
  }

  /**
   * Pause the bot
   */
  pause(): void {
    this.bot.pause()
  }

  /**
   * Resume the bot
   */
  resume(): void {
    this.bot.resume()
  }

  /**
   * Get current status
   */
  status(): string {
    const status = this.bot.getStatus()
    const session = this.bot.getCurrentSession()
    
    console.log(`Status: ${status}`)
    if (session) {
      console.log(`Mode: ${session.mode}`)
      console.log(`Speed: ${session.speed}${session.simulationSpeed ? ` (${session.simulationSpeed}x)` : ''}`)
      console.log(`Prestiges completed: ${session.prestiges.length}`)
      console.log(`Running time: ${((Date.now() - session.startTime) / 1000).toFixed(1)}s`)
    }
    
    return status
  }

  /**
   * Print report of last session
   */
  report(): void {
    if (!this.lastSession) {
      console.log('[BotConsole] No session data available. Run a bot session first.')
      return
    }

    // Generate and print report
    const report = this.generateReport(this.lastSession)
    console.log(report)
  }

  /**
   * Generate report (same as BotLogger but accessible here)
   */
  private generateReport(session: BotSession): string {
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

    // Summary statistics
    if (session.prestiges.length > 0) {
      const avgDuration = session.prestiges.reduce((sum, p) => sum + p.duration, 0) / session.prestiges.length / 1000
      const totalSPGained = session.prestiges.reduce((sum, p) => sum + parseFloat(p.gainedSP.toString()), 0)
      const finalSP = session.prestiges[session.prestiges.length - 1].endingSP.toString()
      
      lines.push('SUMMARY STATISTICS')
      lines.push(`  Average prestige duration: ${avgDuration.toFixed(1)}s`)
      lines.push(`  Total SP gained: ${totalSPGained.toFixed(0)}`)
      lines.push(`  Final SP: ${finalSP}`)
      lines.push('')
    }

    // Per-prestige details
    lines.push('-'.repeat(80))
    lines.push('PRESTIGE DETAILS')
    lines.push('-'.repeat(80))
    
    for (const prestige of session.prestiges) {
      lines.push(`\nPrestige #${prestige.prestigeNumber}`)
      lines.push(`  Duration: ${(prestige.duration / 1000).toFixed(1)}s`)
      lines.push(`  SP: ${prestige.startingSP.toString()} → ${prestige.endingSP.toString()} (+${prestige.gainedSP.toString()})`)
      lines.push(`  Clicks: ${prestige.manualClicks} manual / ${prestige.totalClicks} total (${prestige.clickRate.toFixed(2)}/s)`)
      lines.push(`  Multipliers: Click x${prestige.finalMultipliers.clickMultiplier.toString()}, Idle x${prestige.finalMultipliers.idleMultiplier.toString()}, Strategy x${prestige.finalMultipliers.strategyBonus.toFixed(2)}, Engagement x${prestige.finalMultipliers.engagement.toString()}`)
      lines.push(`  Purchases: ${prestige.purchases.length} total`)
      
      // Group purchases
      const generators = prestige.purchases.filter(p => p.type === 'generator')
      const upgrades = prestige.purchases.filter(p => p.type === 'upgrade')
      const influence = prestige.purchases.filter(p => p.type === 'influence')
      
      if (generators.length > 0) {
        lines.push(`    Generators: ${this.summarizePurchases(generators)}`)
      }
      if (upgrades.length > 0) {
        lines.push(`    Upgrades: ${this.summarizePurchases(upgrades)}`)
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
   * Summarize purchases
   */
  private summarizePurchases(purchases: any[]): string {
    const grouped: Record<string, number> = {}
    for (const p of purchases) {
      grouped[p.name] = (grouped[p.name] || 0) + p.amount
    }
    return Object.entries(grouped).map(([name, count]) => `${name} x${count}`).join(', ')
  }

  /**
   * Export last session as JSON
   */
  export(): string | null {
    if (!this.lastSession) {
      console.log('[BotConsole] No session data available.')
      return null
    }

    const json = JSON.stringify(this.lastSession, (key, value) => {
      // Handle Decimal serialization
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        return value.toString()
      }
      return value
    }, 2)

    console.log('[BotConsole] Session exported. Copy the JSON below:')
    console.log(json)
    
    return json
  }

  /**
   * Show example configurations
   */
  examples(): void {
    console.log('%c=== Example Bot Configurations ===', 'color: #2196f3; font-weight: bold')
    console.log('')
    
    console.log('%c1. Active Mode - Real-time - 5 Prestiges', 'color: #4caf50')
    console.log('botConsole.start({')
    console.log('  mode: "active",')
    console.log('  speed: "realtime",')
    console.log('  maxPrestiges: 5')
    console.log('})')
    console.log('')
    
    console.log('%c2. Active Mode - Simulated 10x - Until 100 SP', 'color: #4caf50')
    console.log('botConsole.start({')
    console.log('  mode: "active",')
    console.log('  speed: "simulated",')
    console.log('  simulationSpeed: 10,')
    console.log('  targetSP: 100')
    console.log('})')
    console.log('')
    
    console.log('%c3. Passive Mode - Simulated 100x - 10 Prestiges', 'color: #4caf50')
    console.log('botConsole.start({')
    console.log('  mode: "passive",')
    console.log('  speed: "simulated",')
    console.log('  simulationSpeed: 100,')
    console.log('  maxPrestiges: 10')
    console.log('})')
    console.log('')
    
    console.log('%c4. Passive Mode - Real-time - 5 minutes', 'color: #4caf50')
    console.log('botConsole.start({')
    console.log('  mode: "passive",')
    console.log('  speed: "realtime",')
    console.log('  maxDuration: 300000  // 5 minutes in ms')
    console.log('})')
    console.log('')
    
    console.log('%c5. Quick Test - Active Simulated 1000x - 3 Prestiges', 'color: #4caf50')
    console.log('botConsole.start({')
    console.log('  mode: "active",')
    console.log('  speed: "simulated",')
    console.log('  simulationSpeed: 1000,')
    console.log('  maxPrestiges: 3')
    console.log('})')
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  (window as any).botConsole = new BotConsole()
  console.log('%cBot Console loaded! Type "botConsole.examples()" to see usage examples.', 'color: #4caf50; font-weight: bold')
}
