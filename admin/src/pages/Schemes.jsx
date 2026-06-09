import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Schemes() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('schemes').select('*').order('created_at', { ascending: false })
    setSchemes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('schemes').insert({ name: form.name, address: form.address })
    if (error) setError(error.message)
    else { setShowForm(false); setForm({ name: '', address: '' }); load() }
    setSaving(false)
  }

  async function toggleActive(scheme) {
    await supabase.from('schemes').update({ is_active: !scheme.is_active }).eq('id', scheme.id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Schemes</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>+ New scheme</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schemes.map(s => (
              <tr key={s.id}>
                <td style={tdStyle}>{s.name}</td>
                <td style={tdStyle}>{s.address || '—'}</td>
                <td style={tdStyle}>
                  <span style={{ background: s.is_active ? '#c6f6d5' : '#fed7d7', color: s.is_active ? '#276749' : '#9b2c2c', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => toggleActive(s)} style={btnSmall}>
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {schemes.length === 0 && <tr><td colSpan={4} style={{ ...tdStyle, color: '#999' }}>No schemes yet</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}

const btnStyle = { background: '#1a56db', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }
const btnSecondary = { background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }
const btnSmall = { background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.875rem' }
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#555' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
const thStyle = { textAlign: 'left', padding: '0.75rem 1rem', background: '#f7fafc', fontSize: '0.8rem', color: '#666', borderBottom: '1px solid #e2e8f0' }
const tdStyle = { padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.875rem' }
