import { describe, it, expect } from 'vitest'
import { NumberFormatter, formatNumber, formatRate, formatTime, formatPercentage } from './numberFormatter'
import { decimal } from './decimal'

describe('NumberFormatter', () => {
  describe('Basic Number Formatting', () => {
    const formatter = new NumberFormatter()

    it('should format zero correctly', () => {
      expect(formatter.format(0)).toBe('0')
      expect(formatter.format('0')).toBe('0')
    })

    it('should format small positive numbers correctly', () => {
      expect(formatter.format(1)).toBe('1')
      expect(formatter.format(42)).toBe('42')
      expect(formatter.format(999)).toBe('999')
    })

    it('should format small decimal numbers correctly', () => {
      expect(formatter.format(1.5)).toBe('1.5')
      expect(formatter.format(42.123)).toBe('42.12')
      expect(formatter.format(999.996)).toBe('1K') // Rounds up to 1000, then formats as 1K
    })

    it('should format negative numbers correctly', () => {
      expect(formatter.format(-1)).toBe('-1')
      expect(formatter.format(-42.5)).toBe('-42.5')
      expect(formatter.format(-1500)).toBe('-1.5K')
    })

    it('should remove trailing zeros', () => {
      expect(formatter.format(1.0)).toBe('1')
      expect(formatter.format(42.10)).toBe('42.1')
      expect(formatter.format(100.00)).toBe('100')
    })
  })

  describe('Suffix Notation', () => {
    const formatter = new NumberFormatter()

    it('should format thousands correctly', () => {
      expect(formatter.format(1000)).toBe('1K')
      expect(formatter.format(1500)).toBe('1.5K')
      expect(formatter.format(999500)).toBe('999.5K') // Stays as K format
    })

    it('should format millions correctly', () => {
      expect(formatter.format(1000000)).toBe('1M')
      expect(formatter.format(2500000)).toBe('2.5M')
      expect(formatter.format(999500000)).toBe('999.5M') // Stays as M format
    })

    it('should format billions correctly', () => {
      expect(formatter.format('1000000000')).toBe('1B')
      expect(formatter.format('2500000000')).toBe('2.5B')
    })

    it('should format trillions correctly', () => {
      expect(formatter.format('1000000000000')).toBe('1T')
      expect(formatter.format('2500000000000')).toBe('2.5T')
    })

    it('should format very large numbers with extended suffixes', () => {
      expect(formatter.format('1e15')).toBe('1Qa')
      expect(formatter.format('1e18')).toBe('1Qi')
      expect(formatter.format('1e21')).toBe('1Sx')
      expect(formatter.format('1e60')).toBe('1NoDc')
      expect(formatter.format('1e99')).toBe('1DTg')
    })
  })

  describe('Scientific Notation', () => {
    const formatter = new NumberFormatter({
      useScientificNotation: true,
      scientificThreshold: decimal('1e12')
    })

    it('should use suffix notation below threshold', () => {
      expect(formatter.format('1e9')).toBe('1B')
      expect(formatter.format('1e11')).toBe('100B')
    })

    it('should use scientific notation above threshold', () => {
      expect(formatter.format('1e12')).toBe('1e12')
      expect(formatter.format('1e15')).toBe('1e15')
      expect(formatter.format('2.5e20')).toBe('2.5e20')
    })
  })

  describe('Custom Precision', () => {
    const formatter = new NumberFormatter()

    it('should respect custom precision parameter', () => {
      expect(formatter.format(1234.5678, 0)).toBe('1K')
      expect(formatter.format(1234.5678, 1)).toBe('1.2K')
      expect(formatter.format(1234.5678, 3)).toBe('1.235K')
    })

    it('should use default precision when not specified', () => {
      expect(formatter.format(1234.5678)).toBe('1.23K')
    })
  })

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const formatter = new NumberFormatter()
      
      formatter.updateConfig({ maxDecimalPlaces: 0 })
      expect(formatter.format(1234.5678)).toBe('1K')
      
      formatter.updateConfig({ maxDecimalPlaces: 3 })
      expect(formatter.format(1234.5678)).toBe('1.235K')
    })

    it('should show full numbers when configured', () => {
      const formatter = new NumberFormatter({ showFullNumbers: true })
      
      expect(formatter.format(1234)).toBe('1234')
      expect(formatter.format(999999)).toBe('999999')
    })

    it('should return current configuration', () => {
      const formatter = new NumberFormatter({ maxDecimalPlaces: 3 })
      const config = formatter.getConfig()
      
      expect(config.maxDecimalPlaces).toBe(3)
      expect(config.useScientificNotation).toBe(false)
    })
  })

  describe('Rate Formatting', () => {
    const formatter = new NumberFormatter()

    it('should format rates correctly', () => {
      expect(formatter.formatRate(10)).toBe('10/s')
      expect(formatter.formatRate(1500)).toBe('1.5K/s')
      expect(formatter.formatRate('1000000')).toBe('1M/s')
    })
  })

  describe('Time Formatting', () => {
    const formatter = new NumberFormatter()

    it('should format seconds correctly', () => {
      expect(formatter.formatTime(0)).toBe('0s')
      expect(formatter.formatTime(30)).toBe('30s')
      expect(formatter.formatTime(59)).toBe('59s')
    })

    it('should format minutes correctly', () => {
      expect(formatter.formatTime(60)).toBe('1m')
      expect(formatter.formatTime(90)).toBe('1m 30s')
      expect(formatter.formatTime(3599)).toBe('59m 59s')
    })

    it('should format hours correctly', () => {
      expect(formatter.formatTime(3600)).toBe('1h')
      expect(formatter.formatTime(3660)).toBe('1h 1m')
      expect(formatter.formatTime(86399)).toBe('23h 59m')
    })

    it('should format days correctly', () => {
      expect(formatter.formatTime(86400)).toBe('1d')
      expect(formatter.formatTime(90000)).toBe('1d 1h')
      expect(formatter.formatTime(172800)).toBe('2d')
    })
  })

  describe('Percentage Formatting', () => {
    const formatter = new NumberFormatter()

    it('should format percentages correctly', () => {
      expect(formatter.formatPercentage(0.5)).toBe('50.0%')
      expect(formatter.formatPercentage(0.123)).toBe('12.3%')
      expect(formatter.formatPercentage(1.0)).toBe('100.0%')
    })

    it('should respect custom precision for percentages', () => {
      expect(formatter.formatPercentage(0.12345, 0)).toBe('12%')
      expect(formatter.formatPercentage(0.12345, 2)).toBe('12.35%')
      expect(formatter.formatPercentage(0.12345, 3)).toBe('12.345%')
    })
  })

  describe('Convenience Functions', () => {
    it('should provide working convenience functions', () => {
      expect(formatNumber(1500)).toBe('1.5K')
      expect(formatRate(2000)).toBe('2K/s')
      expect(formatTime(3661)).toBe('1h 1m')
      expect(formatPercentage(0.75)).toBe('75.0%')
    })
  })

  describe('Edge Cases', () => {
    const formatter = new NumberFormatter()

    it('should handle very small positive numbers', () => {
      expect(formatter.format(0.001)).toBe('0')
      expect(formatter.format(0.1)).toBe('0.1')
      expect(formatter.format(0.99)).toBe('0.99')
    })

    it('should handle Decimal objects', () => {
      const num = decimal('1234567')
      expect(formatter.format(num)).toBe('1.23M')
    })

    it('should handle string inputs', () => {
      expect(formatter.format('1234567')).toBe('1.23M')
      expect(formatter.format('1e15')).toBe('1Qa')
    })
  })
})