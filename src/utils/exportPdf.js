import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatNum } from './format'

async function loadImageAsDataUrl(src, maxW = 300) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(1, maxW / img.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.naturalWidth  * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve({ dataUrl: canvas.toDataURL('image/png'), ratio: img.naturalWidth / img.naturalHeight })
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Shared PDF builder — returns the jsPDF doc object (does NOT save or open).
 * Used by both exportToPdf (download) and previewPdfUrl (open in tab).
 */
async function buildPdfDoc(product, desiredQty, desiredUnit, results) {
  const doc     = new jsPDF({ compress: true })
  const pageW   = doc.internal.pageSize.getWidth()
  const marginL = 14
  const marginR = 14
  const usableW = pageW - marginL - marginR
  const date    = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  // ── 1. Top red header band ───────────────────────────────
  doc.setFillColor(220, 38, 38)
  doc.rect(0, 0, pageW, 18, 'F')

  const logoResult = await loadImageAsDataUrl('/dukoll-logo.png')
  if (logoResult) {
    const logoW = 36
    const logoH = Math.round((logoW / logoResult.ratio) * 10) / 10
    const logoX = pageW - marginR - logoW
    const logoY = (18 - logoH) / 2
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(logoX - 2, logoY - 1.5, logoW + 4, logoH + 3, 2, 2, 'F')
    doc.addImage(logoResult.dataUrl, 'PNG', logoX, logoY, logoW, logoH)
  }

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('PRODUCTION NOTE', marginL, 12)

  // ── 2. Product name ──────────────────────────────────────
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(product.name, marginL, 34)

  doc.setDrawColor(220, 38, 38)
  doc.setLineWidth(0.8)
  doc.line(marginL, 38, marginL + usableW, 38)

  // ── 3. Info bar ──────────────────────────────────────────
  doc.setFillColor(243, 244, 246)
  doc.roundedRect(marginL, 42, usableW, 14, 3, 3, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('BATCH QUANTITY', marginL + 5, 48)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38)
  doc.text(`${formatNum(desiredQty)} ${desiredUnit}`, marginL + 5, 54.5)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('DATE', pageW - marginR - 5, 48, { align: 'right' })

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(date, pageW - marginR - 5, 54.5, { align: 'right' })

  // ── 4. Ingredients table ─────────────────────────────────
  const rows = results.map(r => [
    r.rawMaterial?.name ?? r.rawMaterialName ?? '—',
    formatNum(r.requiredQty),
    r.unit,
  ])

  autoTable(doc, {
    startY: 62,
    margin: { left: marginL, right: marginR },
    tableWidth: usableW,
    head: [['Raw Material', 'Required Qty', 'Unit']],
    body: rows,
    styles: {
      fontSize: 10,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
      overflow: 'linebreak',
      valign: 'middle',
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left' },
      1: { cellWidth: 52,  halign: 'left' },
      2: { cellWidth: 30,  halign: 'left' },
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawPage: (data) => {
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(156, 163, 175)
      doc.text(
        `${results.length} ingredient${results.length !== 1 ? 's' : ''}`,
        marginL, pageH - 8,
      )
      doc.text(`Page ${data.pageNumber}`, pageW - marginR, pageH - 8, { align: 'right' })
    },
  })

  return doc
}

/** Download the PDF directly to disk. */
export async function exportToPdf(product, desiredQty, desiredUnit, results) {
  const doc = await buildPdfDoc(product, desiredQty, desiredUnit, results)
  doc.save(`${product.name.replace(/\s+/g, '_')}_${formatNum(desiredQty)}${desiredUnit}.pdf`)
}

/**
 * Returns a blob URL for in-browser preview (open in new tab).
 * The caller should open the returned URL with window.open(url, '_blank').
 */
export async function previewPdfUrl(product, desiredQty, desiredUnit, results) {
  const doc = await buildPdfDoc(product, desiredQty, desiredUnit, results)
  return doc.output('bloburl')
}
