import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { listAnimals, setAnimalStatus, deleteAnimal } from '../api.js'

const CATEGORY = { ADOPTABLE: 'Adoptable', RESIDENT: 'Resident', RESCUE: 'Rescue' }
const STATUS = { AVAILABLE: 'Available', ADOPTED: 'Adopted' }

export default function Animals() {
  const { isAdmin } = useAuth()
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: '', data: null, error: '' })
  const [busyId, setBusyId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [actionError, setActionError] = useState('')

  const key = `${category}|${status}|${query}|${page}|${reload}`
  const loading = result.key !== key

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let ignore = false
    listAnimals({ category, status, search: query, page })
      .then((data) => {
        if (!ignore) setResult({ key, data, error: '' })
      })
      .catch(() => {
        if (!ignore) setResult({ key, data: null, error: 'Could not load animals.' })
      })
    return () => {
      ignore = true
    }
  }, [key, category, status, query, page])

  function changeCategory(v) {
    setCategory(v)
    setPage(0)
  }

  function changeStatus(v) {
    setStatus(v)
    setPage(0)
  }

  async function toggleStatus(a) {
    setActionError('')
    setBusyId(a.id)
    try {
      await setAnimalStatus(a.id, a.status === 'AVAILABLE' ? 'ADOPTED' : 'AVAILABLE')
      setReload((n) => n + 1)
    } catch {
      setActionError(`Could not update ${a.name}.`)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(a) {
    setActionError('')
    setBusyId(a.id)
    try {
      await deleteAnimal(a.id)
      setConfirmId(null)
      if (page > 0 && result.data.content.length === 1) setPage(page - 1)
      else setReload((n) => n + 1)
    } catch (err) {
      setActionError(err.status === 403 ? 'Only an admin can delete.' : `Could not delete ${a.name}.`)
    } finally {
      setBusyId(null)
    }
  }

  const data = result.data
  const items = data?.content ?? []

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Animals</h1>
          {data && <p className="muted">{data.totalElements} in total</p>}
        </div>
        <Link className="btn btn--primary btn--small" to="/animals/new">Add animal</Link>
      </div>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="search">Search by name</label>
          <input id="search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => changeCategory(e.target.value)}>
            <option value="">All</option>
            {Object.entries(CATEGORY).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => changeStatus(e.target.value)}>
            <option value="">All</option>
            {Object.entries(STATUS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </form>

      {actionError && <p className="alert" role="alert">{actionError}</p>}

      {loading && !data && <p className="state" role="status">Loading</p>}

      {!loading && result.error && (
        <div className="state">
          <p className="alert" role="alert">{result.error}</p>
          <button type="button" className="btn btn--outline btn--small" onClick={() => setReload((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {!loading && !result.error && items.length === 0 && <p className="state">No animals match these filters.</p>}

      {items.length > 0 && (
        <ul className="rows" aria-busy={loading}>
          {items.map((a) => (
            <li className="row" key={a.id}>
              <div>
                <h3>{a.name}</h3>
                <p className="muted row-meta">
                  {CATEGORY[a.category]} · {STATUS[a.status]} · {a.ageText}
                </p>
              </div>
              <div className="row-actions">
                {confirmId === a.id ? (
                  <>
                    <span className="row-meta">Delete {a.name}?</span>
                    <button type="button" className="btn btn--primary btn--small" disabled={busyId === a.id} onClick={() => remove(a)}>
                      Yes, delete
                    </button>
                    <button type="button" className="btn btn--outline btn--small" disabled={busyId === a.id} onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="btn btn--outline btn--small" to={`/animals/${a.id}/edit`}>Edit</Link>
                    <button type="button" className="btn btn--outline btn--small" disabled={busyId === a.id} onClick={() => toggleStatus(a)}>
                      {a.status === 'AVAILABLE' ? 'Mark adopted' : 'Mark available'}
                    </button>
                    {isAdmin && (
                      <button type="button" className="btn btn--outline btn--small" disabled={busyId === a.id} onClick={() => setConfirmId(a.id)}>
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <nav className="pager" aria-label="Pages">
          <button type="button" className="btn btn--outline btn--small" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="muted">Page {data.page + 1} of {data.totalPages}</span>
          <button type="button" className="btn btn--outline btn--small" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </>
  )
}
