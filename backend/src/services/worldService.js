import { randomUUID } from 'node:crypto'
import { NET, CHAT, LOCATIONS } from '../config/gameConfig.js'
import { sanitizeMove, cleanChat } from './validators.js'

const nearKnownLocation = (x, z) => Object.values(LOCATIONS).some(([lx, lz]) => Math.hypot(x - lx, z - lz) <= NET.teleportRadius)
const r1 = (n) => Math.round(n * 10) / 10
const r2 = (n) => Math.round(n * 100) / 100

// Public (broadcast) view of a player.
const view = (e) => ({
  id: e.userId, username: e.username, level: e.level, look: e.look, online: e.online,
  x: r1(e.x), z: r1(e.z), y: r2(e.y), ry: r2(e.ry), sc: r2(e.sc), walk: r2(e.walk), air: e.air, act: e.act, phase: e.phase,
})
const motion = (e) => ({ id: e.userId, x: r1(e.x), z: r1(e.z), y: r2(e.y), ry: r2(e.ry), sc: r2(e.sc), walk: r2(e.walk), air: e.air, act: e.act, phase: e.phase })

export class World {
  constructor({ persistPosition = async () => {}, now = Date.now, graceMs = NET.graceMs } = {}) {
    this.graceMs = graceMs
    this.players = new Map() // userId -> entry (online, or inside the reconnect grace window)
    this.chat = []
    this.dirty = new Set()
    this.io = null
    this.persistPosition = persistPosition
    this.now = now
    this.timers = []
  }

  attach(io) {
    this.io = io
    this.timers.push(setInterval(() => this.tick(), Math.round(1000 / NET.tickHz)))
    this.timers.push(setInterval(() => this.flushPositions(), NET.persistEveryMs))
  }

  async stop() {
    this.timers.forEach(clearInterval)
    this.timers = []
    for (const e of this.players.values()) clearTimeout(e.graceTimer)
    await this.flushPositions()
  }

  entryFor(socket) {
    const e = this.players.get(socket.data.user.id)
    return e && e.socketId === socket.id ? e : null
  }

  // ---- lifecycle ----
  join({ socket, user, character }) {
    const id = user.id
    let e = this.players.get(id)
    if (e && e.online && e.socketId && e.socketId !== socket.id) {
      // Same account opened on another device: the newest session wins.
      const old = this.io.sockets.sockets.get(e.socketId)
      e.socketId = null // detach first so the old socket's disconnect handler ignores this entry
      if (old) { old.emit('session:replaced'); old.disconnect(true) }
    }
    if (e) {
      // Reconnect inside the grace window (or a replaced session): resume the same entity, no join/leave flicker.
      clearTimeout(e.graceTimer)
      e.graceTimer = null
      e.socketId = socket.id
      e.level = character.level
      e.look = character.look
      if (!e.online) this.io.emit('player:presence', { id, online: true })
      e.online = true
    } else {
      e = {
        userId: id, username: user.username, level: character.level, look: character.look,
        x: character.posX, z: character.posZ, y: 0, ry: 0, sc: 1, walk: 0, air: 0, act: null, phase: null,
        socketId: socket.id, online: true, graceTimer: null, lastStateAt: 0, chatTimes: [], posDirty: false,
      }
      this.players.set(id, e)
      socket.broadcast.emit('player:joined', view(e))
    }
    e.acceptAny = true // the first packet after (re)connecting may be anywhere: the client kept moving while offline
    return {
      self: view(e),
      players: [...this.players.values()].filter((p) => p.userId !== id).map(view),
      chat: this.chat,
    }
  }

  leave(socket) {
    const e = this.entryFor(socket)
    if (!e) return
    e.socketId = null
    e.online = false
    this.persist(e)
    this.io.emit('player:presence', { id: e.userId, online: false })
    e.graceTimer = setTimeout(() => this.remove(e.userId), this.graceMs)
  }

  remove(id) {
    const e = this.players.get(id)
    if (!e || e.online) return
    clearTimeout(e.graceTimer)
    this.players.delete(id)
    this.dirty.delete(id)
    this.io.emit('player:left', { id })
  }

  // Force a user out immediately (logout).
  kick(userId, reason = 'logout') {
    const e = this.players.get(userId)
    if (!e || !this.io) return
    const sock = e.socketId && this.io.sockets.sockets.get(e.socketId)
    e.socketId = null
    e.online = false
    clearTimeout(e.graceTimer)
    this.persist(e)
    if (sock) { sock.emit('session:ended', { reason }); sock.disconnect(true) }
    this.remove(userId)
  }

  // ---- realtime input ----
  handleState(socket, raw) {
    const e = this.entryFor(socket)
    if (!e) return
    const t = this.now()
    if (t - e.lastStateAt < NET.minStateIntervalMs) return
    const m = sanitizeMove(raw)
    if (!m) return
    if (!e.acceptAny) {
      const dt = Math.min(Math.max((t - e.lastStateAt) / 1000, 0.05), 2)
      const dist = Math.hypot(m.x - e.x, m.z - e.z)
      if (dist > NET.maxSpeed * dt + NET.speedSlack && !nearKnownLocation(m.x, m.z)) {
        e.lastStateAt = t
        socket.emit('player:correct', { x: e.x, z: e.z }) // speed / teleport hack or desync: snap the client back
        return
      }
    }
    e.acceptAny = false
    e.lastStateAt = t
    Object.assign(e, m)
    e.posDirty = true
    this.dirty.add(e.userId)
  }

  handleChat(socket, text) {
    const e = this.entryFor(socket)
    if (!e) return { ok: false, error: 'not_in_world' }
    const t = this.now()
    e.chatTimes = e.chatTimes.filter((x) => t - x < CHAT.windowMs)
    if (e.chatTimes.length && t - e.chatTimes[e.chatTimes.length - 1] < CHAT.minIntervalMs) return { ok: false, error: 'slow_down' }
    if (e.chatTimes.length >= CHAT.maxPerWindow) return { ok: false, error: 'rate_limited' }
    const clean = cleanChat(text)
    if (!clean) return { ok: false, error: 'empty' }
    e.chatTimes.push(t)
    const msg = { id: randomUUID(), userId: e.userId, username: e.username, text: clean, ts: t }
    this.chat.push(msg)
    if (this.chat.length > CHAT.history) this.chat.shift()
    this.io.emit('chat:message', msg)
    return { ok: true }
  }

  // Called after a successful REST save so everyone sees the new level / outfit.
  profileSaved(userId, { level, look }) {
    const e = this.players.get(userId)
    if (!e || !this.io) return
    e.level = level
    e.look = look
    this.io.emit('player:profile', { id: userId, level, look })
  }

  // ---- loops ----
  tick() {
    if (!this.dirty.size || !this.io) return
    const players = []
    for (const id of this.dirty) {
      const e = this.players.get(id)
      if (e) players.push(motion(e))
    }
    this.dirty.clear()
    if (players.length) this.io.volatile.emit('world:snapshot', { t: this.now(), players })
  }

  persist(e) {
    if (!e.posDirty) return Promise.resolve()
    e.posDirty = false
    return Promise.resolve(this.persistPosition(e.userId, e.x, e.z)).catch((err) => {
      e.posDirty = true
      console.error('[world] could not save position', err.message)
    })
  }

  flushPositions() {
    return Promise.all([...this.players.values()].map((e) => this.persist(e)))
  }

  onlineCount() {
    let n = 0
    for (const e of this.players.values()) if (e.online) n++
    return n
  }
}

export const world = new World()
