import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { session } = useAuth()

  return (
    <header className="shrink-0 h-24 bg-red-700 flex items-center justify-between px-5 md:px-7 z-50">
      {/* Logo + App Name */}
      <div className="flex items-center gap-4">
        <img
          src="/dukoll-logo.png"
          alt="DUKOLL"
          className="h-20 w-auto object-contain brightness-0 invert"
        />
        <span className="w-px h-14 bg-red-400 shrink-0" />
        <span className="text-white text-lg font-bold tracking-wide">
          DU Batch Calculator
        </span>
      </div>

      {/* User */}
      <NavLink
        to="/account"
        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-base font-medium">{session?.name ?? 'Account'}</span>
      </NavLink>
    </header>
  )
}
