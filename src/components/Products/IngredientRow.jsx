import React from 'react'

export default function IngredientRow({ ingredient, rawMaterials, onChange, onRemove, error }) {
  function set(field) {
    return (e) => onChange({ ...ingredient, [field]: e.target.value })
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      {/* Row 1: raw material selector + remove button */}
      <div className="flex gap-2 items-center">
        <select
          value={ingredient.rawMaterialId}
          onChange={set('rawMaterialId')}
          className={`flex-1 px-3 py-2.5 text-sm border rounded-lg bg-white
                      focus:outline-none focus:ring-2 focus:ring-red-500
                      ${error?.rawMaterialId ? 'border-red-400' : 'border-gray-300'}`}
        >
          <option value="">Select material…</option>
          {rawMaterials.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
          ))}
        </select>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="tap-none shrink-0 w-9 h-9 flex items-center justify-center
                     text-red-400 hover:text-red-600 bg-white border border-gray-200
                     rounded-lg active:bg-red-50 transition-colors"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error?.rawMaterialId && (
        <p className="text-xs text-red-600">{error.rawMaterialId}</p>
      )}

      {/* Row 2: quantity + unit */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Quantity"
            value={ingredient.quantity}
            onChange={set('quantity')}
            className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white
                        focus:outline-none focus:ring-2 focus:ring-red-500
                        ${error?.quantity ? 'border-red-400' : 'border-gray-300'}`}
          />
          {error?.quantity && <p className="text-xs text-red-600 mt-0.5">{error.quantity}</p>}
        </div>

        <select
          value={ingredient.unit}
          onChange={set('unit')}
          className="w-24 px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="lb">lb</option>
          <option value="pcs">pcs</option>
          <option value="bag">Bag</option>
          <option value="bucket">Bucket</option>
          <option value="pack">Pack</option>
          <option value="bottle">Bottle</option>
          <option value="unit">Unit</option>
        </select>
      </div>
    </div>
  )
}
