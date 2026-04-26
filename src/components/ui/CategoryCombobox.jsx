import React, { useState, useRef, useEffect } from 'react'
import { useData } from '../../context/DataContext'

/**
 * A combobox for category selection.
 * - Shows all saved categories in a dropdown.
 * - User can type a new name; on save it gets persisted globally.
 * - Selection is required (validated by parent via error prop).
 */
export default function CategoryCombobox({ value, onChange, error }) {
  const { categories } = useData()
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState(value ?? '')
  const ref               = useRef(null)

  // Sync when parent resets form
  useEffect(() => { setInput(value ?? '') }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // When the current input exactly matches a saved category (e.g. editing an
  // existing product), show ALL categories so the user can pick a different one.
  // Only filter when the user is mid-type with a value that isn't an exact match.
  const isExactMatch = categories.some(
    c => c.toLowerCase() === input.trim().toLowerCase()
  )
  const filtered = isExactMatch
    ? categories
    : categories.filter(c => c.toLowerCase().includes(input.toLowerCase()))

  const showCreate = input.trim() !== '' && !isExactMatch

  function select(name) {
    setInput(name)
    onChange(name)
    setOpen(false)
  }

  function handleInput(e) {
    setInput(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category <span className="text-red-500">*</span>
      </label>
      <div className={`flex items-center border rounded-xl bg-white px-3 py-2.5 gap-2
        ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'}
        focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent`}>
        <input
          type="text"
          value={input}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Select or type a category…"
          className="flex-1 text-sm bg-transparent outline-none min-w-0"
        />
        <button type="button" onClick={() => setOpen(o => !o)}
          className="text-gray-400 hover:text-gray-600 shrink-0">
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl
          shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 && !showCreate && (
            <div className="px-4 py-3 text-sm text-gray-400">No categories yet</div>
          )}
          {filtered.map(cat => (
            <button key={cat} type="button" onMouseDown={() => select(cat)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-700
                transition-colors ${cat === value ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'}`}>
              {cat}
            </button>
          ))}
          {showCreate && (
            <button type="button" onMouseDown={() => select(input.trim())}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 font-medium
                hover:bg-red-50 transition-colors border-t border-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
