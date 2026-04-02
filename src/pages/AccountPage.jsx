import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'

export default function AccountPage() {
  const { session, isAdmin, logout, users, updateSelf, addUser, updateUser, deleteUser } = useAuth()
  const [tab, setTab] = useState('account')

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0
                 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622
                 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Account Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        <TabBtn active={tab === 'account'} onClick={() => setTab('account')}>My Account</TabBtn>
        {isAdmin && (
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>Manage Users</TabBtn>
        )}
      </div>

      {tab === 'account' ? (
        <MyAccountTab session={session} updateSelf={updateSelf} logout={logout} />
      ) : (
        <ManageUsersTab users={users} currentUserId={session?.userId}
          addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} />
      )}
    </div>
  )
}

/* ── My Account Tab ──────────────────────────────────────── */
function MyAccountTab({ session, updateSelf, logout }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ name: session?.name ?? '', username: session?.username ?? '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    if (!editing) setForm({ name: session?.name ?? '', username: session?.username ?? '', password: '' })
  }, [editing, session])

  async function handleSave() {
    if (!form.name.trim() || !form.username.trim()) { setError('Name and username are required'); return }
    setSaving(true)
    const result = await updateSelf(session.userId, {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password || null,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setEditing(false)
    setError('')
  }

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setError('') }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Profile Information</h2>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="tap-none flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                         text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            {editing
              ? <input value={form.name} onChange={set('name')} className={inputCls} />
              : <p className={valueCls}>{session?.name}</p>}
          </Field>
          <Field label="Username">
            {editing
              ? <input value={form.username} onChange={set('username')} className={inputCls} />
              : <p className={valueCls}>{session?.username}</p>}
          </Field>
        </div>

        {editing && (
          <div className="mt-4">
            <Field label="New Password">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Leave blank to keep current"
                  className={inputCls + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <EyeToggle show={showPw} />
                </button>
              </div>
            </Field>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        {editing && (
          <div className="flex gap-2 mt-5">
            <button onClick={handleSave} disabled={saving}
              className="tap-none flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold
                         rounded-xl active:bg-red-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => { setEditing(false); setError('') }}
              className="tap-none px-4 py-2.5 border border-gray-300 text-sm font-medium
                         text-gray-700 rounded-xl active:bg-gray-50">
              Cancel
            </button>
          </div>
        )}

        {!editing && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <span className="text-sm text-gray-500">Role:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
              ${session?.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
              {session?.role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
        )}
      </div>

      {/* Sign out */}
      <button onClick={logout}
        className="tap-none w-full py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700
                   text-white font-semibold text-sm rounded-2xl transition-colors">
        Sign Out
      </button>
    </div>
  )
}

/* ── Manage Users Tab ────────────────────────────────────── */
function ManageUsersTab({ users, currentUserId, addUser, updateUser, deleteUser }) {
  const [addOpen, setAddOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const nonAdminUsers = users.filter(u => u.role !== 'admin')

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{nonAdminUsers.length} user{nonAdminUsers.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setAddOpen(true)}
          className="tap-none flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                     text-white bg-red-600 rounded-xl active:bg-red-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Admin card (read-only) */}
      {users.filter(u => u.role === 'admin').map(u => (
        <UserCard key={u.id} user={u} isSelf={u.id === currentUserId} isAdmin readOnly />
      ))}

      {/* Regular users */}
      {nonAdminUsers.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No users yet. Add one to get started.
        </div>
      ) : nonAdminUsers.map(u => (
        <UserCard key={u.id} user={u} isSelf={u.id === currentUserId}
          onEdit={() => setEditTarget(u)}
          onDelete={() => setDeleteTarget(u)} />
      ))}

      {/* Add user modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User" size="sm">
        <UserForm
          onSave={async (data) => {
            const r = await addUser(data)
            if (r.error) return r.error
            setAddOpen(false)
            return null
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* Edit user modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit User" size="sm">
        {editTarget && (
          <UserForm
            initial={editTarget}
            onSave={async (data) => {
              const r = await updateUser(editTarget.id, data)
              if (r.error) return r.error
              setEditTarget(null)
              return null
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove User" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Remove <span className="font-semibold">{deleteTarget?.name}</span> (@{deleteTarget?.username})?
          They will no longer be able to log in.
        </p>
        <div className="flex gap-2">
          <button onClick={() => { deleteUser(deleteTarget.id); setDeleteTarget(null) }}
            className="flex-1 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl active:bg-red-600">
            Remove
          </button>
          <button onClick={() => setDeleteTarget(null)}
            className="px-4 py-2.5 border border-gray-300 text-sm text-gray-700 rounded-xl active:bg-gray-50">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}

/* ── User card ── */
function UserCard({ user, isSelf, isAdmin, readOnly, onEdit, onDelete }) {
  const perms = user.permissions ?? {}
  const permLabels = [
    perms.calculator    && 'Calculator',
    perms.rawMaterials  && 'Raw Materials',
    perms.formulations  && 'Formulations',
  ].filter(Boolean)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
            {isSelf && <span className="text-xs text-gray-400">(you)</span>}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
              ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
              {user.role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
          {user.role !== 'admin' && (
            <div className="flex flex-wrap gap-1 mt-2">
              {permLabels.length === 0
                ? <span className="text-xs text-gray-400 italic">No permissions</span>
                : permLabels.map(l => (
                    <span key={l} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                      {l}
                    </span>
                  ))
              }
            </div>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onEdit}
              className="tap-none w-8 h-8 flex items-center justify-center rounded-lg
                         text-red-600 bg-red-50 active:bg-red-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                     m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={onDelete}
              className="tap-none w-8 h-8 flex items-center justify-center rounded-lg
                         text-red-500 bg-red-50 active:bg-red-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                     L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── User add/edit form ── */
const PERM_OPTIONS = [
  { key: 'calculator',   label: 'Calculator' },
  { key: 'rawMaterials', label: 'Raw Materials' },
  { key: 'formulations', label: 'Formulations' },
]

function UserForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    username: initial?.username ?? '',
    password: '',
    permissions: initial?.permissions ?? { calculator: false, rawMaterials: false, formulations: false },
  })
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  function togglePerm(key) {
    setForm(p => ({ ...p, permissions: { ...p.permissions, [key]: !p.permissions[key] } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.username.trim()) { setError('Username is required'); return }
    if (!initial && !form.password) { setError('Password is required for new users'); return }
    setSaving(true)
    const err = await onSave({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password || null,
      permissions: form.permissions,
    })
    setSaving(false)
    if (err) setError(err)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input value={form.name} onChange={set('name')} placeholder="e.g. John Smith"
          className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input value={form.username} onChange={set('username')} placeholder="e.g. john"
          className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {initial ? 'New Password' : 'Password'}
        </label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
            placeholder={initial ? 'Leave blank to keep current' : 'Set password'}
            className={inputCls + ' pr-10'} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <EyeToggle show={showPw} />
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Module Permissions</label>
        <div className="space-y-2">
          {PERM_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => togglePerm(key)}
                className={`tap-none w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                  ${form.permissions[key]
                    ? 'bg-red-600 border-red-600'
                    : 'border-gray-300 bg-white group-hover:border-red-400'}`}
              >
                {form.permissions[key] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700" onClick={() => togglePerm(key)}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="tap-none flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold
                     rounded-xl disabled:opacity-50 active:bg-red-700">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add User'}
        </button>
        <button type="button" onClick={onCancel}
          className="tap-none px-4 py-2.5 border border-gray-300 text-sm text-gray-700
                     rounded-xl active:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ── Tiny helpers ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function EyeToggle({ show }) {
  return show
    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
             a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242
             M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0
             0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
             -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`tap-none flex-1 py-2 text-sm font-medium rounded-lg transition-colors
        ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  )
}

const inputCls = `w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl bg-white
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`
const valueCls = `text-sm text-gray-800 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl`
