import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const links = [
  { to: '/animals', label: 'Animals' },
  { to: '/adoptions', label: 'Adoptions' },
]

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const items = links.filter((l) => !l.adminOnly || isAdmin)

  return (
    <>
      <header className="site-header">
        <div className="wrap bar">
          <Link className="brand" to="/animals" onClick={close}>
            <span className="brand-name">Aashray for Animals</span>
            <span className="brand-tag">Admin</span>
          </Link>

          <nav className="nav-desktop" aria-label="Main">
            <ul>
              {items.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to}>{l.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="who">
            <span className="muted">{user.name}</span>
            <button type="button" className="btn btn--link" onClick={logout}>Sign out</button>
          </div>

          <button
            type="button"
            className="menu-btn"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="menu-panel"
            onClick={() => setOpen(!open)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
          </button>
        </div>

        {open && (
          <nav id="menu-panel" className="menu-panel" aria-label="Menu">
            <ul>
              {items.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} onClick={close}>{l.label}</NavLink>
                </li>
              ))}
            </ul>
            <div className="menu-user">
              <span className="muted">{user.name}</span>
              <button type="button" className="btn btn--link" onClick={logout}>Sign out</button>
            </div>
          </nav>
        )}
      </header>

      <main className="wrap page">
        <Outlet />
      </main>
    </>
  )
}
