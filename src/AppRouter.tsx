import { useState } from 'react'
import App from './App'
import { BotPage } from './pages/BotPage'
import './AppRouter.css'

export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<'game' | 'bot'>('game')

  return (
    <div className="app-router">
      <nav className="app-nav">
        <button
          className={`nav-button ${currentPage === 'game' ? 'active' : ''}`}
          onClick={() => setCurrentPage('game')}
        >
          Game
        </button>
        <button
          className={`nav-button ${currentPage === 'bot' ? 'active' : ''}`}
          onClick={() => setCurrentPage('bot')}
        >
          Bot Control
        </button>
      </nav>
      
      <div className="page-content">
        {currentPage === 'game' ? <App /> : <BotPage />}
      </div>
    </div>
  )
}
