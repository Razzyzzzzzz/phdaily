import { forwardRef, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Sky, Text } from '@react-three/drei'
import * as THREE from 'three'
import { WW, WH, PLACES, NPCS, LOCATIONS } from './world'

// Simulation runs in the same pixel units as the old 2D game (x, z = old x, y).
// Everything is scaled by S when rendered.
const S = 0.05
const JEEP = [0xef476f, 0x06d6a0, 0xffd166, 0x4cc9f0]
const PARKED = [[1700, 1180, 3, false], [2020, 1260, 1, true], [2260, 1170, 0, false]]
const PALMS = [[140, 900], [320, 900], [820, 900], [1020, 900], [140, 1500], [400, 1560], [760, 1560], [1040, 1500], [300, 1340], [860, 1340]]
const POLES = []
for (let x = 120; x < WW; x += 360) if (!(x > 1180 && x < 1460)) POLES.push(x)

// ---------- collision (px) ----------
const R = 11
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const BOXES = [
  [1560, 820, 2200, 1020], // terminal
  ...PARKED.map(([x, y]) => [x - 58, y - 8 - 27, x + 58, y - 8 + 27]), // parked jeepneys
]
let DYN = [] // moving jeepneys, refreshed every frame
const hitBox = (x, z, [a, b, c, d]) => {
  const cx = clamp(x, a, c), cz = clamp(z, b, d)
  return (x - cx) ** 2 + (z - cz) ** 2 < R * R
}
const CIRCLES = [
  ...PALMS.map(([x, y]) => [x, y - 4, 8]),
  ...POLES.map((x) => [x, 746, 6]),
  [580, 1225, 72], // fountain
]
const blocked = (x, z) => {
  if (x < R || x > WW - R || z < 492 || z > WH - R) return true
  for (const b of BOXES) if (hitBox(x, z, b)) return true
  for (const b of DYN) if (hitBox(x, z, b)) return true
  for (const [cx, cz, r] of CIRCLES) if ((x - cx) ** 2 + (z - cz) ** 2 < (r + R) ** 2) return true
  return false
}
const step = (o, dx, dz) => {
  if (!blocked(o.x + dx, o.z)) o.x += dx
  if (!blocked(o.x, o.z + dz)) o.z += dz
}
// if a moving jeepney ends up on top of someone, move them to the nearest free side
const pushOut = (o) => {
  for (const [a, b, c, d] of DYN) {
    if (o.x > a - R && o.x < c + R && o.z > b - R && o.z < d + R) {
      const l = o.x - (a - R), r = c + R - o.x, t = o.z - (b - R), bt = d + R - o.z
      const m = Math.min(l, r, t, bt)
      if (m === l) o.x = a - R - 1
      else if (m === r) o.x = c + R + 1
      else if (m === t) o.z = b - R - 1
      else o.z = d + R + 1
      o.x = clamp(o.x, R, WW - R)
      o.z = clamp(o.z, 492, WH - R)
    }
  }
}
// is a camera position inside (or touching) a building?
const camHit = (x, y, z) =>
  y < 10.8 && PLACES.some((pl) => x > pl.x * S - 0.4 && x < (pl.x + pl.w) * S + 0.4 && z > (pl.base - 200) * S - 0.4 && z < pl.base * S + 0.4)
const lerpAngle = (a, b, t) => a + ((((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t)

// ---------- tiny helpers ----------
function Box({ p = [0, 0, 0], s = [1, 1, 1], c = '#ffffff', r, cast = true, receive = true, ...rest }) {
  return (
    <mesh position={p} rotation={r} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={s} />
      <meshLambertMaterial color={c} {...rest} />
    </mesh>
  )
}
function Cyl({ p = [0, 0, 0], a = [1, 1, 1, 16], c = '#ffffff', r, ...rest }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <cylinderGeometry args={a} />
      <meshLambertMaterial color={c} {...rest} />
    </mesh>
  )
}
// flat slab on the ground, sizes in px
function Rect({ x, z, w, d, y = 0, h = 0.04, c }) {
  return <Box p={[(x + w / 2) * S, y + h / 2, (z + d / 2) * S]} s={[w * S, h, d * S]} c={c} cast={false} />
}

// ---------- character ----------
export const Character = forwardRef(function Character({ look, label }, ref) {
  const fem = look.gender === 'female'
  const st = look.hairStyle ?? 0
  const body = useRef(), legL = useRef(), legR = useRef(), armL = useRef(), armR = useRef()
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const w = g.userData.walk || 0
    const t = clock.elapsedTime * 10
    const sw = Math.sin(t) * 0.8 * w
    legL.current.rotation.x = sw; legR.current.rotation.x = -sw
    armL.current.rotation.x = -sw; armR.current.rotation.x = sw
    body.current.position.y = Math.abs(Math.sin(t)) * 0.12 * w
  })
  const pants = fem ? look.skin : '#333a4a'
  const hairMat = { side: THREE.DoubleSide }
  return (
    <group ref={ref}>
      <group ref={body}>
        {/* legs */}
        {[[legL, -0.23], [legR, 0.23]].map(([lr, x]) => (
          <group key={x} ref={lr} position={[x, 1.2, 0]}>
            <Box p={[0, -0.6, 0]} s={[0.38, 1.2, 0.42]} c={pants} />
            <Box p={[0, -1.1, 0.1]} s={[0.42, 0.22, 0.62]} c="#111111" />
          </group>
        ))}
        {/* torso */}
        {fem ? (
          <>
            <Box p={[0, 1.88, 0]} s={[0.8, 0.95, 0.5]} c={look.shirt} />
            <Cyl p={[0, 1.3, 0]} a={[0.42, 0.7, 0.62, 18]} c={look.shirt} />
          </>
        ) : (
          <Box p={[0, 1.78, 0]} s={[1.0, 1.15, 0.55]} c={look.shirt} />
        )}
        {/* arms */}
        {[[armL, -1], [armR, 1]].map(([ar, d]) => (
          <group key={d} ref={ar} position={[d * (fem ? 0.53 : 0.65), 2.3, 0]}>
            <Box p={[0, -0.22, 0]} s={[0.3, 0.46, 0.34]} c={look.shirt} />
            <Box p={[0, -0.68, 0]} s={[0.26, 0.5, 0.3]} c={look.skin} />
          </group>
        ))}
        {/* head */}
        <group position={[0, 2.95, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.55, 20, 16]} />
            <meshLambertMaterial color={look.skin} />
          </mesh>
          <mesh position={[-0.2, 0.05, 0.5]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#111111" /></mesh>
          <mesh position={[0.2, 0.05, 0.5]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#111111" /></mesh>
          {fem && (
            <>
              <mesh position={[-0.3, -0.15, 0.45]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#f472b6" transparent opacity={0.6} /></mesh>
              <mesh position={[0.3, -0.15, 0.45]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#f472b6" transparent opacity={0.6} /></mesh>
            </>
          )}
          {/* hair */}
          <mesh castShadow rotation={[-0.55, 0, 0]} position={[0, 0.02, -0.04]} scale={st === 1 ? [1, 0.95, 1] : 1}>
            <sphereGeometry args={[st === 1 ? 0.7 : 0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color={look.hair} {...hairMat} />
          </mesh>
          {st === 2 && <Box p={[0, -0.75, -0.38]} s={[1.05, 1.9, 0.38]} c={look.hair} />}
          {fem && st !== 2 && (
            <>
              <Box p={[-0.5, -0.35, -0.08]} s={[0.2, 0.9, 0.38]} c={look.hair} />
              <Box p={[0.5, -0.35, -0.08]} s={[0.2, 0.9, 0.38]} c={look.hair} />
            </>
          )}
        </group>
      </group>
      {label && (
        <Billboard position={[0, 4.5, 0]}>
          <Text fontSize={0.5} color="#ffffff" outlineWidth={0.07} outlineColor="#1e3a8a" anchorX="center" anchorY="middle">{label}</Text>
        </Billboard>
      )}
    </group>
  )
})

// ---------- world pieces ----------
function Building({ p }) {
  const zf = p.base * S
  const cx = (p.x + p.w / 2) * S
  return (
    <group>
      <Box p={[cx, 4.5, zf - 5]} s={[p.w * S, 9, 10]} c={p.color} />
      <Box p={[cx, 9.3, zf - 4.75]} s={[(p.w + 20) * S, 1.4, 10.5]} c={p.roof} />
      <Text position={[cx, 9.3, zf + 0.52]} fontSize={0.95} color="#ffffff" outlineWidth={0.05} outlineColor="#00000055" anchorX="center" anchorY="middle">{p.label}</Text>
      {[p.x + 28, p.x + p.w - 98].map((wx) => {
        const wcx = (wx + 35) * S
        return (
          <group key={wx}>
            <Box p={[wcx, 6.25, zf + 0.05]} s={[78 * S, 3.1, 0.1]} c="#ffffff" />
            <Box p={[wcx, 6.25, zf + 0.1]} s={[70 * S, 2.7, 0.1]} c="#bfe9ff" />
            <Box p={[wcx, 6.25, zf + 0.15]} s={[4 * S, 2.7, 0.08]} c="#ffffff" />
            <Box p={[wcx, 6.3, zf + 0.15]} s={[70 * S, 4 * S, 0.08]} c="#ffffff" />
          </group>
        )
      })}
      <Box p={[p.door * S, 2.6, zf + 0.12]} s={[3, 5.2, 0.3]} c="#4a2c17" />
      <mesh position={[(p.door + 20) * S, 2.6, zf + 0.35]}><sphereGeometry args={[0.15, 8, 8]} /><meshLambertMaterial color="#fcd116" /></mesh>
      {p.awning && (
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <Box key={i} p={[(p.door - 100 + i * 20 + 10) * S, 5.2, zf + 0.95]} s={[1, 0.12, 1.9]} r={[0.3, 0, 0]} c={i % 2 ? '#ffffff' : '#d62828'} />
          ))}
          <Box p={[(p.door - 100) * S, 2.4, zf + 1.7]} s={[0.15, 4.8, 0.15]} c="#4b5563" />
          <Box p={[(p.door + 100) * S, 2.4, zf + 1.7]} s={[0.15, 4.8, 0.15]} c="#4b5563" />
        </>
      )}
      {/* yellow entrance marker */}
      <Box p={[p.door * S, p.base < 600 ? 0.17 : 0.09, (p.base + 27) * S]} s={[1.8, 0.02, 0.5]} c="#fcd116" cast={false} />
    </group>
  )
}

function Palm({ x, z }) {
  return (
    <group position={[x * S, 0, z * S]}>
      <Cyl p={[0, 4.25, 0]} a={[0.25, 0.4, 8.5, 10]} c="#7c4a21" />
      <group position={[0, 8.5, 0]}>
        {Array.from({ length: 7 }, (_, k) => (
          <group key={k} rotation={[0, (k * Math.PI * 2) / 7, 0]}>
            <mesh position={[1.7, -0.15, 0]} rotation={[0, 0, -0.45]} scale={[1, 0.12, 0.42]} castShadow>
              <sphereGeometry args={[1.9, 10, 8]} />
              <meshLambertMaterial color="#2f9e44" />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.25, -0.3, 0]}><sphereGeometry args={[0.28, 8, 8]} /><meshLambertMaterial color="#7c4a21" /></mesh>
        <mesh position={[0.25, -0.3, 0.1]}><sphereGeometry args={[0.28, 8, 8]} /><meshLambertMaterial color="#7c4a21" /></mesh>
      </group>
    </group>
  )
}

function Bench({ x, z }) {
  return (
    <group position={[x * S, 0, z * S]}>
      <Box p={[0, 1.2, 0]} s={[4, 0.35, 1.4]} c="#8b5a2b" />
      <Box p={[0, 2.1, -0.6]} s={[4, 0.9, 0.25]} c="#8b5a2b" />
      <Box p={[-1.7, 0.6, 0]} s={[0.3, 1.2, 1.2]} c="#4a2c17" />
      <Box p={[1.7, 0.6, 0]} s={[0.3, 1.2, 1.2]} c="#4a2c17" />
    </group>
  )
}

function Fountain({ x, z }) {
  return (
    <group position={[x * S, 0, z * S]}>
      <Cyl p={[0, 0.7, 0]} a={[3.5, 3.6, 1.4, 28]} c="#bdb8b4" />
      <Cyl p={[0, 1.4, 0]} a={[3.2, 3.2, 0.06, 28]} c="#38bdf8" />
      <Cyl p={[0, 2.6, 0]} a={[0.5, 0.6, 3.2, 12]} c="#bdb8b4" />
      <Cyl p={[0, 4.2, 0]} a={[1.8, 1.0, 0.5, 20]} c="#bdb8b4" />
      <mesh position={[0, 4.9, 0]}><sphereGeometry args={[0.5, 12, 12]} /><meshLambertMaterial color="#bae6fd" /></mesh>
    </group>
  )
}

function Jeep({ color }) {
  return (
    <group>
      <Box p={[0, 0.95, 0]} s={[5.6, 1, 2.6]} c={color} />
      <Box p={[0, 0.75, 0]} s={[5.62, 0.18, 2.62]} c="#fcd116" />
      <Box p={[0, 1.73, 0]} s={[4.7, 0.55, 2.4]} c="#bfe9ff" />
      {[-2, -0.7, 0.7, 2].map((x) => <Box key={x} p={[x, 1.73, 0]} s={[0.14, 0.56, 2.5]} c={color} />)}
      <Box p={[0, 2.06, 0]} s={[4.9, 0.14, 2.7]} c={color} />
      <Box p={[2.82, 0.95, 0.8]} s={[0.1, 0.3, 0.4]} c="#fff3a0" />
      <Box p={[2.82, 0.95, -0.8]} s={[0.1, 0.3, 0.4]} c="#fff3a0" />
      {[[-1.9, 1.25], [1.9, 1.25], [-1.9, -1.25], [1.9, -1.25]].map(([x, z]) => (
        <group key={x + '_' + z} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
          <Cyl a={[0.5, 0.5, 0.32, 14]} c="#111111" />
          <Cyl a={[0.2, 0.2, 0.34, 10]} c="#9ca3af" />
        </group>
      ))}
    </group>
  )
}

function Ground() {
  const dashesH = []
  for (let x = 0; x < WW; x += 90) if (x < 1200 || x > 1440) dashesH.push(x)
  const dashesV = []
  for (let y = 770; y < WH; y += 90) dashesV.push(y)
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(WW * S) / 2, -0.01, (WH * S) / 2]} receiveShadow>
        <planeGeometry args={[700, 700]} />
        <meshLambertMaterial color="#86c66b" />
      </mesh>
      {/* park + paths + concrete lot */}
      <Rect x={60} z={800} w={1120} d={840} h={0.02} c="#5fae5a" />
      <Rect x={60} z={1180} w={1120} d={80} h={0.04} c="#e7d3a7" />
      <Rect x={540} z={800} w={80} d={840} h={0.04} c="#e7d3a7" />
      <Rect x={1440} z={1020} w={WW - 1440} d={600} h={0.08} c="#cfc8bb" />
      {/* sidewalks */}
      <Rect x={0} z={480} w={WW} d={60} h={0.16} c="#d6d3d1" />
      <Rect x={0} z={700} w={1240} d={60} h={0.16} c="#d6d3d1" />
      <Rect x={1400} z={700} w={WW - 1400} d={60} h={0.16} c="#d6d3d1" />
      <Rect x={1200} z={760} w={40} d={WH - 760} h={0.16} c="#d6d3d1" />
      <Rect x={1400} z={760} w={40} d={WH - 760} h={0.16} c="#d6d3d1" />
      {/* roads */}
      <Rect x={0} z={540} w={WW} d={160} h={0.06} c="#4b5563" />
      <Rect x={1240} z={700} w={160} d={WH - 700} h={0.06} c="#4b5563" />
      {dashesH.map((x) => <Rect key={'h' + x} x={x} z={618} w={48} d={8} y={0.06} h={0.02} c="#fcd116" />)}
      {dashesV.map((y) => <Rect key={'v' + y} x={1316} z={y} w={8} d={48} y={0.06} h={0.02} c="#fcd116" />)}
    </group>
  )
}

function Backdrop() {
  const mountains = []
  for (let x = -40; x < WW * S + 40; x += 16) mountains.push(x)
  const skyline = Array.from({ length: Math.ceil(WW / 70) }, (_, i) => i * 70)
  return (
    <group>
      {mountains.map((x, i) => (
        <mesh key={x} position={[x, 5 + (i % 3) * 1.5, -14]}>
          <coneGeometry args={[11, 10 + (i % 3) * 3, 5]} />
          <meshLambertMaterial color="#7fb7a4" />
        </mesh>
      ))}
      {skyline.map((x) => {
        const h = (50 + ((x * 13) % 90)) * S * 2
        return <Box key={x} p={[(x + 28) * S, h / 2, 5]} s={[2.8, h, 3]} c="#9db4cc" cast={false} receive={false} />
      })}
    </group>
  )
}

function Clouds() {
  const g = useRef()
  useFrame((_, dt) => g.current.children.forEach((c) => { c.position.x += dt * 0.8; if (c.position.x > 190) c.position.x = -70 }))
  return (
    <group ref={g}>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[i * 28 - 60, 32 + (i % 3) * 3, -10 + ((i * 37) % 90)]}>
          <mesh scale={[5, 1.6, 2.6]}><sphereGeometry args={[1, 12, 8]} /><meshLambertMaterial color="#ffffff" transparent opacity={0.92} /></mesh>
          <mesh position={[2.4, 0.9, 0]} scale={[3.2, 1.4, 2.2]}><sphereGeometry args={[1, 12, 8]} /><meshLambertMaterial color="#ffffff" transparent opacity={0.92} /></mesh>
          <mesh position={[-2.6, 0.5, 0.4]} scale={[3, 1.2, 2]}><sphereGeometry args={[1, 12, 8]} /><meshLambertMaterial color="#ffffff" transparent opacity={0.92} /></mesh>
        </group>
      ))}
    </group>
  )
}

// ---------- main scene ----------
export default function Scene3D({ bridge, look }) {
  const { camera, gl } = useThree()
  const light = useRef()
  const player = useRef()
  const npcRefs = useRef(NPCS.map(() => ({ current: null })))
  const jeepRefs = useRef([])
  const ps = useRef({ x: 300, z: 520, face: 0 })
  const npcState = useRef(NPCS.map((n) => ({ x: n.x, z: n.y, hx: n.x, hz: n.y, vx: 0, vz: 0, think: Math.random() * 1.8, stop: 0, face: 0 })))
  const vehicles = useRef([[0, 610, -1], [1, 680, 1], [2, 640, -1]].map(([i, z, d], n) => ({ i, z, d, x: 300 + n * 800, speed: d * (60 + n * 15) })))
  const keys = useRef(new Set())
  const cam = useRef({ yaw: 0, dist: 12, px: 300, pz: 520, snap: true })
  const near = useRef({ key: null, best: null })

  const interact = () => {
    if (bridge.paused || !near.current.best) return
    bridge.onInteract?.(near.current.best)
  }

  useEffect(() => {
    bridge.doInteract = interact
    bridge.teleport = (id) => {
      const [x, z] = LOCATIONS[id]
      ps.current.x = x; ps.current.z = z
      cam.current.snap = true
    }
    const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')
    const down = (e) => {
      if (typing(e)) return
      const k = e.key.toLowerCase()
      keys.current.add(k)
      if (k === 'e' && !e.repeat) interact()
    }
    const up = (e) => keys.current.delete(e.key.toLowerCase())
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)

    // drag to rotate camera, wheel to zoom
    const el = gl.domElement
    let drag = null
    const pd = (e) => { drag = { x: e.clientX, id: e.pointerId } }
    const pm = (e) => {
      if (!drag || drag.id !== e.pointerId) return
      cam.current.yaw -= (e.clientX - drag.x) * 0.006
      drag.x = e.clientX
    }
    const pu = () => { drag = null }
    const wheel = (e) => { cam.current.dist = clamp(cam.current.dist + e.deltaY * 0.01, 7, 20) }
    el.addEventListener('pointerdown', pd)
    el.addEventListener('pointermove', pm)
    el.addEventListener('pointerup', pu)
    el.addEventListener('pointercancel', pu)
    el.addEventListener('wheel', wheel, { passive: true })
    return () => {
      bridge.doInteract = null
      bridge.teleport = null
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      el.removeEventListener('pointerdown', pd)
      el.removeEventListener('pointermove', pm)
      el.removeEventListener('pointerup', pu)
      el.removeEventListener('pointercancel', pu)
      el.removeEventListener('wheel', wheel)
    }
  }, [])

  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05)
    const c = cam.current, p = ps.current, k = keys.current
    const vec = bridge.vec || { x: 0, y: 0 }

    // moving jeepneys are solid
    DYN = vehicles.current.map((v) => [v.x - 58, v.z - 27, v.x + 58, v.z + 27])
    pushOut(p)
    npcState.current.forEach(pushOut)

    // ----- player input (camera-relative) -----
    let ix = 0, iy = 0
    if (!bridge.paused) {
      ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + (Math.abs(vec.x) > 0.15 ? vec.x : 0)
      iy = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + (Math.abs(vec.y) > 0.15 ? vec.y : 0)
    }
    let len = Math.hypot(ix, iy)
    if (len > 1) { ix /= len; iy /= len; len = 1 }
    const sn = Math.sin(c.yaw), cs = Math.cos(c.yaw)
    const mx = ix * cs + iy * sn
    const mz = -ix * sn + iy * cs
    step(p, mx * 165 * dt, mz * 165 * dt)
    const moving = len > 0.1
    if (moving) p.face = lerpAngle(p.face, Math.atan2(mx, mz), 1 - Math.exp(-12 * dt))
    const pg = player.current
    pg.userData.walk = (pg.userData.walk || 0) + ((moving ? 1 : 0) - (pg.userData.walk || 0)) * Math.min(1, dt * 12)
    pg.position.set(p.x * S, 0, p.z * S)
    pg.rotation.y = p.face

    // ----- NPCs -----
    npcState.current.forEach((n, i) => {
      n.think -= dt
      if (n.think <= 0) {
        n.think = 1.8
        if (Math.random() < 0.4) { n.vx = 0; n.vz = 0; n.stop = 0 } else {
          const far = Math.hypot(n.x - n.hx, n.z - n.hz) > 70
          const a = far ? Math.atan2(n.hz - n.z, n.hx - n.x) : Math.random() * Math.PI * 2
          n.vx = Math.cos(a) * 40; n.vz = Math.sin(a) * 40; n.stop = 1
        }
      }
      if (n.stop > 0) { n.stop -= dt; if (n.stop <= 0) { n.vx = 0; n.vz = 0 } }
      step(n, n.vx * dt, n.vz * dt)
      const mv = n.vx !== 0 || n.vz !== 0
      if (mv) n.face = lerpAngle(n.face, Math.atan2(n.vx, n.vz), 1 - Math.exp(-10 * dt))
      const g = npcRefs.current[i].current
      if (!g) return
      g.userData.walk = (g.userData.walk || 0) + ((mv ? 1 : 0) - (g.userData.walk || 0)) * Math.min(1, dt * 12)
      g.position.set(n.x * S, 0, n.z * S)
      g.rotation.y = n.face
    })

    // ----- moving jeepneys -----
    vehicles.current.forEach((v, i) => {
      // wait for anyone crossing in front of the jeepney
      const [f1, f2] = v.d > 0 ? [v.x + 50, v.x + 130] : [v.x - 130, v.x - 50]
      const blockedAhead = [p, ...npcState.current].some((q) => q.x > f1 && q.x < f2 && Math.abs(q.z - v.z) < 27 + R + 6)
      if (!blockedAhead) v.x += v.speed * dt
      if (v.x > WW + 100) v.x = -100
      if (v.x < -100) v.x = WW + 100
      const g = jeepRefs.current[i]
      if (g) { g.position.set(v.x * S, 0, v.z * S); g.rotation.y = v.d > 0 ? 0 : Math.PI }
    })

    // ----- nearest interactable -----
    let best = null, bd = 70
    PLACES.forEach((pl) => {
      const d = Math.hypot(p.x - pl.door, p.z - (pl.base + 28))
      if (d < bd) { bd = d; best = { type: 'place', id: pl.id, label: pl.label } }
    })
    NPCS.forEach((n, i) => {
      const s = npcState.current[i]
      const d = Math.hypot(p.x - s.x, p.z - s.z)
      if (d < Math.min(bd, 60)) { bd = d; best = { type: 'npc', id: n.id, label: 'Talk to ' + n.name, name: n.name, line: n.line, shop: n.shop } }
    })
    const key = best && best.type + best.id
    if (key !== near.current.key) {
      near.current = { key, best }
      bridge.onNearby?.(best && { type: best.type, id: best.id, label: best.label })
    }

    // data for the minimap
    bridge.mini = {
      x: p.x, z: p.z, face: p.face,
      jeeps: vehicles.current.map((v) => ({ x: v.x, z: v.z, i: v.i })),
      npcs: npcState.current.map((n) => ({ x: n.x, z: n.z })),
    }

    // ----- third-person camera -----
    const tx = p.x * S, tz = p.z * S
    if (c.snap) { c.px = tx; c.pz = tz; c.snap = false } else {
      const t = 1 - Math.exp(-8 * dt)
      c.px += (tx - c.px) * t; c.pz += (tz - c.pz) * t
    }
    const D = c.dist, H = D * 0.5 + 1.5
    const ox = Math.sin(c.yaw) * D, oz = Math.cos(c.yaw) * D, oy = H - 2.2
    // pull the camera toward the player so it never goes inside a building
    let f = 1
    while (f > 0.25 && camHit(c.px + ox * f, 2.2 + oy * f, c.pz + oz * f)) f -= 0.05
    if (c.f === undefined) c.f = 1
    c.f = f < c.f ? f : c.f + (f - c.f) * (1 - Math.exp(-6 * dt))
    camera.position.set(c.px + ox * c.f, 2.2 + oy * c.f, c.pz + oz * c.f)
    camera.lookAt(c.px, 2.2, c.pz)

    // sun + shadows follow the player
    if (light.current) {
      light.current.position.set(c.px + 25, 40, c.pz + 18)
      light.current.target.position.set(c.px, 0, c.pz)
      light.current.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <Sky distance={450} sunPosition={[100, 60, -50]} turbidity={4} rayleigh={1.5} />
      <fog attach="fog" args={['#d9efff', 90, 220]} />
      <hemisphereLight args={['#ffffff', '#6aa84f', 0.85]} />
      <directionalLight
        ref={light} castShadow intensity={1.5}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
        shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={32} shadow-camera-bottom={-32}
        shadow-camera-near={1} shadow-camera-far={120}
      />

      <Ground />
      <Backdrop />
      <Clouds />
      {PLACES.map((p) => <Building key={p.id} p={p} />)}

      {/* park */}
      {PALMS.map(([x, z]) => <Palm key={x + '_' + z} x={x} z={z} />)}
      <Bench x={430} z={1180} />
      <Bench x={730} z={1285} />
      <Fountain x={580} z={1225} />
      <group position={[580 * S, 0, 806 * S]}>
        <Box p={[-3, 1.5, 0]} s={[0.4, 3, 0.4]} c="#8b5a2b" />
        <Box p={[3, 1.5, 0]} s={[0.4, 3, 0.4]} c="#8b5a2b" />
        <Box p={[0, 3.4, 0]} s={[8, 1.7, 0.25]} c="#8b5a2b" />
        <Text position={[0, 3.4, 0.16]} fontSize={0.9} color="#ffffff" anchorX="center" anchorY="middle">Parke</Text>
      </group>

      {/* street lights */}
      {POLES.map((x) => (
        <group key={x} position={[x * S, 0, 750 * S]}>
          <Cyl p={[0, 3.75, 0]} a={[0.15, 0.22, 7.5, 8]} c="#374151" />
          <mesh position={[0, 7.7, 0]}><sphereGeometry args={[0.45, 12, 12]} /><meshBasicMaterial color="#fff3a0" /></mesh>
        </group>
      ))}

      {/* traffic + parked jeepneys */}
      {vehicles.current.map((v, i) => (
        <group key={i} ref={(g) => (jeepRefs.current[i] = g)}><Jeep color={JEEP[v.i]} /></group>
      ))}
      {PARKED.map(([x, z, i, f]) => (
        <group key={x} position={[x * S, 0, z * S - 0.4]} rotation={[0, f ? Math.PI : 0, 0]}><Jeep color={JEEP[i]} /></group>
      ))}

      {/* people */}
      <Character ref={player} look={look} />
      {NPCS.map((n, i) => <Character key={n.id} ref={npcRefs.current[i]} look={n.look} label={n.name} />)}
    </>
  )
}