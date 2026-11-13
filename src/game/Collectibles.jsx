import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { COLLECTIBLES } from '../data/progression'

const S = 0.05 // world px -> scene units (same constant as Scene3D)
const COLLECT_R = 55      // px: walk this close to pick it up
const SECRET_SHOW_R = 420 // px: secret ones only appear when you are near

// Glowing gems placed around the town (treasure hunt). Reads bridge.me (your position) and bridge.collected
// (state.collected, kept up to date by App.jsx); calls bridge.onCollect(id) when you walk into one.
export default function Collectibles({ bridge }) {
  const refs = useRef({})
  const sent = useRef(new Set())

  useFrame(({ clock }) => {
    const col = bridge.collected || {}, me = bridge.me, t = clock.elapsedTime
    for (const c of COLLECTIBLES) {
      const g = refs.current[c.id]
      if (!g) continue
      const got = !!col[c.id]
      const d = me ? Math.hypot(me.x - c.x, me.z - c.z) : 1e9
      g.visible = !got && (!c.secret || d < SECRET_SHOW_R)
      if (!g.visible) { if (got) sent.current.delete(c.id); continue }
      const gem = g.children[0]
      gem.position.y = 0.9 + Math.sin(t * 2 + c.x) * 0.12
      gem.rotation.y = t * 1.6
      if (d < COLLECT_R && !bridge.paused && !sent.current.has(c.id)) {
        sent.current.add(c.id)
        bridge.onCollect?.(c.id)
      }
    }
  })

  return (
    <>
      {COLLECTIBLES.map((c) => {
        const col = c.secret ? '#f472b6' : '#fcd116'
        return (
          <group key={c.id} ref={(el) => { refs.current[c.id] = el }} position={[c.x * S, 0, c.z * S]}>
            <mesh position={[0, 0.9, 0]}>
              <octahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.9} roughness={0.25} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.08, 0.35, 1.8, 10, 1, true]} />
              <meshBasicMaterial color={col} transparent opacity={0.25} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}
