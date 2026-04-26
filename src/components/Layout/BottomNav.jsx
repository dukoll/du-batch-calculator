import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  {
    to: '/', perm: 'calculator', label: 'Calculator',
    icon: (a) => <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01
           M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>,
  },
  {
    to: '/raw-materials', perm: 'rawMaterials', label: 'Materials',
    icon: (a) => <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158
           a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0
           00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828
           c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>,
  },
  {
    to: '/products', perm: 'formulations', label: 'Goods',
    icon: (a) => <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
           M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
           m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>,
  },
]

export default function BottomNav() {
  const { can } = useAuth()
  const permitted = NAV.filter(n => can(n.perm))

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200
                    flex items-stretch pb-safe md:hidden">
      {permitted.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) => `
            tap-none flex-1 flex flex-col items-center justify-center gap-0.5
            pt-2 pb-1 text-xs font-medium transition-colors
            ${isActive ? 'text-red-600' : 'text-gray-400'}
          `}>
          {({ isActive }) => (<>{icon(isActive)}<span className={isActive ? 'font-semibold' : ''}>{label}</span></>)}
        </NavLink>
      ))}

      {/* History — NavLink to /history page */}
      <NavLink to="/history"
        className={({ isActive }) => `
          tap-none flex-1 flex flex-col items-center justify-center gap-0.5
          pt-2 pb-1 text-xs font-medium transition-colors
          ${isActive ? 'text-red-600' : 'text-gray-400'}
        `}>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" fill={isActive ? 'currentColor' : 'none'} viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={isActive ? 0 : 1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={isActive ? 'font-semibold' : ''}>History</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
