import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { parseProductsWorkbook, downloadProductTemplate } from '../../utils/importExcel'

export default function ImportProductsDialog({ open, onClose, onImport, rawMaterials }) {
  const [products, setProducts] = useState([])
  const [errors, setErrors]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [fileName, setFileName] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    try {
      const result = await parseProductsWorkbook(file)
      setProducts(result.products)
      setErrors(result.errors)
    } catch (err) {
      setErrors([err.message])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Check which ingredient names are unresolved
  function getMissingMaterials(ingredients) {
    return ingredients
      .filter(ing => !rawMaterials.find(
        r => r.name.toLowerCase() === ing.rawMaterialName.toLowerCase()
      ))
      .map(ing => ing.rawMaterialName)
  }

  function handleImport() {
    onImport(products, rawMaterials)
    setProducts([])
    setErrors([])
    setFileName('')
    onClose()
  }

  function handleClose() {
    setProducts([])
    setErrors([])
    setFileName('')
    onClose()
  }

  const totalMissing = products.flatMap(p => getMissingMaterials(p.ingredients))
  const uniqueMissing = [...new Set(totalMissing)]

  return (
    <Modal open={open} onClose={handleClose} title="Import Finished Goods" size="xl">
      <div className="space-y-4">
        {/* Template download */}
        <div className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">
            Each sheet = one product. Row 1: batch size + unit. Row 2: headers. Row 3+: ingredients.
          </p>
          <Button variant="secondary" size="sm" onClick={downloadProductTemplate}>
            Download Template
          </Button>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload .xlsx file</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4
                       file:rounded-lg file:border file:border-gray-300 file:text-sm
                       file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
          />
          {fileName && <p className="text-xs text-gray-500 mt-1">Selected: {fileName}</p>}
        </div>

        {/* Parse errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-red-700">Warnings / Errors:</p>
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
          </div>
        )}

        {/* Missing materials warning */}
        {uniqueMissing.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800 mb-1">
              Some ingredients are not in Raw Materials and will be skipped:
            </p>
            <div className="flex flex-wrap gap-1">
              {uniqueMissing.map(name => (
                <span key={name} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">{name}</span>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Add these to Raw Materials first, then re-import.
            </p>
          </div>
        )}

        {/* Preview */}
        {loading && <p className="text-sm text-gray-500">Parsing workbook…</p>}
        {products.length > 0 && !loading && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview — {products.length} finished good{products.length !== 1 ? 's' : ''} found
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {products.map((p, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <span className="text-xs text-gray-500">
                      Base batch: {p.baseBatchSize} {p.baseBatchUnit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {p.ingredients.length} ingredient{p.ingredients.length !== 1 ? 's' : ''}:&nbsp;
                    {p.ingredients.map(ing => ing.rawMaterialName).join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleImport} disabled={products.length === 0} className="flex-1">
            Import {products.length > 0 ? `${products.length} Finished Good${products.length !== 1 ? 's' : ''}` : ''}
          </Button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
