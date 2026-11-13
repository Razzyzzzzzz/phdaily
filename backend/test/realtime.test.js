import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { io as connect } from 'socket.io-client'
import { World } from '../src/services/worldService.js'
import { setupSockets } from '../src/sockets/index.js'

const look = { skin: '#e0ac69', hair: '#1b1b1b', shirt: '#dc2626', gender: 'male', hairStyle: 0 }
const USERS = { 'tok-1': { id: 1, username: 'juan' }, 'tok-2': { id: 2, username: 'maria' } }

async function boot(opts = {}) {
  const saved = []
  const world = new World({ graceMs: 300, persistPosition: async (id, x, z) => saved.push([id, x, z]), ...opts })
  const server = http.createServer()
  setupSockets(server, {
    world,
    isOriginAllowed: () => true,
    authenticate: async (t) => { if (!USERS[t]) { const e = new Error('x'); e.code = 'AUTH'; throw e } return USERS[t] },
    loadCharacter: async () => ({ look, level: 2, posX: 300, posZ: 520 }),
  })
  await new Promise((r) => server.listen(0, r))
  const url = `http://127.0.0.1:${server.address().port}`
  const clients = []
  const client = (token) => {
    const s = connect(url, { auth: { token }, transports: ['websocket'], reconnection: false, forceNew: true })
    s.log = []
    for (const ev of ['world:init', 'player:joined', 'player:left', 'player:presence', 'world:snapshot', 'chat:message', 'player:correct', 'session:replaced'])
      s.on(ev, (d) => s.log.push([ev, d]))
    clients.push(s)
    return s
  }
  const close = async () => { clients.forEach((c) => c.close()); await world.stop(); server.closeAllConnections?.(); await new Promise((r) => server.close(r)) }
  return { world, client, close, saved }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const until = async (fn, ms = 2000) => { const t = Date.now(); while (Date.now() - t < ms) { if (fn()) return true; await wait(15) } throw new Error('timeout waiting for condition') }
const evs = (s, name) => s.log.filter(([n]) => n === name).map(([, d]) => d)
const move = (x, z, extra = {}) => ({ x, z, y: 0, ry: 1, sc: 1, walk: 1, air: 0, act: null, phase: null, ...extra })

test('invalid token is rejected with AUTH', async () => {
  const { client, close } = await boot()
  const s = client('nope')
  const err = await new Promise((r) => s.on('connect_error', r))
  assert.equal(err.message, 'AUTH')
  await close()
})

test('two players see each other, movement syncs, animation fields travel', async () => {
  const { client, close } = await boot()
  const a = client('tok-1'); await until(() => evs(a, 'world:init').length)
  const b = client('tok-2'); await until(() => evs(b, 'world:init').length)
  assert.equal(evs(b, 'world:init')[0].players[0].username, 'juan')      // B sees A on join
  await until(() => evs(a, 'player:joined').length)
  assert.equal(evs(a, 'player:joined')[0].username, 'maria')              // A is told about B
  assert.deepEqual(evs(b, 'world:init')[0].players[0].look, look)         // real character look is shared

  a.volatile.emit('player:state', move(330, 540, { act: 'fish', phase: 'cast' }))
  await until(() => evs(b, 'world:snapshot').length)
  const snap = evs(b, 'world:snapshot')[0].players.find((p) => p.id === 1)
  assert.equal(snap.x, 330); assert.equal(snap.act, 'fish'); assert.equal(snap.phase, 'cast'); assert.equal(snap.walk, 1)
  await close()
})

test('speed hack is corrected, map travel to a known location is allowed', async () => {
  const { client, close } = await boot()
  const a = client('tok-1'); await until(() => evs(a, 'world:init').length)
  a.emit('player:state', move(310, 520)); await wait(60)                  // first packet accepted anywhere
  a.emit('player:state', move(4000, 2000)); await until(() => evs(a, 'player:correct').length)
  assert.ok(Math.abs(evs(a, 'player:correct')[0].x - 310) < 1)
  await wait(60)
  a.emit('player:state', move(4120, 1060)); await wait(120)               // gym location = legit teleport
  const b = client('tok-2'); await until(() => evs(b, 'world:init').length)
  assert.ok(Math.abs(evs(b, 'world:init')[0].players[0].x - 4120) < 1)
  await close()
})

test('chat: broadcast, sanitising, rate limiting, ack', async () => {
  const { client, close } = await boot()
  const a = client('tok-1'); const b = client('tok-2')
  await until(() => evs(a, 'world:init').length && evs(b, 'world:init').length)
  const r1 = await a.emitWithAck('chat:send', '  hello\u0000   world ')
  assert.deepEqual(r1, { ok: true })
  await until(() => evs(b, 'chat:message').length)
  assert.equal(evs(b, 'chat:message')[0].text, 'hello world')
  assert.equal(evs(b, 'chat:message')[0].username, 'juan')
  assert.equal((await a.emitWithAck('chat:send', 'again')).error, 'slow_down')   // < 500 ms
  assert.equal((await b.emitWithAck('chat:send', '   ')).error, 'empty')
  await close()
})

test('reconnect inside grace window keeps the player; after grace they leave', async () => {
  const { client, close, saved } = await boot()
  const a = client('tok-1'); const b = client('tok-2')
  await until(() => evs(a, 'world:init').length && evs(b, 'world:init').length)
  a.emit('player:state', move(500, 600)); await wait(80)
  a.close()
  await until(() => evs(b, 'player:presence').some((p) => p.id === 1 && p.online === false))
  const a2 = client('tok-1')                                              // back within 300 ms grace
  await until(() => evs(a2, 'world:init').length)
  assert.ok(Math.abs(evs(a2, 'world:init')[0].self.x - 500) < 1)          // position preserved
  await until(() => evs(b, 'player:presence').some((p) => p.id === 1 && p.online === true))
  assert.equal(evs(b, 'player:left').length, 0)                           // no flicker for others
  assert.ok(saved.some(([id, x]) => id === 1 && Math.abs(x - 500) < 1))   // position persisted on disconnect
  a2.close()
  await until(() => evs(b, 'player:left').some((p) => p.id === 1), 1500)  // grace expires
  await close()
})

test('second login on another device replaces the first session', async () => {
  const { client, close } = await boot()
  const a = client('tok-1'); await until(() => evs(a, 'world:init').length)
  const a2 = client('tok-1'); await until(() => evs(a2, 'world:init').length)
  await until(() => evs(a, 'session:replaced').length)
  assert.equal(a2.connected, true)
  await close()
})

test('kick (logout) removes the player immediately', async () => {
  const { client, close, world } = await boot()
  const a = client('tok-1'); const b = client('tok-2')
  await until(() => evs(a, 'world:init').length && evs(b, 'world:init').length)
  world.kick(1, 'logout')
  await until(() => evs(b, 'player:left').some((p) => p.id === 1))
  await close()
})
