import React, { useState, useEffect } from 'react'
import { getHistory, clearHistory, deleteHistoryEntry } from '../../utils/historyStore'
import { exportToPdf, previewPdfUrl } from '../../utils/exportPdf'

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }
}

/** Reconstruct the lightweight product + results shape needed by exportPdf */
function entryToExportArgs(entry) {
  const product = { name: entry.productName }
  const results = entry.results.map(r => ({
    rawMaterial: { name: r.rawMaterialName },
    rawMaterialName: r.rawMaterialName,
    requiredQty: r.requiredQty,
    unit: r.unit,
  }))
  return { product, quantity: entry.quantity, unit: entry.unit, results }
}

export default function HistoryDrawer({ isOpen, onClose }) {
  const [entries, setEntries]         = useState([])
  const [loadingId, setLoadingId]     = useState(null)  // which entry is loading
  const [confirmClear, setConfirmClear] = useState(false)

  // Refresh list every time drawer opens
  useEffect(() => {
    if (isOpen) setEntries(getHistory())
  }, [isOpen])

  function refresh() { setEntries(getHistory()) }

  async function handlePreview(entry) {
    setLoadingId(entry.id + '_preview')
    try {
      const { product, quantity, unit, results } = entryToExportArgs(entry)
      const url = await previewPdfUrl(product, quantity, unit, results)
      window.open(url, '_blank')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDownload(entry) {
    setLoadingId(entry.id + '_download')
    try {
      const { product, quantity, unit, results } = entryToExportArgs(entry)
      await exportToPdf(product, quantity, unit, results)
    } finally {
      setLoadingId(null)
    }
  }

  function handleDelete(id) {
    deleteHistoryEntry(id)
    refresh()
  }

  function handleClearAll() {
    clearHistory()
    setEntries([])
    setConfirmClear(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-red-600" style={{width:'18px',height:'18px'}}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Batch History</h2>
              <p className="text-xs text-gray-400 leading-tight">PDF-exported batches</p>
            </div>
            {entries.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {entries.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Entry list ── */}
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 pb-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold text-sm">No history yet</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Go to the Calculator, run a batch and tap <strong>PDF</strong> — it will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {entries.map(entry => {
                const { date, time } = formatDateTime(entry.timestamp)
                const isPreviewLoading  = loadingId === entry.id + '_preview'
                const isDownloadLoading = loadingId === entry.id + '_download'
                return (
                  <li key={entry.id} className="px-5 py-4">
                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-400">{date} &middot; {time}</span>
                    </div>

                    {/* Product name */}
                    <p className="font-bold text-gray-900 text-sm leading-snug">{entry.productName}</p>

                    {/* Quantity badge */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50
                        text-red-700 text-xs font-semibold">
                        {entry.quantity} {entry.unit}
                      </span>
                      <span className="text-xs text-gray-400">
                        {entry.results.length} ingredient{entry.results.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      {/* Preview */}
                      <button
                        onClick={() => handlePreview(entry)}
                        disabled={!!loadingId}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                          text-gray-700 bg-white border border-gray-300 rounded-lg
                          hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {isPreviewLoading ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943
                                 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                        Preview
                      </button>

                      {/* Download */}
                      <button
                        onClick={() => handleDownload(entry)}
                        disabled={!!loadingId}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                          text-white bg-red-600 rounded-lg hover:bg-red-700
                          disabled:opacity-50 transition-colors"
                      >
                        {isDownloadLoading ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        Download
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={!!loadingId}
                        className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg
                          text-gray-400 hover:text-red-500 hover:bg-red-50
                          disabled:opacity-50 transition-colors"
                        title="Remove entry"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0
                               01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0
                               00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── Footer — Clear All ── */}
        {entries.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 flex-1">Clear all {entries.length} entries?</span>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Clear All
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full py-2 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
              >
                Clear All History
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
