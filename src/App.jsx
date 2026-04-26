import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import BottomNav from './components/Layout/BottomNav'
import HistoryDrawer from './components/History/HistoryDrawer'
import LoginPage from './pages/LoginPage'
import CalculatorPage from './pages/CalculatorPage'
import RawMaterialsPage from './pages/RawMaterialsPage'
import ProductsPage from './pages/ProductsPage'
import AccountPage from './pages/AccountPage'

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
  const [historyOpen, setHistoryOpen] = useState(false)

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
      <Header onHistoryClick={() => setHistoryOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Routes>
            <Route path="/"              element={<PermGuard perm="calculator"><CalculatorPage /></PermGuard>} />
            <Route path="/raw-materials" element={<PermGuard perm="rawMaterials"><RawMaterialsPage /></PermGuard>} />
            <Route path="/products"      element={<PermGuard perm="formulations"><ProductsPage /></PermGuard>} />
            <Route path="/account"       element={<AccountPage />} />
            <Route path="*"              element={<DefaultRedirect />} />
          </Routes>
        </main>
      </div>
      <BottomNav onHistoryClick={() => setHistoryOpen(true)} />
      <HistoryDrawer isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
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
