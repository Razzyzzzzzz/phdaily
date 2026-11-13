import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'
import { validateCredentials, ValidationError } from './validators.js'

// Compared against when the username does not exist, so response time does not reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.bcryptRounds)

const sign = (u) => jwt.sign({ sub: String(u.id), v: u.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
const publicUser = (u) => ({ id: u.id, username: u.username })

async function describe(user) {
  const hasCharacter = (await prisma.character.count({ where: { userId: user.id } })) > 0
  return { user: publicUser(user), hasCharacter }
}

export async function register(username, password) {
  console.log('[register]', username) // TEMP: remove after debugging
  try {
    validateCredentials(username, password)
  } catch (err) {
    if (err instanceof ValidationError) throw new AppError(400, err.message, 'VALIDATION')
    throw err
  }
  try {
    const passwordHash = await bcrypt.hash(password, env.bcryptRounds)
    const user = await prisma.user.create({ data: { username, passwordHash, lastLoginAt: new Date() } })
    return { token: sign(user), user: publicUser(user), hasCharacter: false }
  } catch (err) {
    if (err?.code === 'P2002') throw new AppError(409, 'That username is already taken.', 'USERNAME_TAKEN')
    throw err
  }
}

export async function login(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') throw new AppError(400, 'Username and password are required.', 'VALIDATION')
  const user = await prisma.user.findUnique({ where: { username } })
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH)
  if (!user || !ok) throw new AppError(401, 'Wrong username or password.', 'BAD_CREDENTIALS')
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  return { token: sign(user), ...(await describe(user)) }
}

// Invalidates every token issued so far for this account.
export async function logout(userId) {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
}

export async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(401, 'Session expired. Please log in again.', 'AUTH')
  return describe(user)
}

// Shared by the HTTP middleware and the Socket.IO handshake.
export async function authenticate(token) {
  const fail = () => new AppError(401, 'Session expired. Please log in again.', 'AUTH')
  if (!token || typeof token !== 'string') throw fail()
  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw fail()
  }
  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) }, select: { id: true, username: true, tokenVersion: true } })
  if (!user || user.tokenVersion !== payload.v) throw fail()
  return { id: user.id, username: user.username }
}