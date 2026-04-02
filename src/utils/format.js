/**
 * Format a number removing unnecessary trailing zeros.
 * e.g.  600.0000 → "600"
 *       0.6000   → "0.6"
 *       43.40    → "43.4"
 *       0.0025   → "0.0025"
 *       43.45    → "43.45"
 */
export function formatNum(value, maxDecimals = 4) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  const rounded = parseFloat(value.toFixed(maxDecimals))
  return rounded.toString()
}
