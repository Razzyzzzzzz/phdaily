import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'

const router = Router()
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/logout', requireAuth, logout)
router.get('/me', requireAuth, me)
export default router
