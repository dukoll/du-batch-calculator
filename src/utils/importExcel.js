import * as XLSX from 'xlsx'

/**
 * Parse a flat sheet for Raw Materials.
 * Expected columns (case-insensitive): name, unit, costperunit / cost_per_unit / cost
 * Returns { rows: [{name, unit, costPerUnit}], errors: string[] }
 */
export function parseRawMaterialsSheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

        const errors = []
        const rows = raw.map((row, i) => {
          // Normalise keys to lowercase with no spaces/underscores
          const norm = {}
          for (const k of Object.keys(row)) {
            norm[k.toLowerCase().replace(/[\s_]/g, '')] = row[k]
          }
          const name = String(norm['name'] ?? '').trim()
          const unit = String(norm['unit'] ?? 'kg').trim().toLowerCase()
          const costRaw = norm['costperunit'] ?? norm['cost'] ?? 0
          const costPerUnit = parseFloat(costRaw)

          if (!name) { errors.push(`Row ${i + 2}: missing name`); return null }
          if (!['kg', 'g', 'lb'].includes(unit)) { errors.push(`Row ${i + 2}: invalid unit "${unit}" (use kg/g/lb)`) }
          // note: pcs is only valid as a baseBatchUnit, not for raw material costs
          if (isNaN(costPerUnit)) { errors.push(`Row ${i + 2}: invalid cost "${costRaw}"`); return null }

          return { name, unit: ['kg', 'g', 'lb'].includes(unit) ? unit : 'kg', costPerUnit }
        }).filter(Boolean)

        resolve({ rows, errors })
      } catch (err) {
        reject(new Error('Failed to parse file: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse a multi-sheet workbook for Products/Formulations.
 * Each sheet = one product. Sheet name = product name.
 * Row 1 of each sheet must have: baseBatchSize | baseBatchUnit
 * Row 3+ (after a blank/header row): rawMaterial | quantity | unit
 *
 * Returns { products: [{name, baseBatchSize, baseBatchUnit, ingredients:[{rawMaterialName,quantity,unit}]}], errors: [] }
 */
export function parseProductsWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' })
        const errors = []
        const products = []

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

          if (rows.length < 2) {
            errors.push(`Sheet "${sheetName}": not enough rows`)
            continue
          }

          // Row 0: [baseBatchSize, baseBatchUnit]  e.g. [100, 'kg']
          const batchSize = parseFloat(rows[0][0])
          const batchUnit = String(rows[0][1] ?? 'kg').trim().toLowerCase()
          // pcs is valid as a baseBatchUnit
          const validBatchUnits = ['kg', 'g', 'lb', 'pcs']

          if (isNaN(batchSize) || batchSize <= 0) {
            errors.push(`Sheet "${sheetName}": invalid baseBatchSize in cell A1 ("${rows[0][0]}")`)
            continue
          }

          // Row 1 is a header row (rawMaterial | quantity | unit) — skip it
          // Rows 2+ are ingredients
          const ingredients = []
          for (let i = 2; i < rows.length; i++) {
            const [rmName, qty, unit] = rows[i]
            if (!rmName) continue
            const q = parseFloat(qty)
            if (isNaN(q)) {
              errors.push(`Sheet "${sheetName}" row ${i + 1}: invalid quantity "${qty}"`)
              continue
            }
            const u = String(unit ?? 'kg').trim().toLowerCase()
            ingredients.push({
              rawMaterialName: String(rmName).trim(),
              quantity: q,
              unit: ['kg', 'g', 'lb'].includes(u) ? u : 'kg',
            })
          }

          products.push({
            name: sheetName,
            baseBatchSize: batchSize,
            baseBatchUnit: validBatchUnits.includes(batchUnit) ? batchUnit : 'kg',
            ingredients,
          })
        }

        resolve({ products, errors })
      } catch (err) {
        reject(new Error('Failed to parse workbook: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Generate and download a template xlsx for Raw Materials.
 */
export function downloadRawMaterialTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['name', 'unit', 'costPerUnit'],
    ['Sugar', 'kg', 1.50],
    ['Water', 'kg', 0.10],
    ['Salt', 'kg', 0.80],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'RawMaterials')
  XLSX.writeFile(wb, 'raw_materials_template.xlsx')
}

/**
 * Generate and download a template xlsx for Products.
 */
export function downloadProductTemplate() {
  const wb = XLSX.utils.book_new()

  // Example product sheet
  const ws = XLSX.utils.aoa_to_sheet([
    [100, 'kg'],                              // Row 1: baseBatchSize | baseBatchUnit
    ['rawMaterial', 'quantity', 'unit'],       // Row 2: header
    ['Sugar', 40, 'kg'],
    ['Water', 50, 'kg'],
    ['Salt', 10, 'kg'],
  ])
  XLSX.utils.book_append_sheet(wb, ws, 'Product X')

  XLSX.writeFile(wb, 'products_template.xlsx')
}
