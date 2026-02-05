import { ClickButton } from './components/ClickButton'
import { UpgradeList } from './components/UpgradeList'
import { GeneratorList } from './components/GeneratorList'
import { PrestigeButton } from './components/PrestigeButton'
import { StrategyPointsGauge } from './components/StrategyPointsGauge'
import { BaseClickToggle } from './components/GameModeToggle'
import { DimensionShiftButton } from './components/DimensionShiftButton'
import { useCurrency, useViews, useEngagement, usePrestigePoints, useViewsPerSecond, useTotalClicksPerSecond, useGameActions, useGameState } from './stores/gameStore'
import { formatNumber, formatInteger } from './utils/numberFormatter'
import { getRateColorClass, formatRate } from './utils/rateColors'
import { gameEngine } from './engine/gameEngine'
import './App.css'

function App() {
  const currency = useCurrency()
  const views = useViews()
  const engagement = useEngagement()
  const prestigePoints = usePrestigePoints()
  const viewsPerSecond = useViewsPerSecond()
  const totalClicksPerSecond = useTotalClicksPerSecond()
  const gameState = useGameState()
  const { resetGame } = useGameActions()
  
  // Calculate engagement upgrade cost
  const engagementCost = gameEngine.getEngagementCost(engagement)
  const canAffordEngagement = gameEngine.canAffordEngagement()
  
  const handleEngagementPurchase = () => {
    gameEngine.purchaseEngagement()
  }

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
        <BaseClickToggle />
        <button className="reset-button" onClick={handleReset}>
          Reset
        </button>
      </div>
      
      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Asymptote</h1>
            <h2>An Idle System</h2>
            <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
              Dimension {gameState.currentDimension}: {gameState.currentDimension === 1 ? 'Content' : 'Influence'}
            </div>
          </div>
          
          <div className="metrics-row">
            {prestigePoints.greaterThan(0) && <StrategyPointsGauge />}
            
            <div className="metric-card">
              <div className="card-header">Engagement</div>
              <div className="card-value">x{engagement}</div>
              <div className="card-footer">
                {prestigePoints.greaterThan(0) ? (
                  <button
                    className={`buy-button-small ${canAffordEngagement ? 'can-afford' : 'cannot-afford'}`}
                    onClick={handleEngagementPurchase}
                    disabled={!canAffordEngagement}
                    style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}
                  >
                    Upgrade for {engagementCost} SP
                  </button>
                ) : (
                  <span style={{ color: '#888888', fontSize: '0.85rem' }}>gain SP to upgrade</span>
                )}
              </div>
            </div>
            
            <div className="metric-card">
              <div className="card-header">Views</div>
              <div className="card-value">{formatInteger(views.floor())}</div>
              <div className={`card-footer ${getRateColorClass(viewsPerSecond)}`}>
                {formatRate(viewsPerSecond, formatNumber)}
              </div>
            </div>
            
            <div className="click-section">
              <ClickButton />
            </div>
            
            <PrestigeButton />
            
            <DimensionShiftButton />
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {gameState.currentDimension === 1 ? (
          <>
            <div className="middle-panel">
              <UpgradeList />
            </div>
            
            <div className="right-panel">
              <GeneratorList />
            </div>
          </>
        ) : (
          <div className="dimension-placeholder">
            <h2>Dimension 2: Influence</h2>
            <p>Corporate optimization and algorithmic growth</p>
            <p style={{ marginTop: '2rem', color: '#888' }}>
              Coming soon... For now, return to Dimension 1 to continue playing.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
