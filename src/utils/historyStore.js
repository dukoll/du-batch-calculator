const STORAGE_KEY = 'du_batch_history'

/**
 * Save a new batch history entry (called after PDF export).
 * Stores only what's needed to regenerate the PDF.
 */
export function saveHistoryEntry({ productName, quantity, unit, results }) {
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    productName,
    quantity,
    unit,
    results: results.map(r => ({
      rawMaterialName: r.rawMaterial?.name ?? '—',
      requiredQty: r.requiredQty,
      unit: r.unit,
    })),
  }
  const existing = getHistory()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing]))
  return entry
}

/** Returns all history entries, newest first. */
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Delete a single entry by id. */
export function deleteHistoryEntry(id) {
  const updated = getHistory().filter(e => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

/** Wipe all history. */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}
