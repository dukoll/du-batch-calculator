import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchHistory, deleteHistoryEntry, clearHistory } from '../utils/historyStore'
import { exportToPdf, previewPdfUrl } from '../utils/exportPdf'

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }
}

function entryToExportArgs(entry) {
  const product = { name: entry.product_name }
  const results = (entry.results ?? []).map(r => ({
    rawMaterial: { name: r.rawMaterialName },
    rawMaterialName: r.rawMaterialName,
    requiredQty: r.requiredQty,
    unit: r.unit,
  }))
  return { product, quantity: entry.quantity, unit: entry.unit, results }
}

export default function HistoryPage() {
  const { session } = useAuth()
  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingId, setLoadingId]     = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = useCallback(async () => {
    if (!session?.id) return
    setLoading(true)
    const data = await fetchHistory(session.id)
    setEntries(data)
    setLoading(false)
  }, [session?.id])

  useEffect(() => { load() }, [load])

  async function handlePreview(entry) {
    setLoadingId(entry.id + '_preview')
    try {
      const { product, quantity, unit, results } = entryToExportArgs(entry)
      const url = await previewPdfUrl(product, quantity, unit, results)
      window.open(url, '_blank')
    } finally { setLoadingId(null) }
  }

  async function handleDownload(entry) {
    setLoadingId(entry.id + '_download')
    try {
      const { product, quantity, unit, results } = entryToExportArgs(entry)
      await exportToPdf(product, quantity, unit, results)
    } finally { setLoadingId(null) }
  }

  async function handleDelete(id) {
    await deleteHistoryEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  async function handleClearAll() {
    await clearHistory(session.id)
    setEntries([])
    setConfirmClear(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Batch History</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            PDF-exported batches — synced across all your devices
          </p>
        </div>
        {entries.length > 0 && (
          <div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Clear all {entries.length}?</span>
                <button onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                  Clear All
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold">No batch history yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Go to the Calculator, run a batch and tap <strong>PDF</strong> — it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const { date, time } = formatDateTime(entry.created_at)
            const isPreviewLoading  = loadingId === entry.id + '_preview'
            const isDownloadLoading = loadingId === entry.id + '_download'
            return (
              <div key={entry.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-400">{date} &middot; {time}</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm truncate">{entry.product_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                      {entry.quantity} {entry.unit}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(entry.results ?? []).length} ingredient{(entry.results ?? []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handlePreview(entry)} disabled={!!loadingId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700
                      bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                    {isPreviewLoading
                      ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                    Preview
                  </button>

                  <button onClick={() => handleDownload(entry)} disabled={!!loadingId}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                      bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                    {isDownloadLoading
                      ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    }
                    Download
                  </button>

                  <button onClick={() => handleDelete(entry.id)} disabled={!!loadingId}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                      hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                    title="Remove">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
