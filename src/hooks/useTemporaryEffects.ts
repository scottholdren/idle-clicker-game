import { useGameStore } from '../stores/gameStore'

/**
 * Hook to get temporary effects filtered by type
 */
export const useTemporaryEffects = (effectType?: string) => {
  const temporaryEffects = useGameStore((state) => state.gameState.temporaryEffects)
  
  if (!effectType) {
    return temporaryEffects
  }
  
  return temporaryEffects.filter(effect => effect.type === effectType)
}

/**
 * Hook to get active click multiplier effects
 */
export const useClickMultiplierEffects = () => {
  return useTemporaryEffects('clickMultiplier')
}

/**
 * Hook to get active idle multiplier effects
 */
export const useIdleMultiplierEffects = () => {
  return useTemporaryEffects('idleMultiplier')
}

/**
 * Hook to check if any temporary effects are active
 */
export const useHasActiveEffects = (effectType?: string) => {
  const effects = useTemporaryEffects(effectType)
  return effects.length > 0
}