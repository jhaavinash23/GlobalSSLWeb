export const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)
export const pct = (price, original) => {
  if (!original || original <= price) return 0
  return Math.round(((original - price) / original) * 100)
}
