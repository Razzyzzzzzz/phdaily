// Broadcasts a short emote (wave, laugh, ...) to everybody in the world.
// Only ids from this whitelist are accepted, so clients can never inject arbitrary data.
const ALLOWED = new Set(['wave', 'laugh', 'love', 'cry', 'angry', 'thumbs', 'party', 'sleep'])
const MIN_GAP_MS = 1200

export function registerEmoteHandlers(io, socket) {
  let last = 0
  socket.on('emote:send', (emote) => {
    if (typeof emote !== 'string' || !ALLOWED.has(emote)) return
    const now = Date.now()
    if (now - last < MIN_GAP_MS) return
    last = now
    io.emit('emote:show', { id: socket.data.user.id, emote })
  })
}