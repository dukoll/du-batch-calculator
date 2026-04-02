import React, { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input, { Select } from '../ui/Input'
import IngredientRow from './IngredientRow'

const emptyIngredient = () => ({ rawMaterialId: '', quantity: '', unit: 'kg' })

const emptyProduct = {
  name: '',
  category: '',
  baseBatchSize: '',
  baseBatchUnit: 'kg',
  ingredients: [emptyIngredient()],
}

export default function ProductForm({ initial, rawMaterials, onSave, onCancel }) {
  const [form, setForm]     = useState(initial ?? emptyProduct)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(initial ?? emptyProduct)
    setErrors({})
  }, [initial])

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  function setIngredient(idx, updated) {
    setForm(f => {
      const ings = [...f.ingredients]
      ings[idx] = updated
      return { ...f, ingredients: ings }
    })
  }

  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }))
  }

  function removeIngredient(idx) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const bs = parseFloat(form.baseBatchSize)
    if (isNaN(bs) || bs <= 0) e.baseBatchSize = 'Enter a valid batch size > 0'
    if (form.ingredients.length === 0) e.ingredients = 'Add at least one ingredient'

    const ingErrors = form.ingredients.map(ing => {
      const ie = {}
      if (!ing.rawMaterialId) ie.rawMaterialId = 'Select a material'
      const q = parseFloat(ing.quantity)
      if (isNaN(q) || q <= 0) ie.quantity = 'Invalid qty'
      return Object.keys(ie).length ? ie : null
    })
    if (ingErrors.some(Boolean)) e.ingErrors = ingErrors

    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    onSave({
      name: form.name.trim(),
      category: form.category.trim(),
      baseBatchSize: parseFloat(form.baseBatchSize),
      baseBatchUnit: form.baseBatchUnit,
      ingredients: form.ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
      })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Product name + category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Product Name"
          placeholder="e.g. Fruit Juice X"
          value={form.name}
          onChange={setField('name')}
          error={errors.name}
        />
        <Input
          label="Category (optional)"
          placeholder="e.g. Beverages"
          value={form.category}
          onChange={setField('category')}
        />
      </div>

      {/* Base batch */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            label="Base Batch Size"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 100"
            value={form.baseBatchSize}
            onChange={setField('baseBatchSize')}
            error={errors.baseBatchSize}
          />
        </div>
        <Select
          label="Unit"
          value={form.baseBatchUnit}
          onChange={setField('baseBatchUnit')}
          className="w-28"
        >
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="lb">lb</option>
          <option value="pcs">pcs (units)</option>
        </Select>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Ingredients</label>
          {rawMaterials.length === 0 && (
            <p className="text-xs text-amber-600">No raw materials yet — add some first.</p>
          )}
        </div>

        {errors.ingredients && (
          <p className="text-xs text-red-600 mb-2">{errors.ingredients}</p>
        )}

        <div className="space-y-2">
          {form.ingredients.map((ing, idx) => (
            <IngredientRow
              key={idx}
              ingredient={ing}
              rawMaterials={rawMaterials}
              onChange={(u) => setIngredient(idx, u)}
              onRemove={() => removeIngredient(idx)}
              error={errors.ingErrors?.[idx]}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add ingredient
        </button>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button type="submit" className="flex-1">Save Formulation</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
