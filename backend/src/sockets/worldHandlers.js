import { NET } from '../config/gameConfig.js'

// Joins the authenticated socket to the shared world and wires movement + disconnect handling.
export function registerWorldHandlers(io, socket, world) {
  const { user, character } = socket.data
  const { self, players, chat } = world.join({ socket, user, character })

  socket.emit('world:init', { self, players, chat, tickHz: NET.tickHz })

  socket.on('player:state', (packet) => world.handleState(socket, packet))
  socket.on('disconnect', () => world.leave(socket))
}
