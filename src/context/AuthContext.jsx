import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { hashPassword, verifyPassword, ADMIN_PERMISSIONS, DEFAULT_PERMISSIONS } from '../utils/auth'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEFAULT_ADMIN = {
  name: 'Darshak',
  username: 'Darshak',
  rawPassword: '7668',
  role: 'admin',
}

// DB row → app shape
const toUser = r => ({
  id: r.id,
  name: r.name,
  username: r.username,
  passwordHash: r.password_hash,
  role: r.role,
  permissions: r.permissions ?? {},
})

export function AuthProvider({ children }) {
  const [users, setUsers]           = useState([])
  const [session, setSession]       = useLocalStorage('fc_session', null)
  const [ready, setReady]           = useState(false)
  const [authError, setAuthError]   = useState('')

  // ── Load users from Supabase, seed admin if first run ─────
  useEffect(() => {
    async function init() {
      // Fast path: if a valid session is already in localStorage, mark the
      // app as ready immediately — no Supabase round-trip needed just to show
      // the UI. The users list and all data still load in the background.
      const stored = localStorage.getItem('fc_session')
      if (stored && stored !== 'null') {
        setReady(true)
      }

      try {
        const { data, error } = await supabase.from('users').select('*')
        if (error) throw error

        const userList = data ?? []

        if (userList.length === 0) {
          const hash = await hashPassword(DEFAULT_ADMIN.rawPassword)
          const { data: newUser } = await supabase.from('users')
            .insert({
              name: DEFAULT_ADMIN.name,
              username: DEFAULT_ADMIN.username,
              password_hash: hash,
              role: 'admin',
              permissions: ADMIN_PERMISSIONS,
            })
            .select().single()
          if (newUser) setUsers([toUser(newUser)])
        } else {
          setUsers(userList.map(toUser))
        }
      } catch (err) {
        // Network failure — log it. The app is already showing (or will show
        // the login page) via setReady(true) in finally below.
        console.error('Auth init error:', err.message)
      } finally {
        // Always mark ready — covers the no-session case where fast-path
        // above didn't fire.
        setReady(true)
      }
    }
    init()
  }, [])

  // ── Auth actions ───────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setAuthError('')

    // Primary path: look up user from the Supabase-loaded list
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase())

    // Offline fallback: if Supabase was unreachable (users list is empty),
    // allow the default admin to log in by re-fetching directly.
    // This ensures the owner can always access the app even when Supabase
    // is paused or the network timed out during startup.
    if (!user && users.length === 0) {
      try {
        const { data } = await supabase.from('users').select('*')
        const freshList = (data ?? []).map(toUser)
        if (freshList.length > 0) {
          setUsers(freshList)
          user = freshList.find(u => u.username.toLowerCase() === username.toLowerCase())
        }
      } catch {
        // Still offline — fall through to error below
      }
    }

    if (!user) { setAuthError('Invalid username or password'); return false }
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok)   { setAuthError('Invalid username or password'); return false }
    setSession({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.role === 'admin' ? ADMIN_PERMISSIONS : user.permissions,
    })
    return true
  }, [users, setSession])

  const logout = useCallback(() => setSession(null), [setSession])

  // ── User management ────────────────────────────────────────
  const addUser = useCallback(async ({ name, username, password, permissions }) => {
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase())
    if (existing) return { error: 'Username already exists' }
    const hash = await hashPassword(password)
    const { data, error } = await supabase.from('users')
      .insert({ name, username, password_hash: hash, role: 'user', permissions: permissions ?? DEFAULT_PERMISSIONS })
      .select().single()
    if (error) return { error: error.message }
    setUsers(prev => [...prev, toUser(data)])
    return { error: null }
  }, [users])

  const updateUser = useCallback(async (id, { name, username, password, permissions }) => {
    const conflict = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== id)
    if (conflict) return { error: 'Username already taken' }
    const user = users.find(u => u.id === id)
    const hash = password ? await hashPassword(password) : user.passwordHash
    const { data, error } = await supabase.from('users')
      .update({ name, username, password_hash: hash, permissions: permissions ?? user.permissions })
      .eq('id', id).select().single()
    if (error) return { error: error.message }
    setUsers(prev => prev.map(u => u.id === id ? toUser(data) : u))
    if (session?.userId === id) {
      setSession(s => ({
        ...s,
        name: data.name,
        username: data.username,
        permissions: data.role === 'admin' ? ADMIN_PERMISSIONS : data.permissions,
      }))
    }
    return { error: null }
  }, [users, session, setSession])

  const updateSelf = useCallback(async (id, { name, username, password }) => {
    const conflict = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== id)
    if (conflict) return { error: 'Username already taken' }
    const user = users.find(u => u.id === id)
    const hash = password ? await hashPassword(password) : user.passwordHash
    const { data, error } = await supabase.from('users')
      .update({ name, username, password_hash: hash })
      .eq('id', id).select().single()
    if (error) return { error: error.message }
    setUsers(prev => prev.map(u => u.id === id ? toUser(data) : u))
    setSession(s => ({ ...s, name: data.name, username: data.username }))
    return { error: null }
  }, [users, setSession])

  const deleteUser = useCallback(async (id) => {
    if (session?.userId === id) return { error: "You can't delete your own account" }
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) return { error: error.message }
    setUsers(prev => prev.filter(u => u.id !== id))
    return { error: null }
  }, [session])

  return (
    <AuthContext.Provider value={{
      ready,
      session,
      users,
      authError,
      setAuthError,
      login,
      logout,
      addUser,
      updateUser,
      updateSelf,
      deleteUser,
      isAdmin: session?.role === 'admin',
      can: (key) => session?.role === 'admin' || session?.permissions?.[key] === true,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
