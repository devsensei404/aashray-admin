import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_STATUS, formatDate } from '../format.js'

export default function ApplicationList({ title, basePath, load, showAnimal }) {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: '', data: null, error: '' })

  const key = `${status}|${page}|${reload}`
  const loading = result.key !== key

  useEffect(() => {
    let ignore = false
    load({ status, page })
      .then((data) => {
        if (!ignore) setResult({ key, data, error: '' })
      })
      .catch(() => {
        if (!ignore) setResult({ key, data: null, error: 'Could not load applications.' })
      })
    return () => {
      ignore = true
    }
  }, [key, load, status, page])

  function changeStatus(v) {
    setStatus(v)
    setPage(0)
  }

  const data = result.data
  const items = data?.content ?? []

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {data && <p className="muted">{data.totalElements} in total</p>}
        </div>
      </div>

      <form className="filters filters--one" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => changeStatus(e.target.value)}>
            <option value="">All</option>
            {Object.entries(APP_STATUS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </form>

      {loading && !data && <p className="state" role="status">Loading</p>}

      {!loading && result.error && (
        <div className="state">
          <p className="alert" role="alert">{result.error}</p>
          <button type="button" className="btn btn--outline btn--small" onClick={() => setReload((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {!loading && !result.error && items.length === 0 && <p className="state">No applications match this filter.</p>}

      {items.length > 0 && (
        <ul className="rows" aria-busy={loading}>
          {items.map((a) => (
            <li className="row" key={a.id}>
              <div>
                <h3>{a.applicantName}</h3>
                <p className="muted row-meta">
                  {showAnimal ? `For ${a.animalName} · ` : ''}
                  {APP_STATUS[a.status]} · {formatDate(a.createdAt)}
                </p>
              </div>
              <div className="row-actions">
                <Link
                  className="btn btn--outline btn--small"
                  to={`${basePath}/${a.id}`}
                  aria-label={`View application from ${a.applicantName}`}
                >
                  View
                </Link>
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
