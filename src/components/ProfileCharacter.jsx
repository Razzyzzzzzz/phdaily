import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Character } from '../game/Scene3D' // the exact same model used in the game world

// Idle sway until you drag; drag left/right to spin. `pose` = '' | 'wave' | 'dance' (same animations as the game).
function Rig({ look, pose, drag }) {
  const ref = useRef()
  useFrame((st, dt) => {
    const g = ref.current
    if (!g) return
    const d = drag.current
    if (performance.now() - d.t > 1800) d.ang += (Math.sin(st.clock.elapsedTime * 0.7) * 0.4 - d.ang) * Math.min(1, dt * 1.5)
    g.rotation.y = d.ang
    g.userData.walk = 0
    g.userData.act = pose || null
  })
  return <Character ref={ref} look={look} acts />
}

export default function ProfileCharacter({ look, pose }) {
  const drag = useRef({ ang: 0, t: 0, x: null })
  const down = (e) => { drag.current.x = e.clientX; drag.current.t = performance.now(); e.currentTarget.setPointerCapture?.(e.pointerId) }
  const move = (e) => {
    const d = drag.current
    if (d.x == null) return
    d.ang += (e.clientX - d.x) * 0.012; d.x = e.clientX; d.t = performance.now()
  }
  const up = () => { drag.current.x = null; drag.current.t = performance.now() }
  return (
    <div className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.5, 11], fov: 28, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        onCreated={({ camera }) => camera.lookAt(0, 2.1, 0)}
      >
        <ambientLight intensity={1.15} />
        <hemisphereLight args={['#ffffff', '#9ec5ff', 0.5]} />
        <directionalLight position={[3, 5, 5]} intensity={1.6} />
        <Rig look={look} pose={pose} drag={drag} />
      </Canvas>
    </div>
  )
}