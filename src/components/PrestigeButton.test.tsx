import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PrestigeButton } from './PrestigeButton'
import { useGameStore } from '../stores/gameStore'
import { gameEngine } from '../engine/gameEngine'
import { decimal } from '../utils/decimal'

// Mock the game store
vi.mock('../stores/gameStore', () => ({
  useGameStore: vi.fn(),
  getGameMode: vi.fn(() => 'testing'), // Add getGameMode mock
}))

// Mock the game engine
vi.mock('../engine/gameEngine', () => ({
  gameEngine: {
    canPrestige: vi.fn(),
    calculatePrestigeGain: vi.fn(),
    performPrestige: vi.fn(),
  },
}))

// Mock window.confirm
const mockConfirm = vi.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
})

describe('PrestigeButton', () => {
  const mockGameState = {
    totalEarned: decimal(500),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useGameStore as any).mockReturnValue(mockGameState)
  })

  it('should render prestige button when not eligible', () => {
    ;(gameEngine.canPrestige as any).mockReturnValue(false)
    ;(gameEngine.calculatePrestigeGain as any).mockReturnValue(decimal(0))

    render(<PrestigeButton />)

    expect(screen.getByText('Strategy Shift')).toBeInTheDocument()
    expect(screen.getByText('Shift Strategy')).toBeInTheDocument()
    
    // Check for requirement and progress display
    const requirementElement = screen.getByText((content, element) => {
      return (element?.className === 'prestige-requirement' && 
             element?.textContent?.includes('Requirement: 1K total clicks')) ?? false
    })
    expect(requirementElement).toBeInTheDocument()
    
    const progressElement = screen.getByText((content, element) => {
      return (element?.className === 'prestige-progress' && 
             element?.textContent?.includes('Progress: 500 / 1K')) ?? false
    })
    expect(progressElement).toBeInTheDocument()
    
    const button = screen.getByRole('button', { name: 'Shift Strategy' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('prestige-unavailable')
  })

  it('should render prestige button when eligible', () => {
    ;(gameEngine.canPrestige as any).mockReturnValue(true)
    ;(gameEngine.calculatePrestigeGain as any).mockReturnValue(decimal(5))
    
    mockGameState.totalEarned = decimal(1500)

    render(<PrestigeButton />)

    expect(screen.getByText('Strategy Shift')).toBeInTheDocument()
    
    // Check for gain display only (no requirement when eligible)
    const gainElement = screen.getByText((content, element) => {
      return (element?.className === 'prestige-gain' && 
             element?.textContent?.includes('Gain: 5 strategy points')) ?? false
    })
    expect(gainElement).toBeInTheDocument()
    
    // Should not show requirement when eligible
    const requirementElement = screen.queryByText((content, element) => {
      return element?.className === 'prestige-requirement'
    })
    expect(requirementElement).not.toBeInTheDocument()
    
    const button = screen.getByRole('button', { name: 'Shift Strategy' })
    expect(button).not.toBeDisabled()
    expect(button).toHaveClass('prestige-available')
  })

  it('should handle prestige confirmation and execution', () => {
    ;(gameEngine.canPrestige as any).mockReturnValue(true)
    ;(gameEngine.calculatePrestigeGain as any).mockReturnValue(decimal(3))
    mockConfirm.mockReturnValue(true)

    render(<PrestigeButton />)

    const button = screen.getByRole('button', { name: 'Shift Strategy' })
    fireEvent.click(button)

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure you want to Shift Strategy?')
    )
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.stringContaining('3 strategy points')
    )
    expect(gameEngine.performPrestige).toHaveBeenCalled()
  })

  it('should not perform prestige when confirmation is cancelled', () => {
    ;(gameEngine.canPrestige as any).mockReturnValue(true)
    ;(gameEngine.calculatePrestigeGain as any).mockReturnValue(decimal(3))
    mockConfirm.mockReturnValue(false)

    render(<PrestigeButton />)

    const button = screen.getByRole('button', { name: 'Shift Strategy' })
    fireEvent.click(button)

    expect(mockConfirm).toHaveBeenCalled()
    expect(gameEngine.performPrestige).not.toHaveBeenCalled()
  })

  it('should not perform prestige when not eligible', () => {
    ;(gameEngine.canPrestige as any).mockReturnValue(false)
    ;(gameEngine.calculatePrestigeGain as any).mockReturnValue(decimal(0))

    render(<PrestigeButton />)

    const button = screen.getByRole('button', { name: 'Shift Strategy' })
    fireEvent.click(button)

    expect(mockConfirm).not.toHaveBeenCalled()
    expect(gameEngine.performPrestige).not.toHaveBeenCalled()
  })
})