import { describe, it, expect } from 'vitest'
import { ClickHandler } from './ClickHandler'
import { decimal, ONE } from '../utils/decimal'

describe('ClickHandler', () => {
  describe('Basic Functionality', () => {
    it('should initialize with default base click value', () => {
      const handler = new ClickHandler()
      
      expect(handler.baseClickValue.equals(ONE)).toBe(true)
      expect(handler.clickMultipliers).toHaveLength(0)
    })

    it('should initialize with custom base click value', () => {
      const handler = new ClickHandler(decimal(5))
      
      expect(handler.baseClickValue.equals(decimal(5))).toBe(true)
    })

    it('should process clicks correctly', () => {
      const handler = new ClickHandler(decimal(10))
      
      const clickValue = handler.processClick()
      expect(clickValue.equals(decimal(10))).toBe(true)
    })

    it('should calculate click value correctly', () => {
      const handler = new ClickHandler(decimal(7))
      
      const clickValue = handler.calculateClickValue()
      expect(clickValue.equals(decimal(7))).toBe(true)
    })
  })

  describe('Multiplier Management', () => {
    it('should add click multipliers', () => {
      const handler = new ClickHandler(decimal(10))
      
      handler.addClickMultiplier(decimal(2))
      expect(handler.clickMultipliers).toHaveLength(1)
      expect(handler.calculateClickValue().equals(decimal(20))).toBe(true)
    })

    it('should apply multiple multipliers', () => {
      const handler = new ClickHandler(decimal(5))
      
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(3))
      
      expect(handler.calculateClickValue().equals(decimal(30))).toBe(true) // 5 * 2 * 3
    })

    it('should remove multipliers by index', () => {
      const handler = new ClickHandler(decimal(10))
      
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(3))
      handler.addClickMultiplier(decimal(4))
      
      handler.removeClickMultiplier(1) // Remove the 3x multiplier
      
      expect(handler.clickMultipliers).toHaveLength(2)
      expect(handler.calculateClickValue().equals(decimal(80))).toBe(true) // 10 * 2 * 4
    })

    it('should handle invalid removal indices gracefully', () => {
      const handler = new ClickHandler(decimal(10))
      
      handler.addClickMultiplier(decimal(2))
      
      handler.removeClickMultiplier(-1) // Invalid index
      handler.removeClickMultiplier(5) // Out of bounds
      
      expect(handler.clickMultipliers).toHaveLength(1)
      expect(handler.calculateClickValue().equals(decimal(20))).toBe(true)
    })

    it('should clear all multipliers', () => {
      const handler = new ClickHandler(decimal(10))
      
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(3))
      
      handler.clearClickMultipliers()
      
      expect(handler.clickMultipliers).toHaveLength(0)
      expect(handler.calculateClickValue().equals(decimal(10))).toBe(true)
    })

    it('should calculate total multiplier correctly', () => {
      const handler = new ClickHandler()
      
      expect(handler.getTotalMultiplier().equals(ONE)).toBe(true)
      
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(3))
      
      expect(handler.getTotalMultiplier().equals(decimal(6))).toBe(true)
    })
  })

  describe('Base Click Value Management', () => {
    it('should update base click value', () => {
      const handler = new ClickHandler(decimal(5))
      
      handler.setBaseClickValue(decimal(15))
      
      expect(handler.baseClickValue.equals(decimal(15))).toBe(true)
      expect(handler.calculateClickValue().equals(decimal(15))).toBe(true)
    })

    it('should update base click value with multipliers', () => {
      const handler = new ClickHandler(decimal(5))
      handler.addClickMultiplier(decimal(2))
      
      handler.setBaseClickValue(decimal(10))
      
      expect(handler.calculateClickValue().equals(decimal(20))).toBe(true)
    })
  })

  describe('Advanced Features', () => {
    it('should calculate clicks per second', () => {
      const handler = new ClickHandler(decimal(10))
      handler.addClickMultiplier(decimal(2))
      
      const cps = handler.getClicksPerSecond(decimal(5))
      expect(cps.equals(decimal(100))).toBe(true) // 10 * 2 * 5
    })

    it('should simulate multiple clicks', () => {
      const handler = new ClickHandler(decimal(7))
      handler.addClickMultiplier(decimal(3))
      
      const totalValue = handler.simulateClicks(5)
      expect(totalValue.equals(decimal(105))).toBe(true) // 7 * 3 * 5
    })

    it('should reset to default state', () => {
      const handler = new ClickHandler(decimal(10))
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(3))
      
      handler.reset()
      
      expect(handler.baseClickValue.equals(ONE)).toBe(true)
      expect(handler.clickMultipliers).toHaveLength(0)
      expect(handler.calculateClickValue().equals(ONE)).toBe(true)
    })

    it('should clone correctly', () => {
      const handler = new ClickHandler(decimal(15))
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(4))
      
      const clone = handler.clone()
      
      expect(clone.baseClickValue.equals(decimal(15))).toBe(true)
      expect(clone.clickMultipliers).toHaveLength(2)
      expect(clone.calculateClickValue().equals(decimal(120))).toBe(true)
      
      // Ensure they're independent
      clone.addClickMultiplier(decimal(2))
      expect(handler.clickMultipliers).toHaveLength(2)
      expect(clone.clickMultipliers).toHaveLength(3)
    })
  })

  describe('Debug Information', () => {
    it('should provide debug information', () => {
      const handler = new ClickHandler(decimal(10))
      handler.addClickMultiplier(decimal(2))
      handler.addClickMultiplier(decimal(3))
      
      const debugInfo = handler.getDebugInfo()
      
      expect(debugInfo.baseClickValue).toBe('10')
      expect(debugInfo.multipliers).toEqual(['2', '3'])
      expect(debugInfo.totalMultiplier).toBe('6')
      expect(debugInfo.clickValue).toBe('60')
    })

    it('should provide debug information with no multipliers', () => {
      const handler = new ClickHandler(decimal(5))
      
      const debugInfo = handler.getDebugInfo()
      
      expect(debugInfo.baseClickValue).toBe('5')
      expect(debugInfo.multipliers).toEqual([])
      expect(debugInfo.totalMultiplier).toBe('1')
      expect(debugInfo.clickValue).toBe('5')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero base click value', () => {
      const handler = new ClickHandler(decimal(0))
      handler.addClickMultiplier(decimal(5))
      
      expect(handler.calculateClickValue().equals(decimal(0))).toBe(true)
    })

    it('should handle fractional multipliers', () => {
      const handler = new ClickHandler(decimal(10))
      handler.addClickMultiplier(decimal(0.5))
      handler.addClickMultiplier(decimal(2.5))
      
      expect(handler.calculateClickValue().equals(decimal(12.5))).toBe(true) // 10 * 0.5 * 2.5
    })

    it('should handle very large numbers', () => {
      const handler = new ClickHandler(decimal('1e10'))
      handler.addClickMultiplier(decimal('1e5'))
      
      const result = handler.calculateClickValue()
      expect(result.equals(decimal('1e15'))).toBe(true)
    })

    it('should handle one multiplier correctly', () => {
      const handler = new ClickHandler(decimal(8))
      handler.addClickMultiplier(decimal(1.5))
      
      expect(handler.calculateClickValue().equals(decimal(12))).toBe(true)
      expect(handler.getTotalMultiplier().equals(decimal(1.5))).toBe(true)
    })
  })
})