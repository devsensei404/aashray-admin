import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAnimal, createAnimal, updateAnimal, uploadAnimalImage } from '../api.js'
import { compressImage, looksLikeJpegOrPng } from '../compressImage.js'
import { formatSize } from '../format.js'

const CATEGORY = { ADOPTABLE: 'Adoptable', RESIDENT: 'Resident', RESCUE: 'Rescue' }
const STATUS = { AVAILABLE: 'Available', ADOPTED: 'Adopted' }
const BLANK = { id: null, name: '', category: 'ADOPTABLE', status: 'AVAILABLE', ageText: '', description: '', imageUrl: null }
const MAX_IMAGE = 5 * 1024 * 1024
const MAX_INPUT = 25 * 1024 * 1024

function validate(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Name is required.'
  else if (v.name.length > 100) e.name = 'Name must be 100 characters or fewer.'
  if (v.description.length > 5000) e.description = 'Description must be 5000 characters or fewer.'
  return e
}

export default function AnimalFormPage() {
  const { id } = useParams()
  const [result, setResult] = useState({ id: null, animal: null, error: '' })
  const loading = Boolean(id) && result.id !== id

  useEffect(() => {
    if (!id) return
    let ignore = false
    getAnimal(id)
      .then((animal) => {
        if (!ignore) setResult({ id, animal, error: '' })
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ id, animal: null, error: err.status === 404 ? 'Animal not found.' : 'Could not load this animal.' })
        }
      })
    return () => {
      ignore = true
    }
  }, [id])

  if (!id) return <Form key="new" initial={BLANK} />
  if (loading) return <p className="state" role="status">Loading</p>
  if (result.error) {
    return (
      <>
        <h1>Edit animal</h1>
        <p className="alert" role="alert">{result.error}</p>
        <Link className="btn btn--outline btn--small" to="/animals">Back to animals</Link>
      </>
    )
  }
  return <Form key={id} initial={result.animal} />
}

function Form({ initial }) {
  const navigate = useNavigate()
  const editing = initial.id !== null
  const [values, setValues] = useState({
    name: initial.name,
    category: initial.category,
    status: initial.status,
    ageText: initial.ageText,
    description: initial.description,
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const previewRef = useRef(null)
  const pickRef = useRef(0)
  const [compressing, setCompressing] = useState(false)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [savedId, setSavedId] = useState(initial.id)

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))
  const inv = (k) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${k}-error` : undefined,
  })
  const err = (k) => errors[k] && <p className="field-error" id={`${k}-error`}>{errors[k]}</p>

  async function pickFile(e) {
    const input = e.target
    const f = input.files[0]
    if (!f) return
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setErrors((p) => ({ ...p, file: 'Use a JPG or PNG image.' }))
      input.value = ''
      return
    }
    if (f.size > MAX_INPUT) {
      setErrors((p) => ({ ...p, file: 'Image must be 25 MB or smaller.' }))
      input.value = ''
      return
    }

    const id = ++pickRef.current
    setCompressing(true)
    setNote('')
    try {
      if (!(await looksLikeJpegOrPng(f))) {
        if (id === pickRef.current) {
          setErrors((p) => ({ ...p, file: 'Use a JPG or PNG image.' }))
          input.value = ''
        }
        return
      }
      const out = await compressImage(f)
      if (id !== pickRef.current) return
      if (out.size > MAX_IMAGE) {
        setErrors((p) => ({ ...p, file: 'Could not shrink this photo below 5 MB. Try another one.' }))
        input.value = ''
        return
      }
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      const url = URL.createObjectURL(out)
      previewRef.current = url
      setPreview(url)
      setFile(out)
      setNote(out === f ? `Photo ready: ${formatSize(out.size)}.` : `Photo ready: ${formatSize(out.size)} (was ${formatSize(f.size)}).`)
      setErrors((p) => ({ ...p, file: undefined }))
    } catch {
      if (id === pickRef.current) {
        setErrors((p) => ({ ...p, file: 'Could not read this image. Try another photo.' }))
        input.value = ''
      }
    } finally {
      if (id === pickRef.current) setCompressing(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setFormError('')
    const found = validate(values)
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(first)?.focus()
      return
    }

    setBusy(true)
    let saved
    try {
      const body = {
        name: values.name.trim(),
        category: values.category,
        status: values.status,
        ageText: values.ageText.trim(),
        description: values.description,
        imageUrl: initial.imageUrl,
      }
      saved = savedId ? await updateAnimal(savedId, body) : await createAnimal(body)
      setSavedId(saved.id)
    } catch (ex) {
      if (ex.fieldErrors) setErrors(ex.fieldErrors)
      else setFormError('Could not save. Try again.')
      setBusy(false)
      return
    }

    if (file) {
      try {
        await uploadAnimalImage(saved.id, file)
      } catch (ex) {
        setErrors(ex.fieldErrors || {})
        setFormError('Saved, but the photo did not upload. Fix the photo and save again.')
        setBusy(false)
        return
      }
    }
    navigate('/animals')
  }

  const shown = preview || initial.imageUrl

  return (
    <>
      <h1>{editing ? 'Edit animal' : 'Add animal'}</h1>
      <form className="form form--wide" onSubmit={onSubmit} noValidate>
        {formError && <p className="alert" role="alert">{formError}</p>}

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={values.name} onChange={set('name')} autoComplete="off" required {...inv('name')} />
          {err('name')}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={values.category} onChange={set('category')} {...inv('category')}>
              {Object.entries(CATEGORY).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {err('category')}
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={values.status} onChange={set('status')} {...inv('status')}>
              {Object.entries(STATUS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {err('status')}
          </div>
        </div>

        <div className="field">
          <label htmlFor="ageText">Age</label>
          <input id="ageText" type="text" value={values.ageText} onChange={set('ageText')} autoComplete="off" {...inv('ageText')} />
          <p className="hint muted">Free text, for example about 2 years.</p>
          {err('ageText')}
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={6} value={values.description} onChange={set('description')} {...inv('description')} />
          <p className="hint muted">{values.description.length} / 5000</p>
          {err('description')}
        </div>

        <div className="field">
          <label htmlFor="file">Photo</label>
          <div className="thumb">
            {shown ? <img src={shown} alt={values.name ? `Photo of ${values.name}` : 'Selected photo'} /> : null}
          </div>
          <input id="file" type="file" accept="image/jpeg,image/png" onChange={pickFile} {...inv('file')} />
          <p className="hint muted" role="status">
            {compressing ? 'Shrinking photo' : note || 'JPG or PNG. Large photos are shrunk automatically before upload.'}
          </p>
          {err('file')}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={busy || compressing}>
            {busy ? 'Saving' : editing ? 'Save changes' : 'Add animal'}
          </button>
          <Link className="btn btn--outline" to="/animals">Cancel</Link>
        </div>
      </form>
    </>
  )
}
