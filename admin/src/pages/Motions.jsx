import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Motions() {
  const [motions, setMotions] = useState([])
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', scheme_id: '', opens_at: '', closes_at: '' })
  const [outcomeForm, setOutcomeForm] = useState({ outcome: '', action_taken: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from('motions').select('*, schemes(name), users(full_name), motion_outcomes(*), votes(vote)').order('created_at', { ascending: false }),
      supabase.from('schemes').select('id, name').eq('is_active', true).order('name')
    ])
    setMotions(m || [])
    setSchemes(s || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('motions').insert({
      title: form.title,
      description: form.description,
      scheme_id: form.scheme_id,
      opens_at: form.opens_at || null,
      closes_at: form.closes_at || null,
      created_by: user.id,
      status: 'draft'
    })
    if (error) setError(error.message)
    else { setShowForm(false); setForm({ title: '', description: '', scheme_id: '', opens_at: '', closes_at: '' }); load() }
    setSaving(false)
  }

  async function setStatus(motion, status) {
    await supabase.from('motions').update({ status }).eq('id', motion.id)
    load()
  }

  async function handleOutcome(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('motion_outcomes').upsert({
      motion_id: selected.id,
      recorded_by: user.id,
      outcome: outcomeForm.outcome,
      action_taken: outcomeForm.action_taken
    })
    if (!error) { setSelected(null); setOutcomeForm({ outcome: '', action_taken: '' }); load() }
    setSaving(false)
  }

  const voteSummary = (votes) => {
    if (!votes?.length) return '—'
    const yes = votes.filter(v => v.vote).length
    const no = votes.filter(v => !v.vote).length
    return `${yes} yes / ${no} no`
  }

  const statusColor = (s) => ({ draft: '#e2e8f0', open: '#c6f6d5', closed: '#fed7d7' }[s] || '#e2e8f0')
  const statusText = (s) => ({ draft: '#4a5568', open: '#276749', closed: '#9b2c2c' }[s] || '#4a5568')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Motions</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnStyle}>+ New motion</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Scheme</label>
              <select value={form.scheme_id} onChange={e => setForm({ ...form, scheme_id: e.target.value })} required style={inputStyle}>
                <option value="">— Select scheme —</option>
                {schemes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Opens at</label>
              <input type="datetime-local" value={form.opens_at} onChange={e => setForm({ ...form, opens_at: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Closes at</label>
              <input type="datetime-local" value={form.closes_at} onChange={e => setForm({ ...form, closes_at: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
        </form>
      )}

      {selected && (
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #bee3f8' }}>
          <h3 style={{ margin: '0 0 1rem' }}>Record outcome — {selected.title}</h3>
          <form onSubmit={handleOutcome}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Outcome</label>
              <input value={outcomeForm.outcome} onChange={e => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })} required style={inputStyle} placeholder="e.g. Motion passed" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Action taken</label>
              <textarea value={outcomeForm.action_taken} onChange={e => setOutcomeForm({ ...outcomeForm, action_taken: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Describe what was actioned..." />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save outcome'}</button>
              <button type="button" onClick={() => setSelected(null)} style={btnSecondary}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Scheme</th>
              <th style={thStyle}>Created by</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Votes</th>
              <th style={thStyle}>Outcome</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {motions.map(m => (
              <tr key={m.id}>
                <td style={tdStyle}>{m.title}</td>
                <td style={tdStyle}>{m.schemes?.name || '—'}</td>
                <td style={tdStyle}>{m.users?.full_name || '—'}</td>
                <td style={tdStyle}>
                  <span style={{ background: statusColor(m.status), color: statusText(m.status), padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                    {m.status}
                  </span>
                </td>
                <td style={tdStyle}>{voteSummary(m.votes)}</td>
                <td style={tdStyle}>{m.motion_outcomes?.[0]?.outcome || '—'}</td>
                <td style={{ ...tdStyle, display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {m.status === 'draft' && <button onClick={() => setStatus(m, 'open')} style={btnSmall}>Open</button>}
                  {m.status === 'open' && <button onClick={() => setStatus(m, 'closed')} style={btnSmall}>Close</button>}
                  {m.status === 'closed' && <button onClick={() => { setSelected(m); setOutcomeForm({ outcome: m.motion_outcomes?.[0]?.outcome || '', action_taken: m.motion_outcomes?.[0]?.action_taken || '' }) }} style={btnSmall}>Outcome</button>}
                </td>
              </tr>
            ))}
            {motions.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, color: '#999' }}>No motions yet</td></tr>}
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
