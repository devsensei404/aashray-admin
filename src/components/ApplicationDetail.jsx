import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { APP_STATUS, formatDate } from '../format.js'

export default function ApplicationDetail({ noun, basePath, get, setStatus, remove, showAnimal }) {
  const { id } = useParams()
  const [result, setResult] = useState({ id: null, app: null, error: '' })
  const loading = result.id !== id

  useEffect(() => {
    let ignore = false
    get(id)
      .then((app) => {
        if (!ignore) setResult({ id, app, error: '' })
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ id, app: null, error: err.status === 404 ? 'Application not found.' : 'Could not load this application.' })
        }
      })
    return () => {
      ignore = true
    }
  }, [id, get])

  if (loading) return <p className="state" role="status">Loading</p>
  if (result.error) {
    return (
      <>
        <h1>{noun}</h1>
        <p className="alert" role="alert">{result.error}</p>
        <Link className="btn btn--outline btn--small" to={basePath}>Back to list</Link>
      </>
    )
  }
  return (
    <Detail key={id} initial={result.app} noun={noun} basePath={basePath} setStatus={setStatus} remove={remove} showAnimal={showAnimal} />
  )
}

function Detail({ initial, noun, basePath, setStatus, remove, showAnimal }) {
  const navigate = useNavigate()
  const [app, setApp] = useState(initial)
  const [pick, setPick] = useState(initial.status)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function saveStatus() {
    setError('')
    setDone(false)
    setBusy(true)
    try {
      const updated = await setStatus(app.id, pick)
      setApp(updated)
      setDone(true)
    } catch {
      setError('Could not update the status.')
    } finally {
      setBusy(false)
    }
  }

  async function doDelete() {
    setError('')
    setBusy(true)
    try {
      await remove(app.id)
      navigate(basePath)
    } catch (err) {
      setError(err.status === 403 ? 'You are not allowed to delete this.' : 'Could not delete this application.')
      setBusy(false)
    }
  }

  return (
    <>
      <h1>{noun} from {app.applicantName}</h1>

      {error && <p className="alert" role="alert">{error}</p>}

      <dl className="facts">
        <dt>Applicant</dt>
        <dd>{app.applicantName}</dd>
        {showAnimal && (
          <>
            <dt>Animal</dt>
            <dd>{app.animalName}</dd>
          </>
        )}
        <dt>Phone</dt>
        <dd>
          <a className="btn btn--link" href={`tel:${app.phone}`}>{app.phone}</a>
        </dd>
        <dt>Submitted</dt>
        <dd>{formatDate(app.createdAt)}</dd>
        <dt>Status</dt>
        <dd>{APP_STATUS[app.status]}</dd>
        <dt>Message</dt>
        <dd className="message">{app.message || 'No message.'}</dd>
      </dl>

      <section className="panel" aria-labelledby="status-heading">
        <h2 className="sub" id="status-heading">Update status</h2>
        <div className="status-form">
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={pick} onChange={(e) => { setPick(e.target.value); setDone(false) }}>
              {Object.entries(APP_STATUS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn--primary" disabled={busy || pick === app.status} onClick={saveStatus}>
            Update status
          </button>
        </div>
        {done && <p className="muted" role="status">Status updated.</p>}
      </section>

      <div className="detail-actions">
        <Link className="btn btn--outline" to={basePath}>Back to list</Link>
        {!confirming && (
          <button type="button" className="btn btn--outline" disabled={busy} onClick={() => setConfirming(true)}>
            Delete application
          </button>
        )}
        {confirming && (
          <>
            <span>Delete this application?</span>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={doDelete}>Yes, delete</button>
            <button type="button" className="btn btn--outline" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
          </>
        )}
      </div>
    </>
  )
}
