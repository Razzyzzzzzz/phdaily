import http from 'node:http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
import { isOriginAllowed } from './config/cors.js'
import routes from './routes/index.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import { setupSockets } from './sockets/index.js'
import { world } from './services/worldService.js'
import { authenticate } from './services/authService.js'
import { loadCharacterForSocket, savePosition } from './services/playerService.js'

const app = express()
app.disable('x-powered-by')
if (env.trustProxy) app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: (origin, cb) => cb(null, isOriginAllowed(origin)) }))
app.use(express.json({ limit: '2mb' }))
app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

const server = http.createServer(app)
world.persistPosition = savePosition
setupSockets(server, { world, isOriginAllowed, authenticate, loadCharacter: loadCharacterForSocket })

server.listen(env.port, '0.0.0.0', () => {
  console.log(`[server] listening on http://0.0.0.0:${env.port}  (REST: /api, realtime: Socket.IO)`)
})

let closing = false
async function shutdown(signal) {
  if (closing) return
  closing = true
  console.log(`[server] ${signal}: saving positions and shutting down...`)
  try {
    await world.stop()
    await prisma.$disconnect()
  } finally {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  }
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
