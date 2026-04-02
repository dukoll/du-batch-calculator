import React, { useState } from 'react'
import { useData } from '../context/DataContext'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProductForm from '../components/Products/ProductForm'
import ImportProductsDialog from '../components/Products/ImportProductsDialog'

export default function ProductsPage() {
  const {
    products, rawMaterials,
    addProduct, updateProduct, deleteProduct, duplicateProduct, bulkAddProducts,
  } = useData()

  const [search, setSearch]                 = useState('')
  const [formOpen, setFormOpen]             = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [importOpen, setImportOpen]         = useState(false)
  const [deleteTarget, setDeleteTarget]     = useState(null)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function openAdd()  { setEditingProduct(null); setFormOpen(true) }
  function openEdit(p) { setEditingProduct(p);   setFormOpen(true) }
  function openDuplicate(id) {
    const draft = duplicateProduct(id)
    if (draft) { setEditingProduct(draft); setFormOpen(true) }
  }

  function handleSave(data) {
    if (editingProduct?.id) updateProduct(editingProduct.id, data)
    else addProduct(data)
    setFormOpen(false)
  }

  function confirmDelete() {
    if (deleteTarget) deleteProduct(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Formulations</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {products.length} product{products.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        {/* Desktop buttons */}
        <div className="hidden md:flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <UploadIcon /> Import Excel
          </Button>
          <Button onClick={openAdd}>
            <PlusIcon /> Add Formulation
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <SearchIcon />
        <input type="text" placeholder="Search formulations…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500" />
      </div>

      {/* ── Mobile action buttons ── */}
      <div className="flex gap-2 mb-4 md:hidden">
        <button onClick={() => setImportOpen(true)}
          className="tap-none flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                     text-gray-700 bg-white border border-gray-300 rounded-xl active:bg-gray-50">
          <UploadIcon /> Import Excel
        </button>
        <button onClick={openAdd}
          className="tap-none flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                     text-white bg-red-600 rounded-xl active:bg-red-700">
          <PlusIcon className="text-white" /> Add
        </button>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                 M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">{search ? 'No formulations match.' : 'No formulations yet. Add one or import.'}</p>
        </div>
      ) : (
        /* ── Responsive grid — 1 col mobile, 2 col sm, 3 col lg ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              rawMaterials={rawMaterials}
              onEdit={() => openEdit(p)}
              onDuplicate={() => openDuplicate(p.id)}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} size="lg"
        title={editingProduct?.id ? 'Edit Formulation' : editingProduct ? 'Duplicate Formulation' : 'New Formulation'}>
        <ProductForm initial={editingProduct} rawMaterials={rawMaterials}
          onSave={handleSave} onCancel={() => setFormOpen(false)} />
      </Modal>

      <ImportProductsDialog open={importOpen} onClose={() => setImportOpen(false)}
        onImport={bulkAddProducts} rawMaterials={rawMaterials} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Formulation" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?
          This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={confirmDelete} className="flex-1">Delete</Button>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  )
}

/* ── Product card ── */
function ProductCard({ product, rawMaterials, onEdit, onDuplicate, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Batch: {product.baseBatchSize} {product.baseBatchUnit}
          </p>
        </div>
        {product.category && <Badge label={product.category} />}
      </div>

      {/* Ingredients summary */}
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">
          {product.ingredients.length} Ingredient{product.ingredients.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {product.ingredients.slice(0, 5).map((ing, i) => {
            const rm = rawMaterials.find(r => r.id === ing.rawMaterialId)
            return (
              <div key={i} className="flex justify-between text-xs text-gray-600">
                <span className="truncate mr-2">{rm?.name ?? <span className="text-red-400">Unknown</span>}</span>
                <span className="shrink-0 text-gray-400">{ing.quantity} {ing.unit}</span>
              </div>
            )
          })}
          {product.ingredients.length > 5 && (
            <p className="text-xs text-gray-400">+{product.ingredients.length - 5} more…</p>
          )}
        </div>
      </div>

      {/* Action buttons — larger touch targets on mobile */}
      <div className="flex gap-1.5 pt-2 border-t border-gray-100">
        <button onClick={onEdit}
          className="tap-none flex-1 py-2 text-xs font-medium text-red-600 bg-red-50
                     rounded-xl active:bg-red-100 transition-colors">
          Edit
        </button>
        <button onClick={onDuplicate}
          className="tap-none flex-1 py-2 text-xs font-medium text-purple-600 bg-purple-50
                     rounded-xl active:bg-purple-100 transition-colors">
          Duplicate
        </button>
        <button onClick={onDelete}
          className="tap-none flex-1 py-2 text-xs font-medium text-red-500 bg-red-50
                     rounded-xl active:bg-red-100 transition-colors">
          Delete
        </button>
      </div>
    </div>
  )
}

/* ── Icons ── */
function SearchIcon() {
  return <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
    fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
}
function PlusIcon({ className }) {
  return <svg className={`w-4 h-4 ${className ?? ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
}
function UploadIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
}
