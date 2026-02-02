import Decimal from 'decimal.js'

/**
 * Get the CSS class for rate color based on value (YouTube style)
 * @param rate - The rate value (can be Decimal or number)
 * @returns CSS class name for the rate color
 */
export const getRateColorClass = (rate: Decimal | number): string => {
  const numericRate = typeof rate === 'number' ? rate : rate.toNumber()
  
  if (numericRate < 0) {
    return 'rate-negative' // Red for negative rates
  } else if (numericRate > 0) {
    return 'rate-positive' // Green for positive rates
  } else {
    return '' // No class for zero (keeps default gray)
  }
}

/**
 * Get the rate display with proper formatting and sign
 * @param rate - The rate value
 * @param formatFn - Function to format the number
 * @returns Formatted rate string with + or - sign
 */
export const formatRate = (rate: Decimal | number, formatFn: (value: any) => string): string => {
  const numericRate = typeof rate === 'number' ? rate : rate.toNumber()
  
  if (numericRate === 0) {
    return '+0/sec'
  } else if (numericRate > 0) {
    return `+${formatFn(rate)}/sec`
  } else {
    return `${formatFn(rate)}/sec` // Negative sign already included in formatting
  }
}