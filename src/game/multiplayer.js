import { io } from 'socket.io-client'
import { API_URL, getToken, clearToken } from '../store/storage'
import { mpStore } from '../store/mpStore'
import { notifyUnauthorized } from '../utils/api'

const SEND_MS = 66        // ~15 position packets / second
const HEARTBEAT_MS = 1000 // resend even when standing still, so a dropped packet can never leave a remote player stuck mid-walk
const MAX_CHAT = 100

const pickMotion = (p) => ({ x: p.x, z: p.z, y: p.y || 0, ry: p.ry || 0, sc: p.sc || 1, walk: p.walk || 0, air: p.air || 0, act: p.act || null, phase: p.phase || null })
const labelOf = (p) => `${p.username}  Lv.${p.level}`

class Multiplayer {
  constructor() {
    this.socket = null
    this.bridge = null
    this.remotes = new Map() // id -> { id, username, level, look, online, cur, tgt }  (read every frame by RemotePlayers.jsx)
    this.me = null
    this.timer = null
    this.last = null
    this.lastSent = 0
    this.spawned = false
    this.ended = false
  }

  // `bridge` is the same object the game already shares with Scene3D (vec, paused, act, ...).
  // Scene3D publishes the local player's transform on bridge.me; this class streams it to the server.
  connect(bridge) {
    this.disconnect()
    if (!getToken()) {
      mpStore.set({ status: 'error', error: 'Not logged in.' })
      return
    }
    this.bridge = bridge
    this.ended = false
    this.spawned = false
    mpStore.set({ status: 'connecting', error: null })

    const socket = io(API_URL, {
      auth: (cb) => cb({ token: getToken() }), // re-read on every (re)connect attempt
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 8000,
    })
    this.socket = socket

    socket.on('connect_error', (err) => {
      if (err?.message === 'AUTH') { this.fail('Your session expired. Please log in again.'); clearToken(); notifyUnauthorized(); return }
      if (err?.message === 'NO_CHARACTER') { this.fail('Create your character first.'); return }
      mpStore.set({ status: this.me ? 'reconnecting' : 'connecting', error: 'Cannot reach the game server.' })
    })

    socket.on('disconnect', (reason) => {
      if (this.ended || reason === 'io client disconnect') return
      mpStore.set({ status: 'reconnecting', error: null })
      // The server closed the socket without our session being ended: socket.io will not retry by itself.
      if (reason === 'io server disconnect') setTimeout(() => { if (this.socket === socket && !this.ended) socket.connect() }, 1000)
    })

    socket.on('world:init', ({ self, players, chat }) => {
      this.me = { id: self.id, username: self.username, level: self.level, look: self.look, online: true, self: true }
      this.remotes.clear()
      players.forEach((p) => this.setRemote(p))
      if (!this.spawned) { this.spawned = true; this.place(self.x, self.z) } // restore the saved position once per session
      this.last = null
      mpStore.set({
        status: 'online', error: null, selfId: self.id,
        chat: chat.map((m) => ({ ...m, mine: m.userId === self.id })),
      })
      this.refresh()
      this.startSending()
    })

    socket.on('player:joined', (p) => { this.setRemote(p); this.refresh() })
    socket.on('player:left', ({ id }) => { this.remotes.delete(id); this.refresh() })
    socket.on('player:presence', ({ id, online }) => {
      const r = this.remotes.get(id)
      if (r) { r.online = online; this.refresh() }
    })
    socket.on('player:profile', ({ id, level, look }) => {
      if (this.me && id === this.me.id) { this.me.level = level; this.me.look = look }
      const r = this.remotes.get(id)
      if (r) { r.level = level; r.look = look }
      this.refresh()
    })
    socket.on('world:snapshot', ({ players }) => {
      for (const u of players) {
        const r = this.remotes.get(u.id)
        if (r) r.tgt = pickMotion(u)
      }
    })
    socket.on('player:correct', ({ x, z }) => this.place(x, z)) // server rejected an impossible move
    socket.on('chat:message', (m) => {
      const st = mpStore.get()
      const mine = !!this.me && m.userId === this.me.id
      mpStore.set({
        chat: [...st.chat, { ...m, mine }].slice(-MAX_CHAT),
        unread: st.chatOpen || mine ? 0 : st.unread + 1,
      })
    })
    socket.on('session:replaced', () => {
      this.ended = true
      this.stopSending()
      mpStore.set({ status: 'replaced', error: 'This account was opened on another device.' })
    })
    socket.on('session:ended', () => {
      this.ended = true
      this.stopSending()
      clearToken()
      this.fail('You were logged out.')
      notifyUnauthorized()
    })
  }

  disconnect() {
    this.stopSending()
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
    }
    this.socket = null
    this.bridge = null
    this.me = null
    this.remotes.clear()
    this.last = null
    this.ended = false
    mpStore.set({ status: 'offline', error: null, selfId: null, selfLabel: '', players: [], onlineCount: 0, chat: [], unread: 0 })
  }

  fail(message) {
    this.ended = true
    this.stopSending()
    this.socket?.disconnect()
    mpStore.set({ status: 'error', error: message })
  }

  // Resolves { ok: true } or { ok: false, error } (slow_down | rate_limited | empty | offline | timeout)
  sendChat(text) {
    return new Promise((resolve) => {
      if (!this.socket?.connected) return resolve({ ok: false, error: 'offline' })
      this.socket.timeout(5000).emit('chat:send', text, (err, res) => resolve(err ? { ok: false, error: 'timeout' } : res))
    })
  }

  // ---- internals ----
  setRemote(p) {
    const prev = this.remotes.get(p.id)
    this.remotes.set(p.id, { id: p.id, username: p.username, level: p.level, look: p.look, online: p.online !== false, cur: prev?.cur ?? null, tgt: pickMotion(p) })
  }

  refresh() {
    const others = [...this.remotes.values()].map(({ id, username, level, look, online }) => ({ id, username, level, look, online }))
    others.sort((a, b) => a.username.localeCompare(b.username))
    const players = this.me ? [this.me, ...others] : others
    mpStore.set({
      players,
      onlineCount: players.filter((p) => p.online).length,
      selfLabel: this.me ? labelOf(this.me) : '',
    })
  }

  place(x, z) {
    const b = this.bridge
    if (!b) return
    if (b.setPos) b.setPos(x, z)
    else b.spawn = { x, z } // Scene3D has not mounted yet; it applies this when it does
  }

  startSending() {
    if (this.timer) return
    this.timer = setInterval(() => this.pump(), SEND_MS)
  }

  stopSending() {
    clearInterval(this.timer)
    this.timer = null
  }

  pump() {
    const s = this.socket
    const me = this.bridge?.me
    if (!s?.connected || !me) return
    const l = this.last
    const changed = !l || Math.abs(me.x - l.x) > 0.5 || Math.abs(me.z - l.z) > 0.5 || Math.abs(me.y - l.y) > 0.02 ||
      Math.abs(me.ry - l.ry) > 0.02 || me.sc !== l.sc || Math.abs(me.walk - l.walk) > 0.05 || me.air !== l.air || me.act !== l.act || me.phase !== l.phase
    const now = performance.now()
    if (!changed && now - this.lastSent < HEARTBEAT_MS) return
    this.last = { ...me }
    this.lastSent = now
    s.volatile.emit('player:state', this.last)
  }
}

export const multiplayer = new Multiplayer()
