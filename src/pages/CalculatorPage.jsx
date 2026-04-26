import React, { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { calculateRequirements, isCountUnit } from '../utils/calculations'
import { exportToPdf } from '../utils/exportPdf'
import { saveHistoryEntry } from '../utils/historyStore'
import ResultsTable from '../components/Calculator/ResultsTable'
import Button from '../components/ui/Button'
import { Select } from '../components/ui/Input'

export default function CalculatorPage() {
  const { products, rawMaterials } = useData()
  const { session } = useAuth()

  const [productId, setProductId]   = useState('')
  const [desiredQty, setDesiredQty] = useState('')
  const [desiredUnit, setDesiredUnit] = useState('kg')
  const [search, setSearch]         = useState('')

  const selectedProduct = products.find(p => p.id === productId)
  const isCountBased    = isCountUnit(selectedProduct?.baseBatchUnit)
  const isPcsBased      = isCountBased  // kept for backward compat with existing JSX below
  const effectiveUnit   = isCountBased ? selectedProduct.baseBatchUnit : desiredUnit

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const results = useMemo(() => {
    if (!selectedProduct || !desiredQty || parseFloat(desiredQty) <= 0) return []
    return calculateRequirements(selectedProduct, parseFloat(desiredQty), effectiveUnit, rawMaterials)
  }, [selectedProduct, desiredQty, effectiveUnit, rawMaterials])

  async function handleExportPdf() {
    if (!selectedProduct || results.length === 0) return
    await exportToPdf(selectedProduct, parseFloat(desiredQty), effectiveUnit, results)
    // Save to history only after successful PDF export
    saveHistoryEntry({
      userId: session?.userId,
      productName: selectedProduct.name,
      quantity: parseFloat(desiredQty),
      unit: effectiveUnit,
      results,
    })
  }

  const hasResult = results.length > 0

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* ── Page header ── */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Calculator</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">
          Select a finished good, enter quantity, see required raw materials.
        </p>
      </div>

      {/* ── Input card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 mb-4 space-y-4">

        {/* Formulation selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Finished Good</label>
          {products.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-400">
              No finished goods yet.{' '}
              <a href="/products" className="text-red-600">Add one first.</a>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
                             focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <select
                value={productId}
                onChange={e => { setProductId(e.target.value); setDesiredQty('') }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">— Select a finished good —</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.category ? ` (${p.category})` : ''} — {p.baseBatchSize} {p.baseBatchUnit}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Desired quantity */}
        {selectedProduct && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isPcsBased ? 'Number of Units' : 'Desired Quantity'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step={isPcsBased ? '1' : 'any'}
                placeholder={isPcsBased ? 'e.g. 100' : `e.g. ${selectedProduct.baseBatchSize * 2}`}
                value={desiredQty}
                onChange={e => setDesiredQty(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
                           focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {!isCountBased ? (
                <select value={desiredUnit} onChange={e => setDesiredUnit(e.target.value)}
                  className="w-20 px-2 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
                             focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="lb">lb</option>
                </select>
              ) : (
                <div className="w-20 flex items-center justify-center text-sm font-medium
                                text-gray-500 border border-gray-200 rounded-xl bg-gray-50 select-none capitalize">
                  {selectedProduct.baseBatchUnit}
                </div>
              )}
            </div>
            {isPcsBased && (
              <p className="text-xs text-gray-400 mt-1">
                1 unit = {selectedProduct.baseBatchSize} {selectedProduct.baseBatchUnit} recipe
              </p>
            )}
          </div>
        )}

        {/* Scale info bar + Export PDF */}
        {hasResult && selectedProduct && (
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 gap-2">
            <span className="text-xs md:text-sm text-gray-500 min-w-0">
              {isPcsBased ? (
                <>Making <span className="font-semibold text-red-700 capitalize">{parseFloat(desiredQty)} {selectedProduct.baseBatchUnit}{parseFloat(desiredQty) !== 1 ? 's' : ''}</span>
                {' '}— ×{(parseFloat(desiredQty) / selectedProduct.baseBatchSize).toFixed(4)}</>
              ) : (
                <>Scale: <span className="font-semibold text-red-700">×{(
                    (effectiveUnit === 'kg' ? parseFloat(desiredQty) * 1000
                      : effectiveUnit === 'lb' ? parseFloat(desiredQty) * 453.592
                      : parseFloat(desiredQty)) /
                    (selectedProduct.baseBatchUnit === 'kg' ? selectedProduct.baseBatchSize * 1000
                      : selectedProduct.baseBatchUnit === 'lb' ? selectedProduct.baseBatchSize * 453.592
                      : selectedProduct.baseBatchSize)
                  ).toFixed(4)}</span></>
              )}
            </span>
            <button
              onClick={handleExportPdf}
              className="tap-none shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                         text-gray-700 bg-white border border-gray-300 rounded-lg active:bg-gray-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF
            </button>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {hasResult ? (
        <ResultsTable results={results} desiredQty={parseFloat(desiredQty)} desiredUnit={effectiveUnit} />
      ) : selectedProduct && desiredQty && parseFloat(desiredQty) > 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          This finished good has no ingredients configured yet.
        </div>
      ) : (
        <div className="text-center py-12 md:py-16">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 md:w-8 md:h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01
                   M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-sm md:text-base">Select a finished good to get started</p>
          <p className="text-gray-400 text-xs md:text-sm mt-1">Then enter your desired output quantity.</p>
        </div>
      )}
    </div>
  )
}
