import Decimal from 'decimal.js'

// Configure Decimal.js for our game's needs
Decimal.config({
  precision: 50, // Support very large numbers
  rounding: Decimal.ROUND_DOWN, // Always round down for game currency
  toExpNeg: -20, // Use exponential notation for very small numbers
  toExpPos: 20, // Use exponential notation for numbers >= 10^20
})

/**
 * Utility functions for working with Decimal.js in the idle clicker game
 */

/**
 * Create a new Decimal from various input types
 */
export function decimal(value: Decimal.Value): Decimal {
  return new Decimal(value)
}

/**
 * Add two decimal values
 */
export function add(a: Decimal.Value, b: Decimal.Value): Decimal {
  return new Decimal(a).plus(b)
}

/**
 * Subtract two decimal values
 */
export function subtract(a: Decimal.Value, b: Decimal.Value): Decimal {
  return new Decimal(a).minus(b)
}

/**
 * Multiply two decimal values
 */
export function multiply(a: Decimal.Value, b: Decimal.Value): Decimal {
  return new Decimal(a).times(b)
}

/**
 * Divide two decimal values
 */
export function divide(a: Decimal.Value, b: Decimal.Value): Decimal {
  return new Decimal(a).dividedBy(b)
}

/**
 * Raise a decimal to a power
 */
export function power(base: Decimal.Value, exponent: Decimal.Value): Decimal {
  return new Decimal(base).pow(exponent)
}

/**
 * Get the maximum of two decimal values
 */
export function max(a: Decimal.Value, b: Decimal.Value): Decimal {
  const decA = new Decimal(a)
  const decB = new Decimal(b)
  return decA.greaterThan(decB) ? decA : decB
}

/**
 * Get the minimum of two decimal values
 */
export function min(a: Decimal.Value, b: Decimal.Value): Decimal {
  const decA = new Decimal(a)
  const decB = new Decimal(b)
  return decA.lessThan(decB) ? decA : decB
}

/**
 * Compare two decimal values
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: Decimal.Value, b: Decimal.Value): number {
  return new Decimal(a).comparedTo(b)
}

/**
 * Check if two decimal values are equal
 */
export function equals(a: Decimal.Value, b: Decimal.Value): boolean {
  return new Decimal(a).equals(b)
}

/**
 * Check if a decimal value is greater than another
 */
export function greaterThan(a: Decimal.Value, b: Decimal.Value): boolean {
  return new Decimal(a).greaterThan(b)
}

/**
 * Check if a decimal value is greater than or equal to another
 */
export function greaterThanOrEqual(a: Decimal.Value, b: Decimal.Value): boolean {
  return new Decimal(a).greaterThanOrEqualTo(b)
}

/**
 * Check if a decimal value is less than another
 */
export function lessThan(a: Decimal.Value, b: Decimal.Value): boolean {
  return new Decimal(a).lessThan(b)
}

/**
 * Check if a decimal value is less than or equal to another
 */
export function lessThanOrEqual(a: Decimal.Value, b: Decimal.Value): boolean {
  return new Decimal(a).lessThanOrEqualTo(b)
}

/**
 * Check if a decimal value is zero
 */
export function isZero(value: Decimal.Value): boolean {
  return new Decimal(value).isZero()
}

/**
 * Check if a decimal value is positive
 */
export function isPositive(value: Decimal.Value): boolean {
  return new Decimal(value).isPositive()
}

/**
 * Check if a decimal value is negative
 */
export function isNegative(value: Decimal.Value): boolean {
  return new Decimal(value).isNegative()
}

/**
 * Get the absolute value of a decimal
 */
export function abs(value: Decimal.Value): Decimal {
  return new Decimal(value).abs()
}

/**
 * Round a decimal to the nearest integer (uses ROUND_HALF_UP)
 */
export function round(value: Decimal.Value): Decimal {
  return new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
}

/**
 * Round a decimal down to the nearest integer
 */
export function floor(value: Decimal.Value): Decimal {
  return new Decimal(value).floor()
}

/**
 * Round a decimal up to the nearest integer
 */
export function ceil(value: Decimal.Value): Decimal {
  return new Decimal(value).ceil()
}

/**
 * Validate that a value can be converted to a Decimal
 */
export function isValidDecimal(value: unknown): value is Decimal.Value {
  try {
    new Decimal(value as Decimal.Value)
    return true
  } catch {
    return false
  }
}

/**
 * Convert a value to a Decimal, returning zero if invalid
 */
export function toDecimalSafe(value: unknown): Decimal {
  if (isValidDecimal(value)) {
    return new Decimal(value)
  }
  return new Decimal(0)
}

/**
 * Calculate strategy points multiplier with logarithmic scaling
 * Formula: 1 + log10(SP + 1) * 10
 * This provides strong early growth that naturally slows down
 * At 1M SP: ~61x multiplier
 */
export function calculateStrategyPointsMultiplier(prestigePoints: Decimal.Value): Decimal {
  const sp = decimal(prestigePoints)
  const logBonus = Math.log10(sp.plus(1).toNumber()) * 10
  return decimal(1).plus(logBonus)
}

/**
 * Calculate view-to-click conversion efficiency based on total earned clicks
 * Base: 10% (1 click per 10 views)
 * Improves by 0.1% per 1000 total earned clicks
 * Prestige multiplier and engagement affect the efficiency gain rate
 * Soft capped at 50% (or 100% if engagement > 1)
 */
export function calculateViewToClickEfficiency(totalEarned: Decimal.Value, prestigeMultiplier: Decimal.Value, engagementLevel: number = 1): Decimal {
  const baseEfficiency = 0.1 // 10% base conversion rate
  const maxEfficiency = engagementLevel > 1 ? 1.0 : 0.5 // 100% cap if engagement > 1, otherwise 50%
  
  // Calculate efficiency gain: 0.1% per 1000 total earned clicks, affected by prestige multiplier AND engagement
  const prestigeBonus = decimal(prestigeMultiplier)
  const totalEarnedNum = decimal(totalEarned).toNumber()
  const efficiencyGainPer1000 = 0.001 // 0.1%
  const efficiencyGain = (totalEarnedNum / 1000) * efficiencyGainPer1000 * prestigeBonus.toNumber() * engagementLevel
  
  // Apply soft cap
  const totalEfficiency = Math.min(baseEfficiency + efficiencyGain, maxEfficiency)
  
  return decimal(totalEfficiency)
}

/**
 * Common game constants as Decimals
 */
export const ZERO = new Decimal(0)
export const ONE = new Decimal(1)
export const TEN = new Decimal(10)
export const HUNDRED = new Decimal(100)
export const THOUSAND = new Decimal(1000)