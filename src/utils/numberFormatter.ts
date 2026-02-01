import Decimal from 'decimal.js'
import { decimal, greaterThanOrEqual, isZero } from './decimal'

/**
 * Number formatting configuration
 */
export interface NumberFormatConfig {
  useScientificNotation: boolean
  scientificThreshold: Decimal
  maxDecimalPlaces: number
  showFullNumbers: boolean
}

/**
 * Default formatting configuration
 */
const DEFAULT_CONFIG: NumberFormatConfig = {
  useScientificNotation: false,
  scientificThreshold: decimal('1e21'), // Use scientific notation for numbers >= 1e21
  maxDecimalPlaces: 2,
  showFullNumbers: false,
}

/**
 * Suffix notation for large numbers
 */
const SUFFIXES = [
  { value: decimal('1e3'), suffix: 'K' },     // Thousand
  { value: decimal('1e6'), suffix: 'M' },     // Million
  { value: decimal('1e9'), suffix: 'B' },     // Billion
  { value: decimal('1e12'), suffix: 'T' },    // Trillion
  { value: decimal('1e15'), suffix: 'Qa' },   // Quadrillion
  { value: decimal('1e18'), suffix: 'Qi' },   // Quintillion
  { value: decimal('1e21'), suffix: 'Sx' },   // Sextillion
  { value: decimal('1e24'), suffix: 'Sp' },   // Septillion
  { value: decimal('1e27'), suffix: 'Oc' },   // Octillion
  { value: decimal('1e30'), suffix: 'No' },   // Nonillion
  { value: decimal('1e33'), suffix: 'Dc' },   // Decillion
  { value: decimal('1e36'), suffix: 'UDc' },  // Undecillion
  { value: decimal('1e39'), suffix: 'DDc' },  // Duodecillion
  { value: decimal('1e42'), suffix: 'TDc' },  // Tredecillion
  { value: decimal('1e45'), suffix: 'QaDc' }, // Quattuordecillion
  { value: decimal('1e48'), suffix: 'QiDc' }, // Quindecillion
  { value: decimal('1e51'), suffix: 'SxDc' }, // Sexdecillion
  { value: decimal('1e54'), suffix: 'SpDc' }, // Septendecillion
  { value: decimal('1e57'), suffix: 'OcDc' }, // Octodecillion
  { value: decimal('1e60'), suffix: 'NoDc' }, // Novemdecillion
  { value: decimal('1e63'), suffix: 'Vg' },   // Vigintillion
  { value: decimal('1e66'), suffix: 'UVg' },  // Unvigintillion
  { value: decimal('1e69'), suffix: 'DVg' },  // Duovigintillion
  { value: decimal('1e72'), suffix: 'TVg' },  // Trevigintillion
  { value: decimal('1e75'), suffix: 'QaVg' }, // Quattuorvigintillion
  { value: decimal('1e78'), suffix: 'QiVg' }, // Quinvigintillion
  { value: decimal('1e81'), suffix: 'SxVg' }, // Sexvigintillion
  { value: decimal('1e84'), suffix: 'SpVg' }, // Septenvigintillion
  { value: decimal('1e87'), suffix: 'OcVg' }, // Octovigintillion
  { value: decimal('1e90'), suffix: 'NoVg' }, // Novemvigintillion
  { value: decimal('1e93'), suffix: 'Tg' },   // Trigintillion
  { value: decimal('1e96'), suffix: 'UTg' },  // Untrigintillion
  { value: decimal('1e99'), suffix: 'DTg' },  // Duotrigintillion
]

/**
 * NumberFormatter class for handling large number display
 */
export class NumberFormatter {
  private config: NumberFormatConfig

  constructor(config: Partial<NumberFormatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Format a number for display
   */
  format(value: Decimal.Value, precision?: number): string {
    const num = decimal(value)
    const decimalPlaces = precision ?? this.config.maxDecimalPlaces

    // Handle zero
    if (isZero(num)) {
      return '0'
    }

    // Handle negative numbers
    if (num.isNegative()) {
      return '-' + this.format(num.abs(), precision)
    }

    // Use scientific notation for very large numbers
    if (this.config.useScientificNotation && 
        greaterThanOrEqual(num, this.config.scientificThreshold)) {
      return this.formatScientific(num, decimalPlaces)
    }

    // Show full numbers if configured
    if (this.config.showFullNumbers) {
      return this.formatSmallNumber(num, decimalPlaces)
    }

    // Use suffix notation for numbers >= 1000, otherwise format as small number
    if (greaterThanOrEqual(num, 1000)) {
      return this.formatWithSuffix(num, decimalPlaces)
    } else {
      return this.formatSmallNumber(num, decimalPlaces)
    }
  }

  /**
   * Format a rate (per second)
   */
  formatRate(value: Decimal.Value): string {
    return this.format(value) + '/s'
  }

  /**
   * Format time in seconds to human readable format
   */
  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`
    }
    
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }
    
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600)
      const remainingMinutes = Math.floor((seconds % 3600) / 60)
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
    
    const days = Math.floor(seconds / 86400)
    const remainingHours = Math.floor((seconds % 86400) / 3600)
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  /**
   * Format percentage
   */
  formatPercentage(value: Decimal.Value, precision: number = 1): string {
    const num = decimal(value).times(100)
    // Use proper rounding for percentages
    const rounded = num.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP)
    return rounded.toFixed(precision) + '%'
  }

  /**
   * Update formatter configuration
   */
  updateConfig(config: Partial<NumberFormatConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): NumberFormatConfig {
    return { ...this.config }
  }

  /**
   * Format small numbers (< 1000)
   */
  private formatSmallNumber(num: Decimal, decimalPlaces: number): string {
    // Use proper rounding for display (not the global ROUND_DOWN config)
    const rounded = num.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
    
    // If rounding pushes us to 1000 or above, use suffix formatting instead
    // BUT only if showFullNumbers is false
    if (!this.config.showFullNumbers && greaterThanOrEqual(rounded, 1000)) {
      return this.formatWithSuffix(rounded, decimalPlaces)
    }
    
    if (rounded.isInteger()) {
      return rounded.toString()
    }
    
    // Remove trailing zeros from decimal places
    const formatted = rounded.toFixed(decimalPlaces)
    return formatted.replace(/\.?0+$/, '')
  }

  /**
   * Format numbers with suffix notation (K, M, B, etc.)
   */
  private formatWithSuffix(num: Decimal, decimalPlaces: number): string {
    // Find the appropriate suffix
    for (let i = SUFFIXES.length - 1; i >= 0; i--) {
      const suffix = SUFFIXES[i]
      if (greaterThanOrEqual(num, suffix.value)) {
        const divided = num.dividedBy(suffix.value)
        // Use proper rounding for display
        const rounded = divided.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
        const formatted = this.formatSmallNumber(rounded, decimalPlaces)
        return formatted + suffix.suffix
      }
    }
    
    // Fallback to regular formatting
    return this.formatSmallNumber(num, decimalPlaces)
  }

  /**
   * Format numbers in scientific notation
   */
  private formatScientific(num: Decimal, decimalPlaces: number): string {
    const str = num.toExponential(decimalPlaces)
    // Clean up the scientific notation format - remove unnecessary zeros and plus signs
    return str.replace(/\.?0+e/, 'e').replace(/e\+/, 'e').replace(/e0+/, 'e')
  }
}

/**
 * Default number formatter instance
 */
export const numberFormatter = new NumberFormatter()

/**
 * Convenience functions using the default formatter
 */
export function formatNumber(value: Decimal.Value, precision?: number): string {
  return numberFormatter.format(value, precision)
}

export function formatRate(value: Decimal.Value): string {
  return numberFormatter.formatRate(value)
}

export function formatTime(seconds: number): string {
  return numberFormatter.formatTime(seconds)
}

export function formatPercentage(value: Decimal.Value, precision?: number): string {
  return numberFormatter.formatPercentage(value, precision)
}