import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Users() {
  const [users, setUsers] = useState([])
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'committee', property_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    const [{ data: u }, { data: s }] = await Promise.all([
      supabase.from('users').select('*, properties(name)').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').eq('is_active', true).order('name')
    ])
    setUsers(u || [])
    setSchemes(s || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true
    })
    if (authError) { setError(authError.message); setSaving(false); return }
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      property_id: form.property_id || null
    })
    if (profileError) setError(profileError.message)
    else { setShowForm(false); setForm({ full_name: '', email: '', password: '', role: 'committee', property_id: '' }); load() }
    setSaving(false)
  }

  async function toggleActive(user) {
    await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Users</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>+ New user</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                <option value="committee">Committee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Scheme</label>
              <select value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })} style={inputStyle}>
                <option value="">— Select scheme —</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Create user'}</button>
            <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Scheme</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.full_name}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={tdStyle}><span style={roleBadge(u.role)}>{u.role}</span></td>
                <td style={tdStyle}>{u.schemes?.name || '—'}</td>
                <td style={tdStyle}>
                  <span style={{ background: u.is_active ? '#c6f6d5' : '#fed7d7', color: u.is_active ? '#276749' : '#9b2c2c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => toggleActive(u)} style={btnSmall}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, color: '#999' }}>No users yet</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}

const roleBadge = (role) => ({
  background: role === 'admin' ? '#ebf4ff' : '#faf5ff',
  color: role === 'admin' ? '#2b6cb0' : '#6b46c1',
  padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem'
})

const btnStyle = { background: '#1a56db', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }
const btnSecondary = { background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }
const btnSmall = { background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.875rem' }
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#555' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
const thStyle = { textAlign: 'left', padding: '0.75rem 1rem', background: '#f7fafc', fontSize: '0.8rem', color: '#666', borderBottom: '1px solid #e2e8f0' }
const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.875rem' }
