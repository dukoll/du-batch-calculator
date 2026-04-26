import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Header({ onHistoryClick }) {
  const { session } = useAuth()

  return (
    <header className="shrink-0 h-[72px] bg-red-700 flex items-center justify-between px-5 md:px-7 z-50">
      {/* Logo + App Name */}
      <div className="flex items-center gap-4">
        <img
          src="/dukoll-logo.png"
          alt="DUKOLL"
          className="h-[60px] w-auto object-contain brightness-0 invert"
        />
        <span className="w-px h-10 bg-red-400 shrink-0" />
        <span className="text-white text-lg font-bold tracking-wide">
          DU Batch Calculator
        </span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">

        {/* History button */}
        <button
          onClick={onHistoryClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10
            hover:bg-white/20 text-white transition-colors"
          title="Batch History"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">History</span>
        </button>

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

      </div>
    </header>
  )
}
