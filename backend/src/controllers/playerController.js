import * as players from '../services/playerService.js'
import { world } from '../services/worldService.js'
import { wrap } from '../middleware/errorHandler.js'

export const getPlayer = wrap(async (req, res) => {
  res.json({ character: await players.loadGame(req.user.id) })
})

export const savePlayer = wrap(async (req, res) => {
  const saved = await players.saveGame(req.user.id, req.body?.state)
  world.profileSaved(req.user.id, { level: saved.level, look: saved.look })
  res.json({ ok: true, level: saved.level, money: saved.money })
})
