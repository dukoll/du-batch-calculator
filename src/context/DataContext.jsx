import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DataContext = createContext(null)

// DB row → app shape
const toRM = r => ({ id: r.id, name: r.name, unit: r.unit, costPerUnit: r.cost_per_unit })
const toProduct = r => ({
  id: r.id,
  name: r.name,
  category: r.category ?? '',
  baseBatchSize: r.base_batch_size,
  baseBatchUnit: r.base_batch_unit,
  ingredients: (r.ingredients ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(i => ({ rawMaterialId: i.raw_material_id, quantity: i.quantity, unit: i.unit })),
})

export function DataProvider({ children }) {
  const [rawMaterials, setRawMaterials] = useState([])
  const [products, setProducts]         = useState([])

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [rmRes, prodRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('products').select('*, ingredients(*)').order('name'),
      ])
      if (rmRes.data)   setRawMaterials(rmRes.data.map(toRM))
      if (prodRes.data) setProducts(prodRes.data.map(toProduct))
    }
    load()
  }, [])

  // ── Raw Materials ──────────────────────────────────────────
  const addRawMaterial = useCallback(async (material) => {
    const { data, error } = await supabase.from('raw_materials')
      .insert({ name: material.name, unit: material.unit, cost_per_unit: material.costPerUnit ?? 0 })
      .select().single()
    if (!error && data) setRawMaterials(prev => [...prev, toRM(data)])
  }, [])

  const updateRawMaterial = useCallback(async (id, updates) => {
    const { data, error } = await supabase.from('raw_materials')
      .update({ name: updates.name, unit: updates.unit, cost_per_unit: updates.costPerUnit })
      .eq('id', id).select().single()
    if (!error && data) setRawMaterials(prev => prev.map(m => m.id === id ? toRM(data) : m))
  }, [])

  const deleteRawMaterial = useCallback(async (id) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (!error) setRawMaterials(prev => prev.filter(m => m.id !== id))
  }, [])

  const bulkAddRawMaterials = useCallback(async (incoming) => {
    const existingNames = new Set(rawMaterials.map(m => m.name.toLowerCase()))
    const newOnes = incoming
      .filter(m => !existingNames.has(m.name.toLowerCase()))
      .map(m => ({ name: m.name, unit: m.unit, cost_per_unit: m.costPerUnit ?? 0 }))
    if (newOnes.length === 0) return
    const { data, error } = await supabase.from('raw_materials').insert(newOnes).select()
    if (!error && data) setRawMaterials(prev => [...prev, ...data.map(toRM)])
  }, [rawMaterials])

  // ── Products ───────────────────────────────────────────────
  const addProduct = useCallback(async (product) => {
    const { data: prod, error } = await supabase.from('products')
      .insert({
        name: product.name,
        category: product.category ?? '',
        base_batch_size: product.baseBatchSize,
        base_batch_unit: product.baseBatchUnit,
      })
      .select().single()
    if (error || !prod) return

    const ings = (product.ingredients ?? []).map((ing, i) => ({
      product_id: prod.id,
      raw_material_id: ing.rawMaterialId,
      quantity: ing.quantity,
      unit: ing.unit,
      sort_order: i,
    }))
    let ingData = []
    if (ings.length > 0) {
      const { data } = await supabase.from('ingredients').insert(ings).select()
      ingData = data ?? []
    }
    prod.ingredients = ingData
    setProducts(prev => [...prev, toProduct(prod)])
  }, [])

  const updateProduct = useCallback(async (id, updates) => {
    const { error } = await supabase.from('products')
      .update({
        name: updates.name,
        category: updates.category ?? '',
        base_batch_size: updates.baseBatchSize,
        base_batch_unit: updates.baseBatchUnit,
      })
      .eq('id', id)
    if (error) return

    await supabase.from('ingredients').delete().eq('product_id', id)
    const ings = (updates.ingredients ?? []).map((ing, i) => ({
      product_id: id,
      raw_material_id: ing.rawMaterialId,
      quantity: ing.quantity,
      unit: ing.unit,
      sort_order: i,
    }))
    let ingData = []
    if (ings.length > 0) {
      const { data } = await supabase.from('ingredients').insert(ings).select()
      ingData = data ?? []
    }
    setProducts(prev => prev.map(p => p.id === id
      ? toProduct({ id, name: updates.name, category: updates.category ?? '', base_batch_size: updates.baseBatchSize, base_batch_unit: updates.baseBatchUnit, ingredients: ingData })
      : p
    ))
  }, [])

  const deleteProduct = useCallback(async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const duplicateProduct = useCallback((id) => {
    const source = products.find(p => p.id === id)
    if (!source) return null
    return {
      ...source,
      id: undefined,
      name: `${source.name} (Copy)`,
      ingredients: source.ingredients.map(i => ({ ...i })),
    }
  }, [products])

  const bulkAddProducts = useCallback(async (incoming, rawMaterialsList) => {
    const resolved = incoming.map(p => ({
      ...p,
      ingredients: (p.ingredients ?? []).map(ing => {
        const rm = rawMaterialsList.find(
          r => r.name.toLowerCase() === ing.rawMaterialName.toLowerCase()
        )
        return rm ? { rawMaterialId: rm.id, quantity: ing.quantity, unit: ing.unit } : null
      }).filter(Boolean),
    }))
    for (const p of resolved) {
      await addProduct(p)
    }
  }, [addProduct])

  return (
    <DataContext.Provider value={{
      rawMaterials,
      products,
      addRawMaterial,
      updateRawMaterial,
      deleteRawMaterial,
      bulkAddRawMaterials,
      addProduct,
      updateProduct,
      deleteProduct,
      duplicateProduct,
      bulkAddProducts,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
