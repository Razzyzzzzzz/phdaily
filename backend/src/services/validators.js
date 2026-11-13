import { WORLD, LIMITS, CHAT } from '../config/gameConfig.js'

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/
const TAG = /^[A-Za-z0-9_-]{1,24}$/
const ITEM_ID = /^[A-Za-z0-9_-]{1,40}$/
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const clampInt = (v, a, b) => (isNum(v) ? clamp(Math.floor(v), a, b) : a)

// ---------- accounts ----------
export function validateCredentials(username, password) {
  if (typeof username !== 'string' || !/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    throw new ValidationError('Username must be 3-16 characters: letters, numbers or underscore.')
  }
  if (typeof password !== 'string' || password.length < 6) throw new ValidationError('Password must be at least 6 characters.')
  if (Buffer.byteLength(password, 'utf8') > 72) throw new ValidationError('Password is too long (max 72 bytes).')
  return { username, password }
}

// ---------- saved game ----------
export function sanitizeLook(look) {
  if (!isObj(look)) throw new ValidationError('Invalid character look')
  for (const k of ['skin', 'hair', 'shirt']) {
    if (typeof look[k] !== 'string' || !HEX.test(look[k])) throw new ValidationError(`Invalid look.${k}`)
  }
  const out = { skin: look.skin, hair: look.hair, shirt: look.shirt }
  // Keep any other small primitive fields so new look options added later are not silently dropped.
  let extra = 0
  for (const [k, v] of Object.entries(look)) {
    if (k in out || !/^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(k)) continue
    if ((typeof v === 'string' && v.length <= 32) || isNum(v) || typeof v === 'boolean') {
      out[k] = v
      if (++extra >= 12) break
    }
  }
  return out
}

function sanitizeInventory(inv) {
  if (inv == null) return {}
  if (!isObj(inv)) throw new ValidationError('Invalid inventory')
  const out = {}
  let kinds = 0
  for (const [id, qty] of Object.entries(inv)) {
    if (!ITEM_ID.test(id) || !isNum(qty)) continue
    const q = clampInt(qty, 0, LIMITS.maxItemQty)
    if (q < 1) continue
    if (++kinds > LIMITS.maxInventoryKinds) throw new ValidationError('Inventory too large')
    out[id] = q
  }
  return out
}

// Splits the client reducer state into the columns we store separately (look, money, level, inventory)
// and the remainder (stored as JSON).
export function sanitizeState(state) {
  if (!isObj(state)) throw new ValidationError('state must be an object')
  if (JSON.stringify(state).length > LIMITS.maxStateBytes) throw new ValidationError('Save is too large')
  if (!isObj(state.player)) throw new ValidationError('state.player is missing')
  const look = sanitizeLook(state.player.look)
  const money = clampInt(state.money, 0, LIMITS.maxMoney)
  const inventory = sanitizeInventory(state.inventory)
  const jobs = isNum(state.stats?.jobs) ? Math.max(0, Math.floor(state.stats.jobs)) : 0
  const level = Math.min(999, 1 + Math.floor(jobs / 3)) // same formula as level() in src/data/gameData.js
  // eslint-disable-next-line no-unused-vars
  const { money: _m, inventory: _i, ...rest } = state
  rest.player = { ...state.player, look }
  return { look, money, level, inventory, rest }
}

// ---------- realtime ----------
const normAngle = (a) => {
  if (Math.abs(a) > 1e6) return 0
  const t = Math.PI * 2
  return ((((a + Math.PI) % t) + t) % t) - Math.PI
}
const cleanTag = (v) => (typeof v === 'string' && TAG.test(v) ? v : null)

// Returns a normalised movement packet or null when the packet is malformed.
export function sanitizeMove(p) {
  if (!isObj(p)) return null
  const { x, z, y, ry, sc, walk } = p
  if (![x, z, y, ry, sc, walk].every(isNum)) return null
  return {
    x: clamp(x, 0, WORLD.width),
    z: clamp(z, 0, WORLD.height),
    y: clamp(y, 0, 8),
    ry: normAngle(ry),
    sc: clamp(sc, 0.2, 1.5),
    walk: clamp(walk, 0, 1),
    air: p.air ? 1 : 0,
    act: cleanTag(p.act),
    phase: cleanTag(p.phase),
  }
}

export function cleanChat(text) {
  if (typeof text !== 'string') return null
  const t = text
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CHAT.maxLen)
  return t || null
}
