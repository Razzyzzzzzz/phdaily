import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Character } from '../game/Scene3D'

// Parehong-pareho sa chibi 3D character na nasa laro (Character galing sa Scene3D)
function Rig({ look, drag }) {
  const spin = useRef()
  const body = useRef()
  useFrame(({ clock }, dt) => {
    const d = drag.current
    if (!d.on) d.yaw += (0 - d.yaw) * Math.min(1, dt * 1.6) // bumabalik paharap
    const t = clock.elapsedTime
    spin.current.rotation.y = 0.28 + d.yaw + (d.on ? 0 : Math.sin(t * 0.7) * 0.3)
    spin.current.position.y = Math.sin(t * 2) * 0.04 // mahinang paghinga
    if (body.current) body.current.userData.walk = 0
  })
  return (
    <group ref={spin}>
      <Character ref={body} look={look} />
    </group>
  )
}

export default function CharacterCanvas({ look }) {
  const drag = useRef({ on: false, x: 0, yaw: 0 })
  const down = (e) => { drag.current.on = true; drag.current.x = e.clientX; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const move = (e) => {
    const d = drag.current
    if (!d.on) return
    d.yaw += (e.clientX - d.x) * 0.012
    d.x = e.clientX
  }
  const up = () => { drag.current.on = false }
  return (
    <div className="h-full w-full touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <Canvas
        shadows="percentage" dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 2.5, 10.5], fov: 28 }}
        onCreated={({ camera }) => camera.lookAt(0, 2, 0)}
      >
        <hemisphereLight args={['#ffffff', '#6aa84f', 0.95]} />
        <directionalLight position={[4, 9, 6]} intensity={1.6} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0005} />
        <directionalLight position={[-5, 4, -6]} intensity={0.5} color="#9ad1ff" />
        {/* pedestal */}
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[1.9, 2.05, 0.2, 40]} />
          <meshLambertMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1.55, 1.8, 40]} />
          <meshBasicMaterial color="#fcd116" />
        </mesh>
        <mesh position={[0, 0.003, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[1.55, 40]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
        <Rig look={look} drag={drag} />
      </Canvas>
    </div>
  )
}