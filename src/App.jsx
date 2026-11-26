import { Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './components/RequireAuth.jsx'
import AppLayout from './components/AppLayout.jsx'
import Login from './pages/Login.jsx'
import Animals from './pages/Animals.jsx'
import AnimalForm from './pages/AnimalForm.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/animals" element={<Animals />} />
          <Route path="/animals/new" element={<AnimalForm />} />
          <Route path="/animals/:id/edit" element={<AnimalForm />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/animals" replace />} />
    </Routes>
  )
}
