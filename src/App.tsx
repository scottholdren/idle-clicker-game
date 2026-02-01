import { ClickButton } from './components/ClickButton'
import { UpgradeList } from './components/UpgradeList'
import { useCurrency } from './stores/gameStore'
import { formatNumber } from './utils/numberFormatter'
import './App.css'

function App() {
  const currency = useCurrency()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Idle Clicker Game</h1>
        <div className="currency-display">
          <h2>Currency: {formatNumber(currency)}</h2>
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
