const TOKEN_KEY = 'aashray_admin_token'

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

const DELAY = 300
const wait = (ms = DELAY) => new Promise((r) => setTimeout(r, ms))

function fail(status, message, fieldErrors) {
  const err = new Error(message)
  err.status = status
  err.fieldErrors = fieldErrors
  return err
}

function requireAuth() {
  if (!token) {
    onUnauthorized()
    throw fail(401, 'Not logged in')
  }
  return mockUsers.find((u) => u.id === Number(token.split('-')[1]))
}

function requireAdmin() {
  const u = requireAuth()
  if (u.role !== 'ADMIN') throw fail(403, 'Not allowed')
  return u
}

function now() {
  return new Date().toISOString()
}

function page(list, p = 0, size = 20) {
  const start = p * size
  return {
    content: list.slice(start, start + size),
    page: p,
    size,
    totalElements: list.length,
    totalPages: Math.max(1, Math.ceil(list.length / size)),
  }
}

const mockUsers = [
  { id: 1, name: 'Test Admin', email: 'admin@example.org', role: 'ADMIN', active: true },
  { id: 2, name: 'Test Manager', email: 'manager@example.org', role: 'MANAGER', active: true },
]

let animals = Array.from({ length: 27 }, (_, i) => {
  const cats = ['ADOPTABLE', 'RESIDENT', 'RESCUE']
  const category = cats[i % 3]
  return {
    id: i + 1,
    name: `Sample Animal ${i + 1}`,
    category,
    status: category === 'ADOPTABLE' && i % 2 === 0 ? 'AVAILABLE' : i % 5 === 0 ? 'ADOPTED' : 'AVAILABLE',
    ageText: `about ${(i % 6) + 1} years`,
    description: 'Placeholder description for mock data.',
    imageUrl: null,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }
})

let adoptionApps = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  animalId: (i % 5) + 1,
  animalName: `Sample Animal ${(i % 5) + 1}`,
  applicantName: `Test Applicant ${i + 1}`,
  phone: `+9100000000${String(i).padStart(2, '0')}`,
  message: 'Placeholder message for mock data.',
  status: ['PENDING', 'APPROVED', 'REJECTED'][i % 3],
  createdAt: new Date(Date.now() - i * 3600000 * 20).toISOString(),
}))

let volunteerApps = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  applicantName: `Test Volunteer ${i + 1}`,
  phone: `+9100000001${String(i).padStart(2, '0')}`,
  message: 'Placeholder message for mock data.',
  status: ['PENDING', 'APPROVED', 'REJECTED'][i % 3],
  createdAt: new Date(Date.now() - i * 3600000 * 30).toISOString(),
}))

let stories = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  title: `Sample Story ${i + 1}`,
  body: 'Placeholder story text for mock data.',
  imageUrl: null,
  published: i % 2 === 0,
  createdAt: now(),
  updatedAt: now(),
}))

export async function login(email, password) {
  await wait()
  const u = mockUsers.find((x) => x.email === email && x.active)
  if (!u || password !== 'demo1234') throw fail(401, 'Invalid email or password')
  return {
    token: `mock-${u.id}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    user: { id: u.id, name: u.name, role: u.role },
  }
}

export async function getMe() {
  await wait(100)
  const u = requireAuth()
  return { id: u.id, name: u.name, role: u.role }
}

export async function listAnimals({ category = '', status = '', search = '', page: p = 0, size = 20 } = {}) {
  await wait()
  requireAuth()
  const q = search.trim().toLowerCase()
  const list = animals
    .filter((a) => (!category || a.category === category) && (!status || a.status === status))
    .filter((a) => !q || a.name.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return page(list, p, size)
}

export async function getAnimal(id) {
  await wait()
  requireAuth()
  const a = animals.find((x) => x.id === Number(id))
  if (!a) throw fail(404, 'Not found')
  return a
}

function validateAnimal(b) {
  const fe = {}
  if (!b.name?.trim()) fe.name = 'must not be blank'
  else if (b.name.length > 100) fe.name = 'max 100 characters'
  if ((b.description || '').length > 5000) fe.description = 'max 5000 characters'
  if (!['ADOPTABLE', 'RESIDENT', 'RESCUE'].includes(b.category)) fe.category = 'invalid category'
  if (!['AVAILABLE', 'ADOPTED'].includes(b.status)) fe.status = 'invalid status'
  if (Object.keys(fe).length) throw fail(400, 'Validation failed', fe)
}

export async function createAnimal(body) {
  await wait()
  requireAuth()
  validateAnimal(body)
  const a = { ...body, id: Math.max(0, ...animals.map((x) => x.id)) + 1, createdAt: now(), updatedAt: now() }
  animals = [a, ...animals]
  return a
}

export async function updateAnimal(id, body) {
  await wait()
  requireAuth()
  validateAnimal(body)
  const i = animals.findIndex((x) => x.id === Number(id))
  if (i < 0) throw fail(404, 'Not found')
  animals[i] = { ...animals[i], ...body, id: animals[i].id, updatedAt: now() }
  return animals[i]
}

export async function setAnimalStatus(id, status) {
  await wait()
  requireAuth()
  const a = animals.find((x) => x.id === Number(id))
  if (!a) throw fail(404, 'Not found')
  a.status = status
  a.updatedAt = now()
  return a
}

export async function deleteAnimal(id) {
  await wait()
  requireAdmin()
  animals = animals.filter((x) => x.id !== Number(id))
}

export async function uploadAnimalImage(id, file) {
  await wait(600)
  requireAuth()
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw fail(400, 'Validation failed', { file: 'JPG or PNG only' })
  if (file.size > 5 * 1024 * 1024) throw fail(400, 'Validation failed', { file: 'max 5 MB' })
  const imageUrl = URL.createObjectURL(file)
  const a = animals.find((x) => x.id === Number(id))
  if (a) a.imageUrl = imageUrl
  return { imageUrl }
}

function listApps(source, { status = '', animalId = '', page: p = 0, size = 20 } = {}) {
  const list = source
    .filter((a) => (!status || a.status === status) && (!animalId || a.animalId === Number(animalId)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return page(list, p, size)
}

export async function listAdoptionApplications(params) {
  await wait()
  requireAuth()
  return listApps(adoptionApps, params)
}

export async function getAdoptionApplication(id) {
  await wait()
  requireAuth()
  const a = adoptionApps.find((x) => x.id === Number(id))
  if (!a) throw fail(404, 'Not found')
  return a
}

export async function setAdoptionStatus(id, status) {
  await wait()
  requireAuth()
  const a = adoptionApps.find((x) => x.id === Number(id))
  if (!a) throw fail(404, 'Not found')
  a.status = status
  return a
}

export async function deleteAdoptionApplication(id) {
  await wait()
  requireAdmin()
  adoptionApps = adoptionApps.filter((x) => x.id !== Number(id))
}

export async function listVolunteerApplications(params) {
  await wait()
  requireAuth()
  return listApps(volunteerApps, params)
}

export async function getVolunteerApplication(id) {
  await wait()
  requireAuth()
  const a = volunteerApps.find((x) => x.id === Number(id))
  if (!a) throw fail(404, 'Not found')
  return a
}

export async function setVolunteerStatus(id, status) {
  await wait()
  requireAuth()
  const a = volunteerApps.find((x) => x.id === Number(id))
  if (!a) throw fail(404, 'Not found')
  a.status = status
  return a
}

export async function deleteVolunteerApplication(id) {
  await wait()
  requireAdmin()
  volunteerApps = volunteerApps.filter((x) => x.id !== Number(id))
}

export async function listStories({ published = '', page: p = 0, size = 20 } = {}) {
  await wait()
  requireAuth()
  const list = stories.filter((s) => published === '' || String(s.published) === String(published))
  return page(list, p, size)
}

export async function listUsers() {
  await wait()
  requireAdmin()
  return mockUsers
}
