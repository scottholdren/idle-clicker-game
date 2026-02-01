import { describe, it, expect } from 'vitest'
import Decimal from 'decimal.js'

describe('Project Setup', () => {
  it('should have TypeScript working', () => {
    const message: string = 'Hello, TypeScript!'
    expect(message).toBe('Hello, TypeScript!')
  })

  it('should have Decimal.js working', () => {
    const num = new Decimal('123.456')
    expect(num.toString()).toBe('123.456')
  })

  it('should handle large numbers with Decimal.js', () => {
    const largeNum = new Decimal('999999999999999999999999999999')
    const result = largeNum.plus(1)
    // For very large numbers, Decimal.js uses scientific notation
    expect(result.toString()).toBe('1e+30')
    
    // Test with a number that stays in fixed notation
    const mediumNum = new Decimal('123456789012345')
    const mediumResult = mediumNum.plus(10)
    expect(mediumResult.toString()).toBe('123456789012355')
    
    // Test precision is maintained even with large numbers
    expect(result.toFixed()).toBe('1000000000000000000000000000000')
  })
})