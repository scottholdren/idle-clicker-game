import Decimal from 'decimal.js'
import type { ClickHandler as IClickHandler } from '../types/gameTypes'
import { decimal, multiply, ONE } from '../utils/decimal'

/**
 * Click Handler implementation
 * Manages click processing and multiplier calculations
 */
export class ClickHandler implements IClickHandler {
  public baseClickValue: Decimal
  public clickMultipliers: Decimal[]

  constructor(baseClickValue: Decimal = ONE) {
    this.baseClickValue = baseClickValue
    this.clickMultipliers = []
  }

  /**
   * Process a single click and return the currency earned
   */
  public processClick(): Decimal {
    return this.calculateClickValue()
  }

  /**
   * Calculate the total value of a single click
   */
  public calculateClickValue(): Decimal {
    let totalValue = this.baseClickValue

    // Apply all active multipliers
    for (const multiplier of this.clickMultipliers) {
      totalValue = multiply(totalValue, multiplier)
    }

    return totalValue
  }

  /**
   * Add a click multiplier
   */
  public addClickMultiplier(multiplier: Decimal): void {
    this.clickMultipliers.push(multiplier)
  }

  /**
   * Remove a click multiplier by index
   */
  public removeClickMultiplier(index: number): void {
    if (index >= 0 && index < this.clickMultipliers.length) {
      this.clickMultipliers.splice(index, 1)
    }
  }

  /**
   * Clear all click multipliers
   */
  public clearClickMultipliers(): void {
    this.clickMultipliers = []
  }

  /**
   * Update the base click value
   */
  public setBaseClickValue(value: Decimal): void {
    this.baseClickValue = value
  }

  /**
   * Get the total multiplier from all active multipliers
   */
  public getTotalMultiplier(): Decimal {
    if (this.clickMultipliers.length === 0) {
      return ONE
    }

    let totalMultiplier = ONE
    for (const multiplier of this.clickMultipliers) {
      totalMultiplier = multiply(totalMultiplier, multiplier)
    }

    return totalMultiplier
  }

  /**
   * Get clicks per second if this handler were automated
   */
  public getClicksPerSecond(clicksPerSecond: Decimal): Decimal {
    return multiply(this.calculateClickValue(), clicksPerSecond)
  }

  /**
   * Simulate multiple clicks
   */
  public simulateClicks(count: number): Decimal {
    const singleClickValue = this.calculateClickValue()
    return multiply(singleClickValue, decimal(count))
  }

  /**
   * Reset the click handler to default state
   */
  public reset(): void {
    this.baseClickValue = ONE
    this.clickMultipliers = []
  }

  /**
   * Create a copy of this click handler
   */
  public clone(): ClickHandler {
    const clone = new ClickHandler(this.baseClickValue)
    clone.clickMultipliers = [...this.clickMultipliers]
    return clone
  }

  /**
   * Get debug information about the click handler
   */
  public getDebugInfo(): {
    baseClickValue: string
    multipliers: string[]
    totalMultiplier: string
    clickValue: string
  } {
    return {
      baseClickValue: this.baseClickValue.toString(),
      multipliers: this.clickMultipliers.map(m => m.toString()),
      totalMultiplier: this.getTotalMultiplier().toString(),
      clickValue: this.calculateClickValue().toString(),
    }
  }
}