// Shared pricing helpers used by API + admin.
// price = wholesalePriceUsd * usdToInr * markup, rounded to ₹...99, unless priceOverride is set.
// originalPrice = msrpUsd * usdToInr, rounded to ₹...99.

export const round99 = (n) => Math.max(99, Math.round(Number(n) / 100) * 100 - 1)

export const computePrices = ({ wholesalePriceUsd = 0, msrpUsd = 0, markup = 1.7, priceOverride = null, usdToInr = 85 }) => {
  const rate = Number(usdToInr) || 85
  const wUsd = Math.max(0, Number(wholesalePriceUsd) || 0)
  const msrp = Math.max(0, Number(msrpUsd) || 0)
  const mk = Math.max(1.01, Number(markup) || 1.7)
  const effectiveBuy = wUsd > 0 ? wUsd : msrp * 0.15
  const computed = round99(effectiveBuy * rate * mk)
  const retail = (priceOverride && Number(priceOverride) > 0) ? Math.round(Number(priceOverride)) : computed
  const original = Math.max(round99(msrp * rate), retail + 200)
  const wholesaleInr = Math.round(wUsd * rate)
  const marginInr = Math.max(0, retail - wholesaleInr)
  const marginPct = wholesaleInr > 0 ? Math.round((marginInr / wholesaleInr) * 100) : 100
  return { price: retail, originalPrice: original, wholesaleInr, marginInr, marginPct, computedPrice: computed }
}
