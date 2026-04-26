import React, { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { formatNum } from '../utils/format'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import RawMaterialForm from '../components/RawMaterials/RawMaterialForm'
import ImportRawMaterialsDialog from '../components/RawMaterials/ImportRawMaterialsDialog'

export default function RawMaterialsPage() {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, bulkAddRawMaterials } = useData()

  const [search, setSearch]             = useState('')
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState(null)
  const [importOpen, setImportOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [collapsed, setCollapsed]       = useState({})

  const filtered = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Group filtered materials by category, sorted alphabetically; Uncategorized last
  const groups = useMemo(() => {
    const map = {}
    filtered.forEach(m => {
      const cat = m.category?.trim() || 'Uncategorized'
      if (!map[cat]) map[cat] = []
      map[cat].push(m)
    })
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1
      if (b === 'Uncategorized') return -1
      return a.localeCompare(b)
    })
  }, [filtered])

  function toggleGroup(cat) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  function openAdd()   { setEditing(null); setFormOpen(true) }
  function openEdit(m) { setEditing(m);    setFormOpen(true) }

  function handleSave(data) {
    if (editing) updateRawMaterial(editing.id, data)
    else addRawMaterial(data)
    setFormOpen(false)
  }

  function confirmDelete() {
    if (deleteTarget) deleteRawMaterial(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {rawMaterials.length} material{rawMaterials.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        {/* Desktop buttons */}
        <div className="hidden md:flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <UploadIcon /> Import Excel
          </Button>
          <Button onClick={openAdd}>
            <PlusIcon /> Add Material
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* ── Mobile action buttons ── */}
      <div className="flex gap-2 mb-4 md:hidden">
        <button
          onClick={() => setImportOpen(true)}
          className="tap-none flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                     text-gray-700 bg-white border border-gray-300 rounded-xl active:bg-gray-50"
        >
          <UploadIcon /> Import Excel
        </button>
        <button
          onClick={openAdd}
          className="tap-none flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                     text-white bg-red-600 rounded-xl active:bg-red-700"
        >
          <PlusIcon className="text-white" /> Add Material
        </button>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158
                 a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172
                 a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828
                 c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <p className="text-sm">{search ? 'No materials match your search.' : 'No materials yet. Add one or import from Excel.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([cat, items]) => (
            <div key={cat}>
              {/* Category header — collapsible */}
              <button
                type="button"
                onClick={() => toggleGroup(cat)}
                className="w-full flex items-center justify-between px-4 py-2.5
                           bg-gray-50 border border-gray-200 rounded-xl
                           hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${collapsed[cat] ? '-rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700">{cat}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full
                                   bg-gray-200 text-xs font-medium text-gray-500">
                    {items.length}
                  </span>
                </div>
              </button>

              {/* Items (expanded) */}
              {!collapsed[cat] && (
                <div className="mt-1.5">
                  {/* Desktop table */}
                  <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Unit</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36">Cost / Unit</th>
                          <th className="px-4 py-2.5 w-20" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map(m => (
                          <tr key={m.id} className="hover:bg-gray-50 group">
                            <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                            <td className="px-4 py-3 text-gray-500">{m.unit}</td>
                            <td className="px-4 py-3 text-gray-700">{formatNum(m.costPerUnit, 2)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <IconBtn onClick={() => openEdit(m)} title="Edit" color="blue">
                                  <EditIcon />
                                </IconBtn>
                                <IconBtn onClick={() => setDeleteTarget(m)} title="Delete" color="red">
                                  <TrashIcon />
                                </IconBtn>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden space-y-2">
                    {items.map(m => (
                      <div key={m.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{m.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {m.unit} &nbsp;·&nbsp; Cost: <span className="text-gray-700 font-medium">{formatNum(m.costPerUnit, 2)}</span> / {m.unit}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(m)}
                            className="tap-none w-9 h-9 flex items-center justify-center rounded-xl
                                       text-red-600 bg-red-50 active:bg-red-100"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(m)}
                            className="tap-none w-9 h-9 flex items-center justify-center rounded-xl
                                       text-red-500 bg-red-50 active:bg-red-100"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit modal ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Material' : 'Add Raw Material'} size="sm">
        <RawMaterialForm initial={editing} onSave={handleSave} onCancel={() => setFormOpen(false)} />
      </Modal>

      {/* ── Import modal ── */}
      <ImportRawMaterialsDialog
        open={importOpen} onClose={() => setImportOpen(false)} onImport={bulkAddRawMaterials} />

      {/* ── Delete confirm ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Material" size="sm">
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

/* ── Tiny reusable icon components ──────────────────────── */
function IconBtn({ onClick, title, color, children }) {
  const colors = { blue: 'hover:text-red-600 hover:bg-red-50', red: 'hover:text-red-600 hover:bg-red-50' }
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg text-gray-400 transition-colors ${colors[color]}`}>
      {children}
    </button>
  )
}

function SearchIcon({ className }) {
  return <svg className={className ?? 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
function EditIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
}
function TrashIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
}
