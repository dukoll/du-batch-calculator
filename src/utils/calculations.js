const toGrams = (qty, unit) => {
  if (unit === 'kg')  return qty * 1000
  if (unit === 'lb')  return qty * 453.592
  if (unit === 'pcs') return qty   // dimensionless count — passes through as-is
  return qty // g
}

const fromGrams = (grams, unit) => {
  if (unit === 'kg')  return grams / 1000
  if (unit === 'lb')  return grams / 453.592
  if (unit === 'pcs') return grams // dimensionless count
  return grams // g
}

/**
 * Given a product, desired output quantity+unit, and raw materials list,
 * returns an array of { rawMaterial, requiredQty, unit, cost }.
 */
export function calculateRequirements(product, desiredQty, desiredUnit, rawMaterials) {
  const desiredGrams = toGrams(desiredQty, desiredUnit)
  const baseGrams    = toGrams(product.baseBatchSize, product.baseBatchUnit)
  if (baseGrams === 0) return []
  const scaleFactor  = desiredGrams / baseGrams

  return product.ingredients.map(ing => {
    const rm = rawMaterials.find(r => r.id === ing.rawMaterialId)
    const requiredQty = ing.quantity * scaleFactor

    // Convert requiredQty to the raw material's own unit before applying costPerUnit.
    // e.g. ingredient is in g, raw material cost is per kg → convert g → kg first.
    const requiredInGrams   = toGrams(requiredQty, ing.unit)
    const oneRmUnitInGrams  = toGrams(1, rm?.unit ?? ing.unit)
    const requiredInRmUnit  = oneRmUnitInGrams > 0 ? requiredInGrams / oneRmUnitInGrams : 0
    const cost = requiredInRmUnit * (rm?.costPerUnit ?? 0)

    return { rawMaterial: rm, requiredQty, unit: ing.unit, cost }
  })
}

export function totalCost(results) {
  return results.reduce((sum, r) => sum + r.cost, 0)
}

export { fromGrams, toGrams }
