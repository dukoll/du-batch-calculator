import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DataContext = createContext(null)

// DB row → app shape
const toRM      = r => ({ id: r.id, name: r.name, unit: r.unit, costPerUnit: r.cost_per_unit, category: r.category ?? '' })
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
  const [categories, setCategories]     = useState([])

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [rmRes, prodRes, catRes] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('products').select('*, ingredients(*)').order('name'),
        supabase.from('categories').select('name').order('name'),
      ])
      if (rmRes.data)   setRawMaterials(rmRes.data.map(toRM))
      if (prodRes.data) setProducts(prodRes.data.map(toProduct))
      if (catRes.data)  setCategories(catRes.data.map(c => c.name))
    }
    load()
  }, [])

  /** Ensure a category name is persisted to Supabase (upsert). */
  const ensureCategory = useCallback(async (name) => {
    if (!name?.trim()) return
    const trimmed = name.trim()
    if (categories.includes(trimmed)) return
    const { error } = await supabase
      .from('categories')
      .insert({ name: trimmed })
      .select()
      .single()
    if (!error) setCategories(prev => [...prev, trimmed].sort())
  }, [categories])

  // ── Raw Materials ──────────────────────────────────────────
  const addRawMaterial = useCallback(async (material) => {
    await ensureCategory(material.category)
    const { data, error } = await supabase.from('raw_materials')
      .insert({ name: material.name, unit: material.unit, cost_per_unit: material.costPerUnit ?? 0, category: material.category ?? '' })
      .select().single()
    if (!error && data) setRawMaterials(prev => [...prev, toRM(data)])
  }, [ensureCategory])

  const updateRawMaterial = useCallback(async (id, updates) => {
    await ensureCategory(updates.category)
    const { data, error } = await supabase.from('raw_materials')
      .update({ name: updates.name, unit: updates.unit, cost_per_unit: updates.costPerUnit, category: updates.category ?? '' })
      .eq('id', id).select().single()
    if (!error && data) setRawMaterials(prev => prev.map(m => m.id === id ? toRM(data) : m))
  }, [ensureCategory])

  const deleteRawMaterial = useCallback(async (id) => {
    const { error } = await supabase.from('raw_materials').delete().eq('id', id)
    if (!error) setRawMaterials(prev => prev.filter(m => m.id !== id))
  }, [])

  const bulkAddRawMaterials = useCallback(async (incoming) => {
    const existingNames = new Set(rawMaterials.map(m => m.name.toLowerCase()))
    const newOnes = incoming
      .filter(m => !existingNames.has(m.name.toLowerCase()))
      .map(m => ({ name: m.name, unit: m.unit, cost_per_unit: m.costPerUnit ?? 0, category: m.category ?? '' }))
    if (newOnes.length === 0) return
    const { data, error } = await supabase.from('raw_materials').insert(newOnes).select()
    if (!error && data) setRawMaterials(prev => [...prev, ...data.map(toRM)])
    // Persist any new categories
    const newCats = [...new Set(newOnes.map(m => m.category).filter(Boolean))]
    for (const cat of newCats) await ensureCategory(cat)
  }, [rawMaterials, ensureCategory])

  // ── Products ───────────────────────────────────────────────
  const addProduct = useCallback(async (product) => {
    await ensureCategory(product.category)
    const { data: prod, error } = await supabase.from('products')
      .insert({ name: product.name, category: product.category ?? '', base_batch_size: product.baseBatchSize, base_batch_unit: product.baseBatchUnit })
      .select().single()
    if (error || !prod) return

    const ings = (product.ingredients ?? []).map((ing, i) => ({
      product_id: prod.id, raw_material_id: ing.rawMaterialId, quantity: ing.quantity, unit: ing.unit, sort_order: i,
    }))
    let ingData = []
    if (ings.length > 0) {
      const { data } = await supabase.from('ingredients').insert(ings).select()
      ingData = data ?? []
    }
    prod.ingredients = ingData
    setProducts(prev => [...prev, toProduct(prod)])
  }, [ensureCategory])

  const updateProduct = useCallback(async (id, updates) => {
    await ensureCategory(updates.category)
    const { error } = await supabase.from('products')
      .update({ name: updates.name, category: updates.category ?? '', base_batch_size: updates.baseBatchSize, base_batch_unit: updates.baseBatchUnit })
      .eq('id', id)
    if (error) return

    await supabase.from('ingredients').delete().eq('product_id', id)
    const ings = (updates.ingredients ?? []).map((ing, i) => ({
      product_id: id, raw_material_id: ing.rawMaterialId, quantity: ing.quantity, unit: ing.unit, sort_order: i,
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
  }, [ensureCategory])

  const deleteProduct = useCallback(async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const duplicateProduct = useCallback((id) => {
    const source = products.find(p => p.id === id)
    if (!source) return null
    return { ...source, id: undefined, name: `${source.name} (Copy)`, ingredients: source.ingredients.map(i => ({ ...i })) }
  }, [products])

  const bulkAddProducts = useCallback(async (incoming, rawMaterialsList) => {
    const resolved = incoming.map(p => ({
      ...p,
      ingredients: (p.ingredients ?? []).map(ing => {
        const rm = rawMaterialsList.find(r => r.name.toLowerCase() === ing.rawMaterialName.toLowerCase())
        return rm ? { rawMaterialId: rm.id, quantity: ing.quantity, unit: ing.unit } : null
      }).filter(Boolean),
    }))
    for (const p of resolved) await addProduct(p)
  }, [addProduct])

  return (
    <DataContext.Provider value={{
      rawMaterials, products, categories,
      addRawMaterial, updateRawMaterial, deleteRawMaterial, bulkAddRawMaterials,
      addProduct, updateProduct, deleteProduct, duplicateProduct, bulkAddProducts,
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
