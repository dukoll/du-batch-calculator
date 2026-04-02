import React from 'react'
import { totalCost } from '../../utils/calculations'
import { formatNum } from '../../utils/format'

export default function ResultsTable({ results, desiredQty, desiredUnit }) {
  if (!results || results.length === 0) return null

  const total      = totalCost(results)
  const isPcsBased = desiredUnit === 'pcs'
  const costPerPc  = desiredQty > 0 ? total / desiredQty : null
  const perUnitLabel = isPcsBased ? 'Cost per Piece' : `Cost per ${desiredUnit}`

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* ── Desktop table ── */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Raw Material</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Required Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost / Unit</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Line Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {r.rawMaterial?.name ?? <span className="text-red-400 italic">Unknown</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatNum(r.requiredQty)}</td>
                <td className="px-4 py-3 text-gray-500">{r.unit}</td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {r.rawMaterial?.costPerUnit != null ? formatNum(r.rawMaterial.costPerUnit, 2) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatNum(r.cost, 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {costPerPc !== null && (
              <tr className="bg-green-50 border-t border-green-100">
                <td colSpan={3} className="px-4 py-2.5" />
                <td className="px-4 py-2.5 text-right text-sm font-medium text-green-700">{perUnitLabel}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-green-700">{formatNum(costPerPc)}</td>
              </tr>
            )}
            <tr className="bg-red-50 border-t-2 border-red-200">
              <td colSpan={3} className="px-4 py-3" />
              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Cost</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-red-700 text-base">{formatNum(total, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-gray-100">
        {results.map((r, i) => (
          <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {r.rawMaterial?.name ?? <span className="text-red-400 italic">Unknown</span>}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="font-mono text-gray-700">{formatNum(r.requiredQty)}</span>
                {' '}{r.unit}
                {r.rawMaterial?.costPerUnit != null && (
                  <span className="ml-2 text-gray-400">@ {formatNum(r.rawMaterial.costPerUnit, 2)}/{r.rawMaterial.unit}</span>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-semibold text-gray-800 text-sm">{formatNum(r.cost, 2)}</p>
              <p className="text-xs text-gray-400">line cost</p>
            </div>
          </div>
        ))}

        {/* Mobile summary footer */}
        <div className="bg-gray-50 px-4 py-3 space-y-2">
          {costPerPc !== null && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">{perUnitLabel}</span>
              <span className="font-mono font-semibold text-green-700">{formatNum(costPerPc)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-800">Total Cost</span>
            <span className="font-mono font-bold text-red-700 text-lg">{formatNum(total, 2)}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
