export function registerChatHandlers(io, socket, world) {
  socket.on('chat:send', (text, ack) => {
    const result = world.handleChat(socket, text)
    if (typeof ack === 'function') ack(result)
  })
}
