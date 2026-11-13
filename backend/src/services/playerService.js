import { prisma } from '../config/prisma.js'
import { SPAWN } from '../config/gameConfig.js'
import { AppError } from '../middleware/errorHandler.js'
import { sanitizeState, ValidationError } from './validators.js'

export async function loadGame(userId) {
  const ch = await prisma.character.findUnique({ where: { userId }, include: { inventory: true } })
  if (!ch) return null
  const inventory = {}
  for (const it of ch.inventory) inventory[it.itemId] = it.quantity
  return {
    look: ch.look,
    level: ch.level,
    x: ch.posX,
    z: ch.posZ,
    // Rebuilt in the shape the client reducer expects (the LOAD action).
    state: { ...ch.state, money: ch.money, inventory },
  }
}

export async function saveGame(userId, state) {
  let clean
  try {
    clean = sanitizeState(state)
  } catch (err) {
    if (err instanceof ValidationError) throw new AppError(400, err.message, 'VALIDATION')
    throw err
  }
  const { look, money, level, inventory, rest } = clean
  await prisma.$transaction(async (tx) => {
    const ch = await tx.character.upsert({
      where: { userId },
      create: { userId, look, money, level, state: rest, posX: SPAWN.x, posZ: SPAWN.z },
      update: { look, money, level, state: rest },
    })
    await tx.inventoryItem.deleteMany({ where: { characterId: ch.id } })
    const rows = Object.entries(inventory).map(([itemId, quantity]) => ({ characterId: ch.id, itemId, quantity }))
    if (rows.length) await tx.inventoryItem.createMany({ data: rows })
  })
  return { level, money, look }
}

export async function loadCharacterForSocket(userId) {
  return prisma.character.findUnique({ where: { userId }, select: { look: true, level: true, posX: true, posZ: true } })
}

export const savePosition = (userId, x, z) =>
  prisma.character.updateMany({ where: { userId }, data: { posX: x, posZ: z } })
