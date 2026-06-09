import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/schemes',  label: 'Properties' },
  { to: '/users',    label: 'Users' },
  { to: '/motions',  label: 'Motions' },
]

const navStyle = { display: 'block', padding: '0.6rem 1rem', color: '#ccc', textDecoration: 'none', borderRadius: '4px', fontSize: '0.9rem' }
const activeStyle = { ...navStyle, background: '#2d3748', color: '#fff' }

export default function Layout() {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '200px', background: '#1a202c', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Resolve</h2>
          <p style={{ color: '#718096', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>Admin</p>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => isActive ? activeStyle : navStyle}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          style={{ background: 'none', border: '1px solid #4a5568', color: '#a0aec0', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, padding: '2rem', background: '#f7fafc', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
