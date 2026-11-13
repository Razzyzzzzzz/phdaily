import { Server } from 'socket.io'
import { registerWorldHandlers } from './worldHandlers.js'
import { registerChatHandlers } from './chatHandlers.js'

// Dependencies are injected so the realtime layer can be tested without MySQL.
export function setupSockets(httpServer, { world, isOriginAllowed, authenticate, loadCharacter }) {
  const io = new Server(httpServer, {
    cors: { origin: (origin, cb) => cb(null, isOriginAllowed(origin)) },
    pingInterval: 10_000, // detect dead connections quickly so reconnect / grace handling kicks in
    pingTimeout: 8_000,
    maxHttpBufferSize: 20_000,
  })
  world.attach(io)

  // Handshake: valid JWT (and not logged out) + an existing character.
  io.use(async (socket, next) => {
    try {
      const user = await authenticate(socket.handshake.auth?.token)
      const character = await loadCharacter(user.id)
      if (!character) return next(new Error('NO_CHARACTER'))
      socket.data.user = user
      socket.data.character = character
      next()
    } catch (err) {
      next(new Error(err?.code === 'AUTH' ? 'AUTH' : 'SERVER'))
    }
  })

  io.on('connection', (socket) => {
    registerWorldHandlers(io, socket, world)
    registerChatHandlers(io, socket, world)
  })
  return io
}
