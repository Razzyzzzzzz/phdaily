import { Router } from 'express'
import authRoutes from './authRoutes.js'
import playerRoutes from './playerRoutes.js'
import { apiLimiter } from '../middleware/rateLimit.js'
import { world } from '../services/worldService.js'

const router = Router()
router.get('/health', (req, res) => res.json({ ok: true, online: world.onlineCount() }))
router.use(apiLimiter)
router.use('/auth', authRoutes)
router.use('/player', playerRoutes)
export default router
