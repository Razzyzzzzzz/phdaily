import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeState, sanitizeMove, cleanChat, validateCredentials, ValidationError } from '../src/services/validators.js'

const look = { skin: '#e0ac69', hair: '#1b1b1b', shirt: '#dc2626', gender: 'female', hairStyle: 2 }
const base = () => ({ player: { name: 'Josh', look }, money: 1500.9, energy: 80, inventory: { rice: 2, bad: 0, 'x y': 3 }, stats: { jobs: 7 }, claimed: {} })

test('sanitizeState splits money / inventory / level and keeps the rest', () => {
  const r = sanitizeState(base())
  assert.equal(r.money, 1500)
  assert.deepEqual(r.inventory, { rice: 2 })
  assert.equal(r.level, 3) // 1 + floor(7/3)
  assert.equal(r.rest.energy, 80)
  assert.equal(r.rest.money, undefined)
  assert.equal(r.rest.inventory, undefined)
  assert.equal(r.look.gender, 'female')
})

test('sanitizeState clamps absurd money and rejects bad looks', () => {
  assert.equal(sanitizeState({ ...base(), money: 9e15 }).money, 1_000_000_000)
  assert.equal(sanitizeState({ ...base(), money: -50 }).money, 0)
  assert.throws(() => sanitizeState({ ...base(), player: { look: { ...look, skin: 'red' } } }), ValidationError)
  assert.throws(() => sanitizeState({}), ValidationError)
  assert.throws(() => sanitizeState('nope'), ValidationError)
})

test('sanitizeMove normalises and rejects junk', () => {
  const ok = sanitizeMove({ x: 99999, z: -5, y: 0.3, ry: 7, sc: 1, walk: 0.5, air: 1, act: 'fish', phase: 'cast' })
  assert.equal(ok.x, 4800); assert.equal(ok.z, 0); assert.ok(ok.ry > -Math.PI && ok.ry <= Math.PI)
  assert.equal(sanitizeMove({ x: NaN, z: 1, y: 0, ry: 0, sc: 1, walk: 0 }), null)
  assert.equal(sanitizeMove(null), null)
  assert.equal(sanitizeMove({ x: 1, z: 1, y: 0, ry: 0, sc: 1, walk: 0, act: '<script>' }).act, null)
})

test('cleanChat strips control chars and caps length', () => {
  assert.equal(cleanChat('  hi\u0000   there\n '), 'hi there')
  assert.equal(cleanChat('   '), null)
  assert.equal(cleanChat(42), null)
  assert.equal(cleanChat('a'.repeat(500)).length, 200)
})

test('validateCredentials', () => {
  assert.doesNotThrow(() => validateCredentials('juan_01', 'secret1'))
  assert.throws(() => validateCredentials('a', 'secret1'), ValidationError)
  assert.throws(() => validateCredentials('juan', '123'), ValidationError)
  assert.throws(() => validateCredentials('juan dela', 'secret1'), ValidationError)
})
