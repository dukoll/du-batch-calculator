import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider, useData } from './context/DataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import BottomNav from './components/Layout/BottomNav'
import LoginPage from './pages/LoginPage'
import CalculatorPage from './pages/CalculatorPage'
import RawMaterialsPage from './pages/RawMaterialsPage'
import ProductsPage from './pages/ProductsPage'
import AccountPage from './pages/AccountPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}

function AppShell() {
  const { ready, session } = useAuth()
  const { dataError } = useData()

  // Wait for auth to initialise (seeds default admin)
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in → show login screen
  if (!session) return <LoginPage />

  // Logged in → full app
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header />
      {dataError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Database unreachable — data may be empty. Refresh to retry.
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Routes>
            <Route path="/"              element={<PermGuard perm="calculator"><CalculatorPage /></PermGuard>} />
            <Route path="/raw-materials" element={<PermGuard perm="rawMaterials"><RawMaterialsPage /></PermGuard>} />
            <Route path="/products"      element={<PermGuard perm="formulations"><ProductsPage /></PermGuard>} />
            <Route path="/history"       element={<HistoryPage />} />
            <Route path="/account"       element={<AccountPage />} />
            <Route path="*"              element={<DefaultRedirect />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

/** Redirect to first page the user has access to */
function DefaultRedirect() {
  const { can } = useAuth()
  if (can('calculator'))   return <Navigate to="/" replace />
  if (can('rawMaterials')) return <Navigate to="/raw-materials" replace />
  if (can('formulations')) return <Navigate to="/products" replace />
  return <Navigate to="/account" replace />
}

/** Guard a route by permission key — redirects if no access */
function PermGuard({ perm, children }) {
  const { can } = useAuth()
  if (can(perm)) return children
  return <DefaultRedirect />
}
