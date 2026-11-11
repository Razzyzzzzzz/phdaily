import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Character } from '../game/Scene3D'
import Joystick from './Joystick'
import { fmtTime } from '../data/gameData'

const CSS = `
@keyframes house-z{0%{transform:translateY(0) scale(.7);opacity:0}30%{opacity:1}100%{transform:translateY(-90px) scale(1.5);opacity:0}}
@keyframes house-bar{from{width:0}to{width:100%}}
@keyframes house-tw{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes house-rise{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
`

// ---------- layout data ----------
// Room: x -12..12, z -8..8 (back wall at z = -8, left wall at x = -12). Furniture rotates in quarter turns (r).
const CAT = {
  bed: { w: 4.6, d: 6.6, solid: true },
  sofa: { w: 6, d: 2.6, solid: true },
  tv: { w: 4, d: 1.6, solid: true },
  cabinet: { w: 3, d: 1.6, solid: true },
  table: { w: 3, d: 1.8, solid: true },
  plant: { w: 1.4, d: 1.4, solid: true },
  lamp: { w: 1, d: 1, solid: true },
  teddy: { w: 1.2, d: 1.2, solid: false },
  basket: { w: 1.4, d: 1.4, solid: false },
}
export const DEFAULT_FURNITURE = {
  v: 3,
  items: [
    { id: 'bed', x: -8.5, z: -4.6, r: 0 },
    { id: 'cabinet', x: 9.5, z: -7, r: 0 },
    { id: 'tv', x: 3, z: -7, r: 0 },
    { id: 'sofa', x: 3, z: -1.5, r: 2 },
    { id: 'table', x: 3, z: -4.2, r: 0 },
    { id: 'lamp', x: -4.2, z: -7, r: 0 },
    { id: 'plant', x: 10.5, z: 5.5, r: 0 },
    { id: 'teddy', x: -8.5, z: 6.2, r: 0 },
    { id: 'basket', x: -5, z: 5.8, r: 0 },
  ],
}
const LABEL = { bed: 'Bed', sofa: 'Sofa', tv: 'TV', cabinet: 'Cabinet', table: 'Table', plant: 'Plant', lamp: 'Lamp', teddy: 'Teddy', basket: 'Basket' }

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const half = (it) => (it.r % 2 ? [CAT[it.id].d / 2, CAT[it.id].w / 2] : [CAT[it.id].w / 2, CAT[it.id].d / 2])
const boxOf = (it) => { const [hx, hz] = half(it); return [it.x - hx, it.z - hz, it.x + hx, it.z + hz] }
const PR = 0.7 // player radius
const hitBox = (x, z, [a, b, c, d]) => {
  const cx = clamp(x, a, c), cz = clamp(z, b, d)
  return (x - cx) ** 2 + (z - cz) ** 2 < PR * PR
}
const lerpAngle = (a, b, t) => a + ((((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t)
const snap = (v) => Math.round(v * 2) / 2

// ---------- small 3D helpers ----------
function B({ p = [0, 0, 0], s = [1, 1, 1], c = '#ffffff', ...rest }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshLambertMaterial color={c} {...rest} />
    </mesh>
  )
}
function Cy({ p = [0, 0, 0], a = [1, 1, 1, 16], c = '#ffffff', ...rest }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={a} />
      <meshLambertMaterial color={c} {...rest} />
    </mesh>
  )
}
function Ball({ p, r, c }) {
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[r, 14, 12]} />
      <meshLambertMaterial color={c} />
    </mesh>
  )
}

// ---------- furniture models (origin = center of footprint, front faces +z) ----------
function Bed() {
  return (
    <group>
      <B p={[0, 0.3, 0]} s={[4.4, 0.6, 6.4]} c="#6b3f2a" />
      <B p={[0, 0.85, 0.1]} s={[4, 0.5, 5.9]} c="#ffffff" />
      <B p={[0, 1.0, 1.1]} s={[4.05, 0.55, 3.6]} c="#e63946" />
      <B p={[-0.95, 1.2, -2.3]} s={[1.6, 0.35, 1.1]} c="#fde2e4" />
      <B p={[0.95, 1.2, -2.3]} s={[1.6, 0.35, 1.1]} c="#fde2e4" />
      <B p={[0, 1.3, -3.2]} s={[4.6, 2.2, 0.3]} c="#4a2c17" />
      <B p={[0, 0.75, 3.15]} s={[4.4, 1.1, 0.25]} c="#4a2c17" />
    </group>
  )
}
function Sofa() {
  return (
    <group>
      <B p={[0, 0.45, 0]} s={[6, 0.9, 2.6]} c="#d62839" />
      <B p={[0, 1.4, -1.0]} s={[6, 1.4, 0.7]} c="#d62839" />
      <B p={[-2.7, 1.0, 0.1]} s={[0.6, 1.2, 2.4]} c="#b91c2c" />
      <B p={[2.7, 1.0, 0.1]} s={[0.6, 1.2, 2.4]} c="#b91c2c" />
      <B p={[-1.35, 1.0, 0.3]} s={[2.5, 0.3, 1.7]} c="#f25c68" />
      <B p={[1.35, 1.0, 0.3]} s={[2.5, 0.3, 1.7]} c="#f25c68" />
    </group>
  )
}
function TV({ night }) {
  return (
    <group>
      <B p={[0, 0.5, 0]} s={[4, 1, 1.6]} c="#6b3f2a" />
      <B p={[0, 1.1, 0]} s={[0.8, 0.2, 0.5]} c="#111827" />
      <B p={[0, 2.15, 0]} s={[3.2, 2, 0.3]} c="#111827" />
      <B p={[0, 2.15, 0.17]} s={[2.9, 1.7, 0.05]} c="#1f2937" emissive={night ? '#000000' : '#1e3a8a'} emissiveIntensity={0.6} />
    </group>
  )
}
function Cabinet() {
  return (
    <group>
      <B p={[0, 2, 0]} s={[3, 4, 1.6]} c="#cbd5e1" />
      {[1, 2, 3].map((y) => <B key={y} p={[0, y, 0.82]} s={[2.8, 0.06, 0.05]} c="#64748b" />)}
      {[0.5, 1.5, 2.5, 3.5].map((y) => <B key={y} p={[0, y, 0.84]} s={[0.7, 0.12, 0.08]} c="#475569" />)}
    </group>
  )
}
function Table() {
  return (
    <group>
      <B p={[0, 1.0, 0]} s={[3, 0.2, 1.8]} c="#8b5a2b" />
      {[[-1.3, -0.7], [1.3, -0.7], [-1.3, 0.7], [1.3, 0.7]].map(([x, z]) => <B key={x + '_' + z} p={[x, 0.5, z]} s={[0.2, 1, 0.2]} c="#6b3f2a" />)}
      <Cy p={[0.5, 1.25, 0]} a={[0.3, 0.25, 0.3, 12]} c="#f8fafc" />
    </group>
  )
}
function Plant() {
  return (
    <group>
      <Cy p={[0, 0.4, 0]} a={[0.5, 0.4, 0.8, 12]} c="#c2703d" />
      <Ball p={[0, 1.5, 0]} r={0.75} c="#2f9e44" />
      <Ball p={[0.4, 2.1, 0.1]} r={0.5} c="#38b24f" />
      <Ball p={[-0.4, 2.0, -0.1]} r={0.5} c="#2b8a3e" />
    </group>
  )
}
function Lamp({ night }) {
  return (
    <group>
      <Cy p={[0, 0.05, 0]} a={[0.4, 0.4, 0.1, 14]} c="#374151" />
      <Cy p={[0, 1.8, 0]} a={[0.06, 0.06, 3.4, 8]} c="#374151" />
      <Cy p={[0, 3.6, 0]} a={[0.4, 0.7, 0.9, 16]} c="#fde68a" emissive="#fde68a" emissiveIntensity={night ? 1 : 0.5} />
      <pointLight position={[0, 3.4, 0]} intensity={night ? 1.4 : 0.5} distance={12} color="#ffe9a8" />
    </group>
  )
}
function Teddy() {
  return (
    <group>
      <Ball p={[0, 0.45, 0]} r={0.45} c="#c68642" />
      <Ball p={[0, 1.0, 0]} r={0.32} c="#c68642" />
      <Ball p={[-0.22, 1.28, 0]} r={0.12} c="#a16a2c" />
      <Ball p={[0.22, 1.28, 0]} r={0.12} c="#a16a2c" />
      <Ball p={[-0.45, 0.6, 0.1]} r={0.16} c="#c68642" />
      <Ball p={[0.45, 0.6, 0.1]} r={0.16} c="#c68642" />
    </group>
  )
}
function Basket() {
  return (
    <group>
      <Cy p={[0, 0.35, 0]} a={[0.65, 0.55, 0.7, 14]} c="#d6a45c" />
      <B p={[0, 0.75, 0]} s={[0.9, 0.2, 0.9]} c="#3b82f6" />
    </group>
  )
}
const MODEL = { bed: Bed, sofa: Sofa, tv: TV, cabinet: Cabinet, table: Table, plant: Plant, lamp: Lamp, teddy: Teddy, basket: Basket }

// ---------- room shell ----------
function useTex(draw, w, h, rx, ry) {
  return useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    draw(cv.getContext('2d'), w, h)
    const t = new THREE.CanvasTexture(cv)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rx, ry)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

function Shell({ night }) {
  const floor = useTex((g, w, h) => {
    const cols = ['#c8955a', '#bd8a50', '#d09c62', '#b88349']
    for (let i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect((i * w) / 4, 0, w / 4, h) }
    g.fillStyle = '#8b5a2b'
    for (let i = 0; i < 4; i++) g.fillRect((i * w) / 4, 0, 3, h)
    g.fillRect(0, h / 2, w, 2)
  }, 256, 256, 6, 4)
  const wall = useTex((g, w, h) => {
    g.fillStyle = '#fde7c8'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#f8d9ad'; g.fillRect(w / 2, 0, w / 2, h)
  }, 128, 16, 12, 1)
  const wallL = useTex((g, w, h) => {
    g.fillStyle = '#fde7c8'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#f8d9ad'; g.fillRect(w / 2, 0, w / 2, h)
  }, 128, 16, 8, 1)
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[24, 16]} /><meshLambertMaterial map={floor} /></mesh>
      <B p={[0, -0.32, 0]} s={[24.4, 0.6, 16.4]} c="#8b5a2b" />
      <mesh position={[0, 4, -8.2]} receiveShadow><boxGeometry args={[24.8, 8, 0.4]} /><meshLambertMaterial map={wall} /></mesh>
      <mesh position={[-12.2, 4, 0]} receiveShadow><boxGeometry args={[0.4, 8, 16.4]} /><meshLambertMaterial map={wallL} /></mesh>
      <B p={[0, 0.25, -7.92]} s={[24, 0.5, 0.16]} c="#8b5a2b" />
      <B p={[-11.92, 0.25, 0]} s={[0.16, 0.5, 16]} c="#8b5a2b" />

      {/* rug */}
      <mesh position={[3, 0.03, -3]} scale={[1, 1, 0.7]}><cylinderGeometry args={[4.8, 4.8, 0.05, 40]} /><meshLambertMaterial color="#e9c46a" /></mesh>
      <mesh position={[3, 0.06, -3]} scale={[1, 1, 0.7]} receiveShadow><cylinderGeometry args={[4.4, 4.4, 0.05, 40]} /><meshLambertMaterial color="#2a9d8f" /></mesh>

      {/* window */}
      <B p={[-3.5, 4.6, -7.95]} s={[4.2, 3.6, 0.2]} c="#ffffff" />
      <B p={[-3.5, 4.6, -7.84]} s={[3.8, 3.2, 0.1]} c={night ? '#1e3a8a' : '#bfe9ff'} emissive={night ? '#0b1b4a' : '#7dd3fc'} emissiveIntensity={0.5} />
      <B p={[-3.5, 4.6, -7.78]} s={[0.15, 3.2, 0.08]} c="#ffffff" />
      <B p={[-3.5, 4.6, -7.78]} s={[3.8, 0.15, 0.08]} c="#ffffff" />
      {night && <mesh position={[-2.4, 5.4, -7.72]}><sphereGeometry args={[0.4, 14, 12]} /><meshBasicMaterial color="#fde68a" /></mesh>}

      {/* picture */}
      <B p={[8.5, 5.2, -7.9]} s={[2.6, 2, 0.15]} c="#f59e0b" />
      <B p={[8.5, 5.2, -7.83]} s={[2.2, 1.6, 0.15]} c="#7dd3fc" />
      <B p={[8.5, 4.75, -7.82]} s={[2.2, 0.7, 0.16]} c="#4ade80" />

      {/* clock */}
      <mesh position={[-9, 5.8, -7.88]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.65, 0.65, 0.15, 24]} /><meshLambertMaterial color="#ffffff" /></mesh>
      <B p={[-9, 5.95, -7.78]} s={[0.08, 0.45, 0.05]} c="#111827" />
      <B p={[-8.85, 5.8, -7.78]} s={[0.35, 0.08, 0.05]} c="#111827" />

      {/* mirror (left wall) */}
      <B p={[-11.9, 4.5, -3]} s={[0.15, 3.2, 1.8]} c="#a16207" />
      <B p={[-11.8, 4.5, -3]} s={[0.1, 2.8, 1.4]} c="#bfe9ff" emissive="#7dd3fc" emissiveIntensity={0.25} />

      {/* door (left wall) + mat */}
      <B p={[-11.9, 2.75, 3]} s={[0.2, 5.5, 3]} c="#4a2c17" />
      <B p={[-11.78, 3.3, 3]} s={[0.05, 1.8, 2.2]} c="#5b3a24" />
      <B p={[-11.78, 1.2, 3]} s={[0.05, 1.5, 2.2]} c="#5b3a24" />
      <Ball p={[-11.6, 2.6, 3.9]} r={0.18} c="#fcd116" />
      <B p={[-11.8, 5.9, 3]} s={[0.1, 0.5, 1.4]} c="#16a34a" />
      <B p={[-10.4, 0.03, 3]} s={[2, 0.06, 3.2]} c="#b91c1c" />
    </group>
  )
}

// ---------- the interactive room ----------
function Scene({ items, setItems, edit, sel, setSel, drag, onDrop, vec, active, sleeping, night, onNear, look }) {
  const player = useRef()
  const st = useRef({ x: -9.2, z: 3, face: Math.PI / 2 })
  const keys = useRef(new Set())
  const itemsRef = useRef(items); itemsRef.current = items
  const activeRef = useRef(active); activeRef.current = active
  const sleepRef = useRef(sleeping); sleepRef.current = sleeping
  const nearRef = useRef(null)

  useEffect(() => {
    const typing = (e) => /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')
    const down = (e) => { if (!typing(e)) keys.current.add(e.key.toLowerCase()) }
    const up = (e) => keys.current.delete(e.key.toLowerCase())
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur) }
  }, [])

  useFrame((state, dt0) => {
    const dt = Math.min(dt0, 0.05)
    const g = player.current
    if (!g) return
    const S = st.current
    const list = itemsRef.current
    const solids = list.filter((it) => CAT[it.id].solid).map(boxOf)
    const blocked = (x, z) => x < -11.2 || x > 11.2 || z < -7.3 || z > 7.4 || solids.some((b) => hitBox(x, z, b))

    // if furniture was dropped on the player, push them out
    for (const [a, b, c, d] of solids) {
      if (S.x > a - PR && S.x < c + PR && S.z > b - PR && S.z < d + PR) {
        const l = S.x - (a - PR), r = c + PR - S.x, t = S.z - (b - PR), bt = d + PR - S.z
        const m = Math.min(l, r, t, bt)
        if (m === l) S.x = a - PR - 0.05; else if (m === r) S.x = c + PR + 0.05; else if (m === t) S.z = b - PR - 0.05; else S.z = d + PR + 0.05
      }
    }

    // input (camera is fixed: up = back wall)
    let ix = 0, iz = 0
    if (activeRef.current) {
      const k = keys.current
      ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0) + (Math.abs(vec.x) > 0.15 ? vec.x : 0)
      iz = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0) + (Math.abs(vec.y) > 0.15 ? vec.y : 0)
    }
    let len = Math.hypot(ix, iz)
    if (len > 1) { ix /= len; iz /= len; len = 1 }
    const dx = ix * 7 * dt, dz = iz * 7 * dt
    if (!blocked(S.x + dx, S.z)) S.x += dx
    if (!blocked(S.x, S.z + dz)) S.z += dz
    const moving = len > 0.1
    if (moving) S.face = lerpAngle(S.face, Math.atan2(ix, iz), 1 - Math.exp(-12 * dt))
    g.userData.walk = (g.userData.walk || 0) + (((moving && !sleepRef.current) ? 1 : 0) - (g.userData.walk || 0)) * Math.min(1, dt * 12)

    const bed = list.find((it) => it.id === 'bed')
    g.rotation.order = 'YXZ'
    if (sleepRef.current && bed) {
      const yaw = bed.r * (Math.PI / 2)
      g.position.set(bed.x + Math.sin(yaw) * 1.9, 1.35, bed.z + Math.cos(yaw) * 1.9)
      g.rotation.set(-Math.PI / 2, yaw, 0)
    } else {
      g.position.set(S.x, 0, S.z)
      g.rotation.set(0, S.face, 0)
    }

    // what can the player use right now?
    let near = null
    if (!sleepRef.current) {
      let bd = 99
      const doorD = Math.hypot(S.x + 11, S.z - 3)
      if (doorD < 2.6) { near = 'door'; bd = doorD }
      if (bed) {
        const [a, b, c, d] = boxOf(bed)
        const bedD = Math.hypot(S.x - clamp(S.x, a, c), S.z - clamp(S.z, b, d))
        if (bedD < 2.2 && bedD < bd) near = 'bed'
      }
    }
    if (near !== nearRef.current) { nearRef.current = near; onNear(near) }

    // fixed dollhouse camera, pulled back on narrow screens
    const aspect = state.size.width / state.size.height
    const d = Math.max(22, 13.5 / (Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)) * aspect))
    state.camera.position.set(0, 0.5 + d * 0.6, -0.5 + d * 0.8)
    state.camera.lookAt(0, 0.5, -0.5)
  })

  const floorMove = (e) => {
    const dr = drag.current
    if (!dr) return
    const cur = itemsRef.current.find((it) => it.id === dr.id)
    if (!cur) return
    if (dr.ox === null) { dr.ox = e.point.x - cur.x; dr.oz = e.point.z - cur.z }
    setItems((list) => list.map((it) => {
      if (it.id !== dr.id) return it
      const [hx, hz] = half(it)
      return { ...it, x: snap(clamp(e.point.x - dr.ox, -11.9 + hx, 11.9 - hx)), z: snap(clamp(e.point.z - dr.oz, -7.9 + hz, 7.9 - hz)) }
    }))
  }

  return (
    <>
      <ambientLight intensity={night ? 0.4 : 0.9} />
      <directionalLight
        position={[10, 18, 10]} intensity={night ? 0.35 : 1.1} color={night ? '#93c5fd' : '#ffffff'} castShadow
        shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005}
        shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16}
        shadow-camera-near={1} shadow-camera-far={60}
      />
      <Shell night={night} />

      {edit && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} onPointerMove={floorMove} onPointerDown={() => setSel(null)}>
          <planeGeometry args={[24, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {items.map((it) => {
        const Model = MODEL[it.id]
        return (
          <group
            key={it.id} position={[it.x, 0, it.z]} rotation={[0, it.r * (Math.PI / 2), 0]}
            onPointerDown={edit ? (e) => { e.stopPropagation(); setSel(it.id); drag.current = { id: it.id, ox: null, oz: null } } : undefined}
          >
            <Model night={night} />
            {edit && sel === it.id && (
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[CAT[it.id].w + 0.4, 0.06, CAT[it.id].d + 0.4]} />
                <meshBasicMaterial color="#facc15" transparent opacity={0.55} />
              </mesh>
            )}
          </group>
        )
      })}

      <group scale={0.9}><group scale={1 / 0.9}><Character ref={player} look={look} /></group></group>
    </>
  )
}

// ---------- screen ----------
export default function HouseRoom({ state, touch, onSleep, onSave, onClose }) {
  const [items, setItems] = useState(() => (state.furniture?.v === 3 ? state.furniture.items : DEFAULT_FURNITURE.items))
  const [edit, setEdit] = useState(false)
  const [sel, setSel] = useState(null)
  const [phase, setPhase] = useState('room') // room | night | wake
  const [near, setNear] = useState(null)
  const drag = useRef(null)
  const vec = useRef({ x: 0, y: 0 }).current
  const itemsRef = useRef(items); itemsRef.current = items
  const nearRef = useRef(null)
  const stars = useMemo(() => Array.from({ length: 24 }, () => [Math.random() * 100, Math.random() * 45, 8 + Math.random() * 10, Math.random() * 2]), [])

  const onNear = (n) => { nearRef.current = n; setNear(n) }
  const sleepNow = () => { setEdit(false); setSel(null); setPhase('night') }
  const act = () => {
    if (phase !== 'room' || edit) return
    if (nearRef.current === 'bed') sleepNow()
    else if (nearRef.current === 'door') onClose()
  }
  const actRef = useRef(act); actRef.current = act

  useEffect(() => {
    const h = (e) => { if (e.key.toLowerCase() === 'e' && !e.repeat) actRef.current() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  // finish a drag anywhere on screen
  useEffect(() => {
    const up = () => {
      if (!drag.current) return
      drag.current = null
      onSave({ v: 3, items: itemsRef.current })
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [])
  useEffect(() => {
    if (phase !== 'night') return
    const t = setTimeout(() => setPhase('wake'), 4200)
    return () => clearTimeout(t)
  }, [phase])

  const rotate = () => {
    const next = itemsRef.current.map((it) => {
      if (it.id !== sel) return it
      const r = (it.r + 1) % 4
      const [hx, hz] = half({ ...it, r })
      return { ...it, r, x: clamp(it.x, -11.9 + hx, 11.9 - hx), z: clamp(it.z, -7.9 + hz, 7.9 - hz) }
    })
    setItems(next); onSave({ v: 3, items: next })
  }
  const reset = () => { setItems(DEFAULT_FURNITURE.items); setSel(null); onSave(null) }

  const night = phase !== 'room'
  const health = Math.min(100, Math.round(state.health + 10))
  const hunger = Math.max(0, Math.round(state.hunger - 15))

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gradient-to-b from-sky-300 to-sky-100">
      <style>{CSS}</style>
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xl font-extrabold text-blue-900">🏠 {state.player?.name}'s House</p>
        <button className="btn-red px-3 py-1" onClick={onClose}>✕</button>
      </div>

      <div className="relative flex-1 select-none overflow-hidden" style={{ touchAction: 'none' }} onContextMenu={(e) => e.preventDefault()}>
        <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 45, near: 0.5, far: 200, position: [0, 14, 18] }} gl={{ antialias: true, alpha: true }}>
          <Scene
            items={items} setItems={setItems} edit={edit} sel={sel} setSel={setSel} drag={drag}
            vec={vec} active={phase === 'room'} sleeping={night} night={night} onNear={onNear} look={state.player.look}
          />
        </Canvas>

        {edit && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-bold text-white">
            🛠️ Drag furniture to move it{sel ? ` · ${LABEL[sel]} selected` : ' · tap one to select'}
          </div>
        )}
        {!edit && phase === 'room' && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-bold text-white">
            WASD / joystick: walk · E: use
          </div>
        )}
        {near && phase === 'room' && !edit && (
          <button onClick={act} className="btn-orange absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 text-lg">
            E · {near === 'bed' ? '🛏️ Sleep in bed' : '🚪 Go outside'}
          </button>
        )}
        {touch && phase === 'room' && <div className="absolute bottom-3 left-3 z-20"><Joystick vec={vec} /></div>}
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-3 pb-4 pt-2">
        {!edit ? (
          <>
            <button className="btn-blue px-5 py-3 text-lg" onClick={() => setEdit(true)}>🛠️ Arrange Furniture</button>
            <button className="btn-green px-5 py-3 text-lg" onClick={sleepNow}>🛏️ Sleep</button>
          </>
        ) : (
          <>
            <button className="btn-green px-5 py-3 text-lg" onClick={() => { setEdit(false); setSel(null) }}>✓ Done</button>
            <button className="btn-blue px-5 py-3 text-lg" disabled={!sel} onClick={rotate}>⟳ Rotate</button>
            <button className="btn-red px-5 py-3 text-lg" onClick={reset}>↺ Reset</button>
          </>
        )}
      </div>

      {/* sleeping / waking overlay */}
      {night && (
        <div className="absolute inset-0 z-10 flex flex-col items-center pt-14 text-white" style={{ background: phase === 'wake' ? 'linear-gradient(rgba(251,146,60,.55),rgba(253,230,138,.35))' : 'rgba(2,6,23,.55)' }}>
          {phase === 'night' && (
            <>
              {stars.map(([l, t, s, d], i) => (
                <span key={i} className="absolute" style={{ left: `${l}%`, top: `${t}%`, fontSize: s, animation: `house-tw 2s ${d}s infinite` }}>✦</span>
              ))}
              <div className="text-7xl">🌙</div>
              <div className="relative h-20 w-40">
                {['💤', 'Z', 'z'].map((z, i) => (
                  <span key={i} className="absolute bottom-0 text-4xl font-extrabold" style={{ left: 20 + i * 36, animation: `house-z 2.2s ${i * 0.6}s infinite` }}>{z}</span>
                ))}
              </div>
              <p className="text-2xl font-extrabold">Sleeping…</p>
              <div className="mt-3 h-3 w-64 overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-yellow-300" style={{ animation: 'house-bar 4.2s linear forwards' }} />
              </div>
            </>
          )}
          {phase === 'wake' && (
            <div className="mt-6 w-[min(92%,22rem)] rounded-2xl border-4 border-blue-700 bg-sky-100 p-4 text-slate-900 shadow-2xl" style={{ animation: 'house-rise .5s ease-out' }}>
              <p className="text-center text-6xl">☀️</p>
              <p className="text-center text-2xl font-extrabold text-blue-900">Good morning!</p>
              <p className="mb-3 text-center font-bold text-slate-600">{fmtTime(state.day + 1, 360)}</p>
              <ul className="space-y-1">
                {[['⚡ Energy', `${Math.round(state.energy)} → 100`], ['❤️ Health', `${Math.round(state.health)} → ${health}`], ['🍽️ Hunger', `${Math.round(state.hunger)} → ${hunger}`]].map(([k, v]) => (
                  <li key={k} className="flex justify-between rounded-lg bg-white px-3 py-1 font-bold"><span>{k}</span><span>{v}</span></li>
                ))}
              </ul>
              <button className="btn-green mt-3 w-full py-3 text-xl" onClick={onSleep}>▶ Start the day</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}