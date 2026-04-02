import React, { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { parseRawMaterialsSheet, downloadRawMaterialTemplate } from '../../utils/importExcel'

export default function ImportRawMaterialsDialog({ open, onClose, onImport }) {
  const [rows, setRows]       = useState([])
  const [errors, setErrors]   = useState([])
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setLoading(true)
    try {
      const result = await parseRawMaterialsSheet(file)
      setRows(result.rows)
      setErrors(result.errors)
    } catch (err) {
      setErrors([err.message])
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  function handleImport() {
    onImport(rows)
    setRows([])
    setErrors([])
    setFileName('')
    onClose()
  }

  function handleClose() {
    setRows([])
    setErrors([])
    setFileName('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Raw Materials" size="lg">
      <div className="space-y-4">
        {/* Download template */}
        <div className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-3">
          <p className="text-sm text-red-800">
            Need the template? Download it to see the required format.
          </p>
          <Button variant="secondary" size="sm" onClick={downloadRawMaterialTemplate}>
            Download Template
          </Button>
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload .xlsx or .csv file
          </label>
          <input
            type="file"
            accept=".xlsx,.csv,.xls"
            onChange={handleFile}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4
                       file:rounded-lg file:border file:border-gray-300 file:text-sm
                       file:bg-white file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
          />
          {fileName && <p className="text-xs text-gray-500 mt-1">Selected: {fileName}</p>}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-red-700">Warnings / Errors:</p>
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
          </div>
        )}

        {/* Preview */}
        {loading && <p className="text-sm text-gray-500">Parsing file…</p>}
        {rows.length > 0 && !loading && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} found
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Cost / Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.unit}</td>
                      <td className="px-3 py-2">{r.costPerUnit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-1">Duplicates (by name) will be skipped.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleImport} disabled={rows.length === 0} className="flex-1">
            Import {rows.length > 0 ? `${rows.length} Material${rows.length !== 1 ? 's' : ''}` : ''}
          </Button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
