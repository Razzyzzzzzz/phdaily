import { API_URL, getToken, setToken, clearToken } from '../store/storage'

export const UNAUTHORIZED_EVENT = 'elph:unauthorized'

// Tells the app (window event) that the saved token is no longer valid, so it can show the login screen.
export const notifyUnauthorized = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request(path, { method = 'GET', body, auth = true, keepalive = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`
  const payload = body === undefined ? undefined : JSON.stringify(body)
  let res
  try {
    res = await fetch(API_URL + '/api' + path, {
      method, headers, body: payload,
      keepalive: keepalive && (payload?.length || 0) < 60000, // browsers cap keepalive bodies at 64 KB
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the game server. Is it running?', 'NETWORK')
  }
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && auth) { clearToken(); notifyUnauthorized() }
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.code)
  }
  return data
}

export const api = {
  async register(username, password) {
    const res = await request('/auth/register', { method: 'POST', body: { username, password }, auth: false })
    setToken(res.token)
    return res // { token, user, hasCharacter }
  },
  async login(username, password) {
    const res = await request('/auth/login', { method: 'POST', body: { username, password }, auth: false })
    setToken(res.token)
    return res
  },
  async logout() {
    try { await request('/auth/logout', { method: 'POST' }) } catch { /* token may already be invalid */ }
    clearToken()
  },
  me: () => request('/auth/me'),
  // -> { character: null | { look, level, x, z, state } }  (state is ready for dispatch({ type: 'LOAD', state }))
  getPlayer: () => request('/player'),
  savePlayer: (state, { keepalive = false } = {}) => request('/player/save', { method: 'PUT', body: { state }, keepalive }),
}
