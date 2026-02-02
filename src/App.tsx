import { ClickButton } from './components/ClickButton'
import { UpgradeList } from './components/UpgradeList'
import { GeneratorList } from './components/GeneratorList'
import { PrestigeButton } from './components/PrestigeButton'
import { StrategyPointsGauge } from './components/StrategyPointsGauge'
import { GameModeToggle } from './components/GameModeToggle'
import { useCurrency, useViews, useEngagement, usePrestigePoints, useViewsPerSecond, useTotalClicksPerSecond, useGameActions } from './stores/gameStore'
import { formatNumber } from './utils/numberFormatter'
import { getRateColorClass, formatRate } from './utils/rateColors'
import './App.css'

function App() {
  const currency = useCurrency()
  const views = useViews()
  const engagement = useEngagement()
  const prestigePoints = usePrestigePoints()
  const viewsPerSecond = useViewsPerSecond()
  const totalClicksPerSecond = useTotalClicksPerSecond()
  const { resetGame } = useGameActions()

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all game data? This cannot be undone.')) {
      // Use the game store's reset function
      resetGame()
      // Also clear localStorage to ensure clean reset
      localStorage.removeItem('idle-clicker-game-storage')
      // Reload to reinitialize everything
      window.location.reload()
    }
  }

  return (
    <div className="app">
      <div className="top-buttons">
        <GameModeToggle />
        <button className="reset-button" onClick={handleReset}>
          Reset
        </button>
      </div>
      
      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Asymptote</h1>
            <h2>An Idle System</h2>
          </div>
          
          <div className="metrics-row">
            {prestigePoints.greaterThan(0) && <StrategyPointsGauge />}
            
            <div className="metric-card">
              <div className="card-header">Engagement</div>
              <div className="card-value">{formatNumber(engagement)}x</div>
              <div className={`card-footer ${engagement.equals(1) ? 'engagement-hint' : ''}`}>
                {engagement.equals(1) ? "shift strategy to increase" : <span dangerouslySetInnerHTML={{__html: "&nbsp;"}} />}
              </div>
            </div>
            
            <div className="metric-card">
              <div className="card-header">Views</div>
              <div className="card-value">{formatNumber(views.floor())}</div>
              <div className={`card-footer ${getRateColorClass(viewsPerSecond)}`}>
                {formatRate(viewsPerSecond, formatNumber)}
              </div>
            </div>
            
            <div className="click-section">
              <ClickButton />
            </div>
            
            <PrestigeButton />
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="middle-panel">
          <UpgradeList />
        </div>
        
        <div className="right-panel">
          <GeneratorList />
        </div>
      </main>
    </div>
  )
}

export default App
