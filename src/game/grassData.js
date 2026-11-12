import * as THREE from 'three'
import { WW, WH, PLACES, ROAD2, POND } from './world'

// ---------- 6 magkakaibang disenyo ng damo ----------
// n = bilang ng talim, h = taas, hv = pagkakaiba ng taas, w = lapad, spread = lawak ng ugat,
// lean = tagilid palabas, fan = nakahilera (pamaypay), head = may bunga/uhay sa dulo
export const TYPES = [
  { name: 'spiky',  n: 9,  h: 0.55, hv: 0.35, w: 0.07,  spread: 0.12, lean: 0.22, base: '#2f7d32', tip: '#8fd14f' },
  { name: 'tall',   n: 6,  h: 1.05, hv: 0.3,  w: 0.06,  spread: 0.1,  lean: 0.38, base: '#4d8f3a', tip: '#c9e27a' },
  { name: 'bushy',  n: 16, h: 0.3,  hv: 0.4,  w: 0.09,  spread: 0.22, lean: 0.16, base: '#2a7a3b', tip: '#6fc46a' },
  { name: 'fan',    n: 7,  h: 0.7,  hv: 0.25, w: 0.1,   spread: 0.22, lean: 0.3,  base: '#3b8f48', tip: '#a6e08a', fan: true },
  { name: 'wheat',  n: 5,  h: 1.0,  hv: 0.25, w: 0.045, spread: 0.1,  lean: 0.18, base: '#5a8f3a', tip: '#a9c85a', head: '#d6b04a', hr: 0.06, hl: 0.24 },
  { name: 'clover', n: 10, h: 0.12, hv: 0.3,  w: 0.14,  spread: 0.25, lean: 0.3,  base: '#2f8a45', tip: '#7ad077' },
]
// tint (multiplier) bawat patch para magkakaiba ang kulay: berde, lime, ginto-berde, malamig na berde...
export const TINTS = [[1, 1, 1], [1.1, 1.08, 0.8], [1.15, 1.05, 0.7], [0.78, 0.95, 0.82], [0.9, 1.05, 0.95], [1.05, 1.12, 0.95]]

// bawat patch ay may "style": [uri, bigat] at mga tint na puwedeng gamitin
const STYLES = [
  { types: [[2, 4], [3, 3], [0, 2], [5, 3]], tints: [0, 3] },   // lush
  { types: [[0, 3], [1, 3], [4, 2], [3, 1]], tints: [1, 4] },   // meadow
  { types: [[4, 4], [1, 3], [0, 1]], tints: [2, 1] },           // golden
  { types: [[5, 4], [2, 2], [3, 2]], tints: [0, 5] },           // lawn
]

// ---------- geometry ng isang tuft (mga talim, 2 segment, may gradient na kulay) ----------
export function tuftGeo(o, seed) {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const pos = [], col = []
  const c1 = new THREE.Color(o.base), c2 = new THREE.Color(o.tip), cm = c1.clone().lerp(c2, 0.55), ch = new THREE.Color(o.head || '#d6b04a')
  const tri = (a, ca, b, cb, c, cc) => {
    for (const [p, k] of [[a, ca], [b, cb], [c, cc]]) { pos.push(p[0], p[1], p[2]); col.push(k.r, k.g, k.b) }
  }
  for (let i = 0; i < o.n; i++) {
    let rx, rz, dx, dz
    if (o.fan) {
      const t = o.n === 1 ? 0 : (i / (o.n - 1)) * 2 - 1
      rx = t * o.spread; rz = (rnd() - 0.5) * 0.04; dx = t; dz = (rnd() - 0.5) * 0.5 + 0.12
    } else {
      const a = (i / o.n) * Math.PI * 2 + rnd() * 0.8, r = o.spread * (0.3 + 0.7 * rnd())
      rx = Math.cos(a) * r; rz = Math.sin(a) * r; dx = Math.cos(a); dz = Math.sin(a)
    }
    const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl
    const h = o.h * (1 - o.hv * rnd()), lean = o.lean * (0.5 + rnd() * 0.7), w = o.w * (0.8 + rnd() * 0.4)
    const tx = -dz, tz = dx
    const v = 0.92 + rnd() * 0.16
    const cb = c1.clone().multiplyScalar(v), cmid = cm.clone().multiplyScalar(v), ct = c2.clone().multiplyScalar(v)
    const bL = [rx - (tx * w) / 2, 0, rz - (tz * w) / 2], bR = [rx + (tx * w) / 2, 0, rz + (tz * w) / 2]
    const mx = rx + dx * lean * 0.35, mz = rz + dz * lean * 0.35, my = h * 0.55
    const mL = [mx - tx * w * 0.35, my, mz - tz * w * 0.35], mR = [mx + tx * w * 0.35, my, mz + tz * w * 0.35]
    const tip = [rx + dx * lean, h, rz + dz * lean]
    tri(bL, cb, bR, cb, mL, cmid)
    tri(bR, cb, mR, cmid, mL, cmid)
    tri(mL, cmid, mR, cmid, tip, ct)
    if (o.head) { // uhay / bunga sa dulo
      const hc = [tip[0], tip[1] + o.hl * 0.35, tip[2]], top = [hc[0], hc[1] + o.hl * 0.65, hc[2]], bot = [hc[0], hc[1] - o.hl * 0.35, hc[2]]
      const ring = [[hc[0] + o.hr, hc[1], hc[2]], [hc[0], hc[1], hc[2] + o.hr], [hc[0] - o.hr, hc[1], hc[2]], [hc[0], hc[1], hc[2] - o.hr]]
      for (let k = 0; k < 4; k++) {
        const a = ring[k], b = ring[(k + 1) % 4]
        tri(a, ch, b, ch, top, ch)
        tri(b, ch, a, ch, bot, ch)
      }
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

// ---------- saan puwedeng tumubo ang damo (px) ----------
const CELL = 11 // pinakamaliit na layo ng dalawang tuft -> malinis, hindi magkapatong
export function buildLayout({ palms = [], poles = [], benches = [], parked = [], touch = false }) {
  let s = 424242
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const free = (x, z) => {
    if (x < 40 || x > WW - 40 || z < 790 || z > WH - 40) return false
    if (x > 1190 && x < 1450) return false                              // pangunahing kalsada (patayo) + bangketa
    if (z > ROAD2.y - 55 && z < ROAD2.y + ROAD2.h + 55) return false   // ikalawang kalsada + bangketa
    if (z > 2150 && z < 2230) return false                              // bangketa sa timog
    if (x > 1420 && z > 1000 && z < 1640) return false                  // konkretong lote (terminal)
    if (x < 1200 && z > 1165 && z < 1275) return false                  // daanan sa parke (pahalang)
    if (x > 525 && x < 635 && z > 790 && z < 1650) return false         // daanan sa parke (patayo)
    if (x > 2130 && x < 2670 && z > 2215 && z < 2665) return false      // south plaza
    for (const p of PLACES) if (x > p.x - 30 && x < p.x + p.w + 30 && z > p.base - 230 && z < p.base + 30) return false
    if (x > POND.x - 45 && x < POND.x + POND.w + 45 && z > POND.z - 45 && z < POND.z + POND.d + 45) return false
    for (const [px, pz] of palms) if (Math.hypot(x - px, z - pz) < 28) return false
    for (const [px, pz] of poles) if (Math.hypot(x - px, z - pz) < 22) return false
    for (const [a, b, c, d] of benches) if (x > a - 28 && x < c + 28 && z > b - 28 && z < d + 28) return false
    for (const [px, pz] of parked) if (x > px - 75 && x < px + 75 && z > pz - 45 && z < pz + 45) return false
    return true
  }
  const MAX = touch ? 2400 : 4200
  const out = TYPES.map(() => [])
  const occ = new Set()
  let total = 0
  const add = (x, z, type, tint) => {
    if (total >= MAX || !free(x, z)) return false
    const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL)
    if (occ.has(k)) return false
    occ.add(k)
    const big = 0.75 + rnd() * 0.6
    out[type].push([x, z, rnd() * Math.PI * 2, big * (0.9 + rnd() * 0.2), big * (0.8 + rnd() * 0.45), tint, 0.93 + rnd() * 0.14])
    total++
    return true
  }
  const pick = (list) => {
    let t = rnd() * list.reduce((a, [, w]) => a + w, 0)
    for (const [v, w] of list) if ((t -= w) <= 0) return v
    return list[0][0]
  }

  // 1) mga patch: matataas sa gitna, mababa sa gilid; bawat patch iba ang style at kulay
  const PATCHES = touch ? 70 : 110
  for (let i = 0; i < PATCHES; i++) {
    const st = STYLES[(i + Math.floor(rnd() * 4)) % STYLES.length]
    const tint = st.tints[Math.floor(rnd() * st.tints.length)]
    const inPark = rnd() < 0.4 // mas luntian ang parke
    const cx = inPark ? 70 + rnd() * 1100 : 40 + rnd() * (WW - 80)
    const cz = inPark ? 810 + rnd() * 820 : 800 + rnd() * (WH - 840)
    const R = 50 + rnd() * 90, ex = 0.7 + rnd() * 0.6, ez = 0.7 + rnd() * 0.6
    const want = Math.round(R * R * 0.0042 * (0.7 + rnd() * 0.7))
    let got = 0
    for (let j = 0; j < want * 2 && got < want; j++) {
      const a = rnd() * Math.PI * 2, d = R * Math.sqrt(rnd())
      if (rnd() < (d / R) ** 2 * 0.6) continue // pinipino ang gilid
      let type = pick(st.types)
      if (d / R > 0.65 && rnd() < 0.6) type = rnd() < 0.5 ? 5 : 2 // maikli sa gilid
      if (add(cx + Math.cos(a) * d * ex, cz + Math.sin(a) * d * ez, type, tint)) got++
    }
  }
  // 2) kalat-kalat na paisa-isa sa buong mapa (hindi lang sa iisang lugar)
  const singles = touch ? 900 : 1800
  for (let i = 0; i < singles; i++) {
    const st = STYLES[Math.floor(rnd() * STYLES.length)]
    add(40 + rnd() * (WW - 80), 790 + rnd() * (WH - 830), pick([[5, 3], [2, 3], [0, 2], [3, 1]]), st.tints[Math.floor(rnd() * st.tints.length)])
  }
  return out
}