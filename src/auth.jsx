import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as apiLogin, getMe, getToken, setToken, setUnauthorizedHandler } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  useEffect(() => {
    if (!getToken()) return
    getMe()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout])

  async function login(email, password) {
    const res = await apiLogin(email, password)
    setToken(res.token)
    setUser(res.user)
    return res.user
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
