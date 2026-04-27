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
      // Race the Supabase fetch against a 10-second timeout so the app never
      // hangs forever on slow/mobile networks. setReady(true) is in finally
      // so it always fires regardless of success or failure.
      try {
        const fetchUsers = supabase.from('users').select('*')
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth init timed out')), 10000)
        )
        const { data, error } = await Promise.race([fetchUsers, timeoutPromise])

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
        // Network failure or timeout — let the app open anyway.
        // If the user has a session in localStorage they stay logged in;
        // if not, they'll see the login page and can try again.
        console.error('Auth init error:', err.message)
      } finally {
        setReady(true)
      }
    }
    init()
  }, [])

  // ── Auth actions ───────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setAuthError('')
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
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
