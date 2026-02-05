import { useState, useEffect } from 'react'
import { GameBot, type BotConfig, type BotStatus } from '../bot/GameBot'
import type { BotSession } from '../bot/BotLogger'
import './BotPage.css'

// Singleton bot instance
let botInstance: GameBot | null = null

function getBot(): GameBot {
  if (!botInstance) {
    botInstance = new GameBot()
  }
  return botInstance
}

export function BotPage() {
  // Configuration state
  const [mode, setMode] = useState<'active' | 'passive'>('active')
  const [speed, setSpeed] = useState<'realtime' | 'simulated'>('simulated')
  const [simulationSpeed, setSimulationSpeed] = useState<number>(10)
  const [stopCondition, setStopCondition] = useState<'prestiges' | 'duration' | 'sp'>('prestiges')
  const [maxPrestiges, setMaxPrestiges] = useState<number>(5)
  const [maxDuration, setMaxDuration] = useState<number>(300) // seconds
  const [maxSP, setMaxSP] = useState<number>(100)

  // Bot state
  const [botStatus, setBotStatus] = useState<BotStatus>('idle')
  const [currentSession, setCurrentSession] = useState<BotSession | null>(null)
  const [lastSession, setLastSession] = useState<BotSession | null>(null)
  const [report, setReport] = useState<string>('')

  // Update bot status
  useEffect(() => {
    const interval = setInterval(() => {
      const bot = getBot()
      const status = bot.getStatus()
      const session = bot.getCurrentSession()
      
      // Check if bot just completed
      setBotStatus(prevStatus => {
        if (prevStatus !== status) {
          // If bot just completed, retrieve the last session
          if (status === 'completed') {
            const completedSession = bot.getLastCompletedSession()
            if (completedSession) {
              setLastSession(completedSession)
            }
          }
          return status
        }
        return prevStatus
      })
      
      // Only update session if it exists and is different
      setCurrentSession(prevSession => {
        if (!session) return null
        if (!prevSession) return session
        // Check if session ID changed or prestige count changed
        if (prevSession.sessionId !== session.sessionId || 
            prevSession.prestiges.length !== session.prestiges.length) {
          return session
        }
        return prevSession
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Generate report when lastSession changes
  useEffect(() => {
    if (lastSession) {
      setReport(generateReport(lastSession))
    }
  }, [lastSession])

  const handleStart = () => {
    const config: BotConfig = {
      mode,
      speed,
      simulationSpeed: speed === 'simulated' ? simulationSpeed : undefined,
      maxPrestiges: stopCondition === 'prestiges' ? maxPrestiges : undefined,
      maxDuration: stopCondition === 'duration' ? maxDuration * 1000 : undefined,
      maxSP: stopCondition === 'sp' ? maxSP : undefined,
    }

    const bot = getBot()
    bot.start(config)
    setBotStatus('running')
    setReport('')
  }

  const handleStop = () => {
    const bot = getBot()
    const session = bot.stop()
    if (session) {
      setLastSession(session)
      setReport(generateReport(session))
    }
    setBotStatus('idle')
  }

  const handlePause = () => {
    const bot = getBot()
    bot.pause()
    setBotStatus('paused')
  }

  const handleResume = () => {
    const bot = getBot()
    bot.resume()
    setBotStatus('running')
  }

  const handleExport = () => {
    if (!lastSession) return

    const json = JSON.stringify(lastSession, (_key, value) => {
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        return value.toString()
      }
      return value
    }, 2)

    // Create download
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bot-session-${lastSession.sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = (session: BotSession): string => {
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

    lines.push('-'.repeat(80))
    lines.push('PRESTIGE DETAILS')
    lines.push('-'.repeat(80))
    
    for (const prestige of session.prestiges) {
      lines.push(`\nPrestige #${prestige.prestigeNumber}`)
      lines.push(`  Duration: ${(prestige.duration / 1000).toFixed(1)}s`)
      lines.push(`  SP: ${prestige.startingSP.toString()} → ${prestige.endingSP.toString()} (+${prestige.gainedSP.toString()})`)
      lines.push(`  Clicks: ${prestige.manualClicks} manual / ${prestige.totalClicks} total (${prestige.clickRate.toFixed(2)}/s)`)
      lines.push(`  Multipliers:`)
      lines.push(`    Click: x${prestige.finalMultipliers.clickMultiplier.toString()}`)
      lines.push(`    Idle: x${prestige.finalMultipliers.idleMultiplier.toString()}`)
      lines.push(`    Strategy: x${prestige.finalMultipliers.strategyBonus.toFixed(2)}`)
      lines.push(`    Engagement: x${prestige.finalMultipliers.engagement}`)
      lines.push(`  Purchases: ${prestige.purchases.length} total`)
      
      const generators = prestige.purchases.filter(p => p.type === 'generator')
      const upgrades = prestige.purchases.filter(p => p.type === 'upgrade')
      const influence = prestige.purchases.filter(p => p.type === 'influence')
      
      if (generators.length > 0) {
        const grouped = groupPurchases(generators)
        lines.push(`    Generators: ${Object.entries(grouped).map(([name, count]) => `${name} x${count}`).join(', ')}`)
      }
      if (upgrades.length > 0) {
        const grouped = groupPurchases(upgrades)
        lines.push(`    Upgrades: ${Object.entries(grouped).map(([name, count]) => `${name} x${count}`).join(', ')}`)
      }
      if (influence.length > 0) {
        lines.push(`    Influence: ${influence.length}x`)
      }
    }

    lines.push('')
    lines.push('='.repeat(80))
    
    return lines.join('\n')
  }

  const groupPurchases = (purchases: any[]): Record<string, number> => {
    const grouped: Record<string, number> = {}
    for (const p of purchases) {
      grouped[p.name] = (grouped[p.name] || 0) + p.amount
    }
    return grouped
  }

  const getStatusColor = () => {
    switch (botStatus) {
      case 'running': return '#4caf50'
      case 'paused': return '#ff9800'
      case 'completed': return '#2196f3'
      default: return '#888888'
    }
  }

  const getElapsedTime = () => {
    if (!currentSession) return '0.0s'
    const elapsed = (Date.now() - currentSession.startTime) / 1000
    return `${elapsed.toFixed(1)}s`
  }

  return (
    <div className="bot-page">
      <div className="bot-header">
        <h1>Game Bot Control Panel</h1>
        <div className="bot-status" style={{ color: getStatusColor() }}>
          Status: {botStatus.toUpperCase()}
        </div>
      </div>

      <div className="bot-content">
        {/* Configuration Panel */}
        <div className="bot-panel config-panel">
          <h2>Configuration</h2>
          
          <div className="config-section">
            <label>Play Mode</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="active"
                  checked={mode === 'active'}
                  onChange={(e) => setMode(e.target.value as 'active')}
                  disabled={botStatus === 'running'}
                />
                Active (10 clicks/sec)
              </label>
              <label>
                <input
                  type="radio"
                  value="passive"
                  checked={mode === 'passive'}
                  onChange={(e) => setMode(e.target.value as 'passive')}
                  disabled={botStatus === 'running'}
                />
                Passive (100 clicks/hour)
              </label>
            </div>
          </div>

          <div className="config-section">
            <label>Speed</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="realtime"
                  checked={speed === 'realtime'}
                  onChange={(e) => setSpeed(e.target.value as 'realtime')}
                  disabled={botStatus === 'running'}
                />
                Real-time
              </label>
              <label>
                <input
                  type="radio"
                  value="simulated"
                  checked={speed === 'simulated'}
                  onChange={(e) => setSpeed(e.target.value as 'simulated')}
                  disabled={botStatus === 'running'}
                />
                Simulated
              </label>
            </div>
            {speed === 'simulated' && (
              <div className="input-group">
                <label>Simulation Speed: {simulationSpeed}x</label>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  disabled={botStatus === 'running'}
                />
                <div className="speed-presets">
                  <button onClick={() => setSimulationSpeed(5)} disabled={botStatus === 'running'}>5x</button>
                  <button onClick={() => setSimulationSpeed(10)} disabled={botStatus === 'running'}>10x</button>
                  <button onClick={() => setSimulationSpeed(50)} disabled={botStatus === 'running'}>50x</button>
                  <button onClick={() => setSimulationSpeed(100)} disabled={botStatus === 'running'}>100x</button>
                  <button onClick={() => setSimulationSpeed(500)} disabled={botStatus === 'running'}>500x</button>
                  <button onClick={() => setSimulationSpeed(1000)} disabled={botStatus === 'running'}>1000x</button>
                </div>
              </div>
            )}
          </div>

          <div className="config-section">
            <label>Stop Condition</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="prestiges"
                  checked={stopCondition === 'prestiges'}
                  onChange={(e) => setStopCondition(e.target.value as 'prestiges')}
                  disabled={botStatus === 'running'}
                />
                Max Prestiges
              </label>
              <label>
                <input
                  type="radio"
                  value="duration"
                  checked={stopCondition === 'duration'}
                  onChange={(e) => setStopCondition(e.target.value as 'duration')}
                  disabled={botStatus === 'running'}
                />
                Max Duration
              </label>
              <label>
                <input
                  type="radio"
                  value="sp"
                  checked={stopCondition === 'sp'}
                  onChange={(e) => setStopCondition(e.target.value as 'sp')}
                  disabled={botStatus === 'running'}
                />
                Max SP
              </label>
            </div>
            
            {stopCondition === 'prestiges' && (
              <div className="input-group">
                <label>Max Prestiges:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxPrestiges}
                  onChange={(e) => setMaxPrestiges(Number(e.target.value))}
                  disabled={botStatus === 'running'}
                />
              </div>
            )}
            
            {stopCondition === 'duration' && (
              <div className="input-group">
                <label>Max Duration (seconds):</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(Number(e.target.value))}
                  disabled={botStatus === 'running'}
                />
              </div>
            )}
            
            {stopCondition === 'sp' && (
              <div className="input-group">
                <label>Max SP:</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={maxSP}
                  onChange={(e) => setMaxSP(Number(e.target.value))}
                  disabled={botStatus === 'running'}
                />
              </div>
            )}
          </div>

          <div className="control-buttons">
            {(botStatus === 'idle' || botStatus === 'completed') && (
              <button className="btn btn-start" onClick={handleStart}>
                Start Bot
              </button>
            )}
            {botStatus === 'running' && (
              <>
                <button className="btn btn-pause" onClick={handlePause}>
                  Pause
                </button>
                <button className="btn btn-stop" onClick={handleStop}>
                  Stop
                </button>
              </>
            )}
            {botStatus === 'paused' && (
              <>
                <button className="btn btn-resume" onClick={handleResume}>
                  Resume
                </button>
                <button className="btn btn-stop" onClick={handleStop}>
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Panel */}
        <div className="bot-panel status-panel">
          <h2>Current Session</h2>
          {currentSession ? (
            <div className="session-info">
              <div className="info-row">
                <span>Mode:</span>
                <span>{currentSession.mode}</span>
              </div>
              <div className="info-row">
                <span>Speed:</span>
                <span>{currentSession.speed}{currentSession.simulationSpeed ? ` (${currentSession.simulationSpeed}x)` : ''}</span>
              </div>
              <div className="info-row">
                <span>Elapsed Time:</span>
                <span>{getElapsedTime()}</span>
              </div>
              <div className="info-row">
                <span>Prestiges:</span>
                <span>{currentSession.prestiges.length}</span>
              </div>
              {currentSession.prestiges.length > 0 && (
                <>
                  <div className="info-row">
                    <span>Current SP:</span>
                    <span>{currentSession.prestiges[currentSession.prestiges.length - 1].endingSP.toString()}</span>
                  </div>
                  <div className="info-row">
                    <span>Last Prestige Duration:</span>
                    <span>{(currentSession.prestiges[currentSession.prestiges.length - 1].duration / 1000).toFixed(1)}s</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="no-session">No active session</p>
          )}
        </div>

        {/* Report Panel */}
        <div className="bot-panel report-panel">
          <div className="report-header">
            <h2>Last Session Report</h2>
            {lastSession && (
              <button className="btn btn-export" onClick={handleExport}>
                Export JSON
              </button>
            )}
          </div>
          {report ? (
            <pre className="report-content">{report}</pre>
          ) : (
            <p className="no-report">No report available. Run a bot session to generate a report.</p>
          )}
        </div>
      </div>
    </div>
  )
}
