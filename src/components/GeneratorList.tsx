import React from 'react'
import { useGenerators, useCurrency, useGameActions } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber } from '../utils/numberFormatter'
import { decimal } from '../utils/decimal'

export function GeneratorList() {
  const generators = useGenerators()
  const currency = useCurrency()
  const { setGameState } = useGameActions()

  // Filter to only show unlocked generators
  const visibleGenerators = generators.filter(generator => generator.unlocked)

  const handlePurchase = (generatorId: string) => {
    const success = gameEngine.purchaseGenerator(generatorId, 1)
    if (success) {
      // Force a re-render by updating the game state
      setGameState(gameEngine.getGameState())
    }
  }

  if (visibleGenerators.length === 0) {
    return (
      <div className="generator-list empty">
        <h2>Generators</h2>
        <p>No generators available yet. Keep clicking to unlock them!</p>
      </div>
    )
  }

  return (
    <div className="generator-list">
      <h2>Generators</h2>
      <div className="generator-grid">
        {visibleGenerators.map((generator) => {
          const cost = gameEngine.getGeneratorCost(generator, 1)
          const canAfford = gameEngine.canAffordGenerator(generator, 1)
          const productionPerSecond = generator.baseProduction.times(decimal(generator.owned || 0))

          return (
            <div
              key={generator.id}
              className={`generator-item ${canAfford ? 'affordable' : 'unaffordable'}`}
            >
              <div className="generator-header">
                <h3 className="generator-name">{generator.name}</h3>
                <div className="generator-owned">
                  Owned: {generator.owned}
                </div>
              </div>
              
              <p className="generator-description">{generator.description}</p>
              
              <div className="generator-details">
                <div className="generator-production">
                  Production: {formatNumber(generator.baseProduction)}/sec
                  {generator.owned > 0 && (
                    <span className="total-production">
                      {' '}(Total: {formatNumber(productionPerSecond)}/sec)
                    </span>
                  )}
                </div>
                <div className="generator-cost">
                  Cost: {formatNumber(cost)} Clicks
                </div>
              </div>
              
              <button
                className={`generator-button ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                onClick={() => handlePurchase(generator.id)}
                disabled={!canAfford}
              >
                {canAfford ? 'Purchase' : 'Cannot Afford'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}