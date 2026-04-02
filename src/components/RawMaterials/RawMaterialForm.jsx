import React, { useState, useEffect } from 'react'
import Button from '../ui/Button'
import Input, { Select } from '../ui/Input'

const empty = { name: '', unit: 'kg', costPerUnit: '' }

export default function RawMaterialForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(initial ?? empty)
    setErrors({})
  }, [initial])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    const cost = parseFloat(form.costPerUnit)
    if (isNaN(cost) || cost < 0) e.costPerUnit = 'Enter a valid cost ≥ 0'
    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ name: form.name.trim(), unit: form.unit, costPerUnit: parseFloat(form.costPerUnit) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Material Name"
        placeholder="e.g. Sugar"
        value={form.name}
        onChange={set('name')}
        error={errors.name}
      />
      <Select label="Unit" value={form.unit} onChange={set('unit')}>
        <option value="kg">kg</option>
        <option value="g">g</option>
        <option value="lb">lb</option>
      </Select>
      <Input
        label="Cost per Unit"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={form.costPerUnit}
        onChange={set('costPerUnit')}
        error={errors.costPerUnit}
      />
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
