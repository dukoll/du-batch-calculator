import React from 'react'

const colors = [
  'bg-red-100 text-red-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
]

function hashColor(str) {
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) | 0
  return colors[Math.abs(h) % colors.length]
}

export default function Badge({ label }) {
  if (!label) return null
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${hashColor(label)}`}>
      {label}
    </span>
  )
}
