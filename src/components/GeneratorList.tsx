import { useGenerators, useGameActions, useViewsPerSecond, useClicksPerSecondFromViews } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { formatNumber, formatInteger } from '../utils/numberFormatter'
import { decimal, calculateStrategyPointsMultiplier } from '../utils/decimal'
import TrafficSourcesTooltip from './TrafficSourcesTooltip'

export function GeneratorList() {
  const generators = useGenerators()
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
        <TrafficSourcesTooltip>
          <span className="section-summary"> ({formatNumber(viewsPerSecond)} views/sec → {formatNumber(clicksPerSecondFromViews)} clicks/sec)</span>
        </TrafficSourcesTooltip>
      </h2>
      {visibleGenerators.length === 0 ? (
        <div className="generator-grid">
          <p style={{ textAlign: 'center' }}>None available - Keep clicking to unlock them!</p>
        </div>
      ) : (
        <div className="generator-grid">
          {visibleGenerators.map((generator) => {
            const cost = gameEngine.getGeneratorCost(generator, 1)
            const canAfford = gameEngine.canAffordGenerator(generator, 1)
            const maxAffordable = gameEngine.getMaxAffordableGenerators(generator)
            
            // Calculate production per second
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
                        className={`buy-button-small ${canAfford ? 'can-afford' : 'cannot-afford'}`}
                        onClick={() => handlePurchase(generator.id)}
                        disabled={!canAfford}
                      >
                        Buy for {formatInteger(cost)} clicks
                      </button>
                      {maxAffordable > 1 && (
                        <button
                          className={`buy-button-small max-buy ${maxAffordable > 0 ? 'can-afford' : 'cannot-afford'}`}
                          onClick={() => handleMaxPurchase(generator.id)}
                          disabled={maxAffordable === 0}
                        >
                          Max ({maxAffordable})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="generator-owned">
                    Owned: {formatInteger(generator.owned)}
                  </div>
                </div>
                
                <div className="generator-details-row">
                  <p className="generator-description">
                    {generator.description} ({formatNumber(generator.baseProduction)}/sec each)
                  </p>
                  <div className="generator-stats">
                    <div className="generator-production">
                      <span style={{ color: '#888888' }}>Traffic: </span>
                      <span style={{ color: generator.owned > 0 ? '#4caf50' : '#888888' }}>
                        {formatInteger(productionPerSecond)}/sec
                      </span>
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