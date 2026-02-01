import { ClickButton } from './components/ClickButton'
import { UpgradeList } from './components/UpgradeList'
import { useCurrency, useViews, useEngagement, useInfluence } from './stores/gameStore'
import { formatNumber } from './utils/numberFormatter'
import './App.css'

function App() {
  const currency = useCurrency()
  const views = useViews()
  const engagement = useEngagement()
  const influence = useInfluence()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Digital Decay</h1>
        <div className="currency-display">
          <div className="currency-row">
            <span className="currency-label">Clicks:</span>
            <span className="currency-value">{formatNumber(currency)}</span>
          </div>
          <div className="currency-row">
            <span className="currency-label">Views:</span>
            <span className="currency-value">{formatNumber(views)}</span>
          </div>
          <div className="currency-row">
            <span className="currency-label">Engagement:</span>
            <span className="currency-value">{formatNumber(engagement)}x</span>
          </div>
          <div className="currency-row">
            <span className="currency-label">Influence:</span>
            <span className="currency-value">{formatNumber(influence)}</span>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="click-section">
          <ClickButton />
        </div>
        
        <div className="upgrade-section">
          <UpgradeList />
        </div>
      </main>
    </div>
  )
}

export default App
