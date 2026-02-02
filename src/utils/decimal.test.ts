import { describe, it, expect } from 'vitest'
import {
  decimal,
  add,
  subtract,
  multiply,
  divide,
  power,
  max,
  min,
  compare,
  equals,
  greaterThan,
  greaterThanOrEqual,
  lessThan,
  lessThanOrEqual,
  isZero,
  isPositive,
  isNegative,
  abs,
  round,
  floor,
  ceil,
  isValidDecimal,
  toDecimalSafe,
  calculateStrategyPointsMultiplier,
  ZERO,
  ONE,
  TEN,
  HUNDRED,
  THOUSAND,
} from './decimal'

describe('Decimal Utilities', () => {
  describe('Basic Operations', () => {
    it('should create decimals from various inputs', () => {
      expect(decimal(42).toString()).toBe('42')
      expect(decimal('123.456').toString()).toBe('123.456')
      expect(decimal(ZERO).toString()).toBe('0')
    })

    it('should add decimals correctly', () => {
      expect(add(10, 5).toString()).toBe('15')
      expect(add('123.456', '876.544').toString()).toBe('1000')
      expect(add(ZERO, ONE).toString()).toBe('1')
    })

    it('should subtract decimals correctly', () => {
      expect(subtract(10, 3).toString()).toBe('7')
      expect(subtract('1000', '0.001').toString()).toBe('999.999')
    })

    it('should multiply decimals correctly', () => {
      expect(multiply(6, 7).toString()).toBe('42')
      expect(multiply('2.5', '4').toString()).toBe('10')
    })

    it('should divide decimals correctly', () => {
      expect(divide(42, 6).toString()).toBe('7')
      expect(divide(10, 3).toFixed(2)).toBe('3.33')
    })

    it('should calculate powers correctly', () => {
      expect(power(2, 3).toString()).toBe('8')
      expect(power(10, 6).toString()).toBe('1000000')
    })
  })

  describe('Comparison Operations', () => {
    it('should find max and min correctly', () => {
      expect(max(10, 5).toString()).toBe('10')
      expect(min(10, 5).toString()).toBe('5')
    })

    it('should compare decimals correctly', () => {
      expect(compare(10, 5)).toBe(1)
      expect(compare(5, 10)).toBe(-1)
      expect(compare(5, 5)).toBe(0)
    })

    it('should check equality correctly', () => {
      expect(equals(5, 5)).toBe(true)
      expect(equals(5, 6)).toBe(false)
      expect(equals('5.0', '5')).toBe(true)
    })

    it('should check greater than correctly', () => {
      expect(greaterThan(10, 5)).toBe(true)
      expect(greaterThan(5, 10)).toBe(false)
      expect(greaterThan(5, 5)).toBe(false)
    })

    it('should check greater than or equal correctly', () => {
      expect(greaterThanOrEqual(10, 5)).toBe(true)
      expect(greaterThanOrEqual(5, 5)).toBe(true)
      expect(greaterThanOrEqual(5, 10)).toBe(false)
    })

    it('should check less than correctly', () => {
      expect(lessThan(5, 10)).toBe(true)
      expect(lessThan(10, 5)).toBe(false)
      expect(lessThan(5, 5)).toBe(false)
    })

    it('should check less than or equal correctly', () => {
      expect(lessThanOrEqual(5, 10)).toBe(true)
      expect(lessThanOrEqual(5, 5)).toBe(true)
      expect(lessThanOrEqual(10, 5)).toBe(false)
    })
  })

  describe('Value Checks', () => {
    it('should check if value is zero', () => {
      expect(isZero(0)).toBe(true)
      expect(isZero('0')).toBe(true)
      expect(isZero(1)).toBe(false)
    })

    it('should check if value is positive', () => {
      expect(isPositive(1)).toBe(true)
      expect(isPositive(0)).toBe(true) // Decimal.js considers 0 as positive
      expect(isPositive(-1)).toBe(false)
    })

    it('should check if value is negative', () => {
      expect(isNegative(-1)).toBe(true)
      expect(isNegative(0)).toBe(false)
      expect(isNegative(1)).toBe(false)
    })
  })

  describe('Rounding Operations', () => {
    it('should get absolute value correctly', () => {
      expect(abs(-5).toString()).toBe('5')
      expect(abs(5).toString()).toBe('5')
      expect(abs(0).toString()).toBe('0')
    })

    it('should round correctly', () => {
      expect(round(5.4).toString()).toBe('5')
      expect(round(5.6).toString()).toBe('6')
      expect(round(5.5).toString()).toBe('6') // ROUND_HALF_UP rounds 5.5 up to 6
    })

    it('should floor correctly', () => {
      expect(floor(5.9).toString()).toBe('5')
      expect(floor(5.1).toString()).toBe('5')
      expect(floor(-5.1).toString()).toBe('-6')
    })

    it('should ceil correctly', () => {
      expect(ceil(5.1).toString()).toBe('6')
      expect(ceil(5.9).toString()).toBe('6')
      expect(ceil(-5.9).toString()).toBe('-5')
    })
  })

  describe('Validation and Safety', () => {
    it('should validate decimal values correctly', () => {
      expect(isValidDecimal(42)).toBe(true)
      expect(isValidDecimal('123.456')).toBe(true)
      expect(isValidDecimal('invalid')).toBe(false)
      expect(isValidDecimal(null)).toBe(false)
      expect(isValidDecimal(undefined)).toBe(false)
    })

    it('should convert to decimal safely', () => {
      expect(toDecimalSafe(42).toString()).toBe('42')
      expect(toDecimalSafe('123.456').toString()).toBe('123.456')
      expect(toDecimalSafe('invalid').toString()).toBe('0')
      expect(toDecimalSafe(null).toString()).toBe('0')
    })
  })

  describe('Constants', () => {
    it('should have correct constant values', () => {
      expect(ZERO.toString()).toBe('0')
      expect(ONE.toString()).toBe('1')
      expect(TEN.toString()).toBe('10')
      expect(HUNDRED.toString()).toBe('100')
      expect(THOUSAND.toString()).toBe('1000')
    })
  })

  describe('Large Number Handling', () => {
    it('should handle very large numbers correctly', () => {
      const large1 = decimal('999999999999999999999999999999')
      const large2 = decimal('1')
      const result = add(large1, large2)
      
      // Should maintain precision
      expect(result.toFixed()).toBe('1000000000000000000000000000000')
    })

    it('should handle exponential calculations', () => {
      const base = decimal(2)
      const exponent = decimal(100)
      const result = power(base, exponent)
      
      // 2^100 is a very large number
      expect(result.greaterThan(THOUSAND)).toBe(true)
    })
  })

  describe('calculateStrategyPointsMultiplier', () => {
    it('should calculate strategy points multiplier correctly', () => {
      // Test with 0 strategy points
      expect(calculateStrategyPointsMultiplier(0).equals(decimal(1))).toBe(true)
      
      // Test with 1 strategy point (10% bonus)
      expect(calculateStrategyPointsMultiplier(1).equals(decimal(1.1))).toBe(true)
      
      // Test with 3 strategy points (30% bonus)
      expect(calculateStrategyPointsMultiplier(3).equals(decimal(1.3))).toBe(true)
      
      // Test with 10 strategy points (100% bonus = 2x multiplier)
      expect(calculateStrategyPointsMultiplier(10).equals(decimal(2))).toBe(true)
      
      // Test with decimal input
      expect(calculateStrategyPointsMultiplier(decimal(5)).equals(decimal(1.5))).toBe(true)
    })
  })
})