const TOKEN_KEY = 'aashray_admin_token'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

let token = readToken()
let onUnauthorized = () => {}

export function getToken() {
  return token
}

export function setToken(t) {
  token = t
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    return
  }
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

function fail(status, message, fieldErrors) {
  const err = new Error(message)
  err.status = status
  err.fieldErrors = fieldErrors
  return err
}

function query(params) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function request(method, path, { body, form, auth = true } = {}) {
  if (auth && !token) {
    setToken(null)
    onUnauthorized()
    throw fail(401, 'Not logged in')
  }

  const headers = {}
  if (auth) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload })
  } catch {
    throw fail(0, 'Cannot reach the server')
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null)
      onUnauthorized()
    }
    throw fail(res.status, data?.message || `Request failed (${res.status})`, data?.fieldErrors)
  }
  return data
}

export function login(email, password) {
  return request('POST', '/auth/login', { body: { email, password }, auth: false })
}

export function getMe() {
  return request('GET', '/auth/me')
}

export function listAnimals({ category = '', status = '', search = '', page = 0, size = 20 } = {}) {
  return request('GET', `/animals${query({ category, status, search: search.trim(), page, size })}`)
}

export function getAnimal(id) {
  return request('GET', `/animals/${id}`)
}

export function createAnimal(body) {
  return request('POST', '/animals', { body })
}

export function updateAnimal(id, body) {
  return request('PUT', `/animals/${id}`, { body })
}

export function setAnimalStatus(id, status) {
  return request('PATCH', `/animals/${id}/status`, { body: { status } })
}

export function deleteAnimal(id) {
  return request('DELETE', `/animals/${id}`)
}

export function uploadAnimalImage(id, file) {
  const form = new FormData()
  form.append('file', file)
  return request('POST', `/animals/${id}/image`, { form })
}

export function listAdoptionApplications({ status = '', animalId = '', page = 0, size = 20 } = {}) {
  return request('GET', `/adoption-applications${query({ status, animalId, page, size })}`)
}

export function getAdoptionApplication(id) {
  return request('GET', `/adoption-applications/${id}`)
}

export function setAdoptionStatus(id, status) {
  return request('PATCH', `/adoption-applications/${id}/status`, { body: { status } })
}

export function deleteAdoptionApplication(id) {
  return request('DELETE', `/adoption-applications/${id}`)
}

export function listVolunteerApplications({ status = '', page = 0, size = 20 } = {}) {
  return request('GET', `/volunteer-applications${query({ status, page, size })}`)
}

export function getVolunteerApplication(id) {
  return request('GET', `/volunteer-applications/${id}`)
}

export function setVolunteerStatus(id, status) {
  return request('PATCH', `/volunteer-applications/${id}/status`, { body: { status } })
}

export function deleteVolunteerApplication(id) {
  return request('DELETE', `/volunteer-applications/${id}`)
}

export function listStories({ published = '', page = 0, size = 20 } = {}) {
  return request('GET', `/stories${query({ published, page, size })}`)
}

export function getStory(id) {
  return request('GET', `/stories/${id}`)
}

export function createStory(body) {
  return request('POST', '/stories', { body })
}

export function updateStory(id, body) {
  return request('PUT', `/stories/${id}`, { body })
}

export function setStoryPublished(id, published) {
  return request('PATCH', `/stories/${id}/published`, { body: { published } })
}

export function deleteStory(id) {
  return request('DELETE', `/stories/${id}`)
}
