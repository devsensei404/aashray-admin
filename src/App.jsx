import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth.jsx'
import AppLayout from './components/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Animals from './pages/Animals.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/animals" element={<Animals />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/animals" replace />} />
    </Routes>
  )
}
