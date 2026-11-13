import * as auth from '../services/authService.js'
import { world } from '../services/worldService.js'
import { wrap } from '../middleware/errorHandler.js'

export const register = wrap(async (req, res) => {
  const { username, password } = req.body ?? {}
  res.status(201).json(await auth.register(username, password))
})

export const login = wrap(async (req, res) => {
  const { username, password } = req.body ?? {}
  res.json(await auth.login(username, password))
})

export const logout = wrap(async (req, res) => {
  await auth.logout(req.user.id)
  world.kick(req.user.id, 'logout') // removes the player from the shared world right away
  res.json({ ok: true })
})

export const me = wrap(async (req, res) => {
  res.json(await auth.me(req.user.id))
})
