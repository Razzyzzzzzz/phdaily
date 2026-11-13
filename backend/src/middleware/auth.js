import { authenticate } from '../services/authService.js'
import { wrap } from './errorHandler.js'

export const requireAuth = wrap(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  req.user = await authenticate(token)
  next()
})
