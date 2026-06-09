import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Schemes from './pages/Schemes'
import Users from './pages/Users'
import Motions from './pages/Motions'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/schemes" replace />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/users" element={<Users />} />
              <Route path="/motions" element={<Motions />} />
            </Route>
            <Route path="*" element={<Navigate to="/schemes" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
