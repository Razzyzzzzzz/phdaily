import { env } from './env.js'

const LAN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/

// Used by both Express (CORS) and Socket.IO. Requests without an Origin header (curl, native apps) are allowed.
export function isOriginAllowed(origin) {
  if (!origin) return true
  if (env.clientOrigins.includes(origin)) return true
  return env.allowLan && LAN.test(origin)
}
