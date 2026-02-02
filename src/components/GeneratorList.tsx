import React from 'react'
import { useGenerators, useCurrency, useGameActions, useViewsPerSecond, useClicksPerSecondFromViews } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { decimal, calculateStrategyPointsMultiplier } from '../utils/decimal'

export function GeneratorList() {
  const generators = useGenerators()
  const currency = useCurrency()
  const { setGameState } = useGameActions()
  const baseViewsPerSecond = useViewsPerSecond()
  const baseClicksPerSecondFromViews = useClicksPerSecondFromViews()
  
  // Apply strategy points bonus to the rates
  const gameState = gameEngine.getGameState()
  const strategyBonus = calculateStrategyPointsMultiplier(gameState.prestigePoints)
  const viewsPerSecond = baseViewsPerSecond.times(strategyBonus)
  const clicksPerSecondFromViews = baseClicksPerSecondFromViews.times(strategyBonus)

  // Filter to only show unlocked generators
  const visibleGenerators = generators.filter(generator => generator.unlocked)

  const handlePurchase = (generatorId: string) => {
    const success = gameEngine.purchaseGenerator(generatorId, 1)
    if (success) {
      // Force a re-render by updating the game state
      setGameState(gameEngine.getGameState())
    }
  }

  const handleMaxPurchase = (generatorId: string) => {
    const purchased = gameEngine.purchaseMaxGenerators(generatorId)
    if (purchased > 0) {
      console.log(`Purchased ${purchased} generators`)
      // Force a re-render by updating the game state
      setGameState(gameEngine.getGameState())
    }
  }

  return (
    <div className="generator-list">
      {/* TODO: Section title will change dynamically through game progression */}
      <h2>
        Traffic Sources
        <span className="section-summary"> ({formatNumber(viewsPerSecond)} views/sec → {formatNumber(clicksPerSecondFromViews)} clicks/sec)</span>
      </h2>
      {visibleGenerators.length === 0 ? (
        <div className="empty-state">
          <p>No traffic sources available yet. Keep clicking to unlock them!</p>
        </div>
      ) : (
        <div className="generator-grid">
          {visibleGenerators.map((generator) => {
            const cost = gameEngine.getGeneratorCost(generator, 1)
            const canAfford = gameEngine.canAffordGenerator(generator, 1)
            const maxAffordable = gameEngine.getMaxAffordableGenerators(generator)
            const productionPerSecond = decimal(generator.baseProduction).times(generator.owned || 0)

            return (
              <div
                key={generator.id}
                className="generator-item"
              >
                <div className="generator-header">
                  <div className="generator-title-row">
                    <h3 className="generator-name">{generator.name}</h3>
                    <div className="generator-buttons">
                      <button
                        className={`generator-button-small ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                        onClick={() => handlePurchase(generator.id)}
                        disabled={!canAfford}
                      >
                        Buy for {formatNumber(cost)} clicks
                      </button>
                      {maxAffordable > 1 && (
                        <button
                          className={`generator-button-small max-buy ${maxAffordable > 0 ? 'can-afford' : 'cannot-afford'}`}
                          onClick={() => handleMaxPurchase(generator.id)}
                          disabled={maxAffordable === 0}
                        >
                          Max ({maxAffordable})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="generator-owned">
                    Owned: {generator.owned}
                  </div>
                </div>
                
                <div className="generator-details-row">
                  <p className="generator-description">{generator.description}</p>
                  <div className="generator-stats">
                    <div className="generator-production">
                      Production: {formatNumber(generator.baseProduction)}/sec
                      {generator.owned > 0 && (
                        <span className="total-production">
                          {' '}(Total: {formatNumber(productionPerSecond)}/sec)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}