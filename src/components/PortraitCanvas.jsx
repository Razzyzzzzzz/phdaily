import { useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Character } from '../game/Scene3D' // the exact same model used in the game world

// Renders only when asked (frameloop="demand"), ticking ~15 fps so the blink animation still plays
// without running a full 60 fps second render loop next to the game.
function Rig({ look }) {
  const ref = useRef()
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    invalidate()
    const id = setInterval(invalidate, 66)
    return () => clearInterval(id)
  }, [invalidate, look])
  return <Character ref={ref} look={look} />
}

export default function PortraitCanvas({ look }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [1.1, 3.25, 6.1], fov: 22, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onCreated={({ camera }) => camera.lookAt(0, 3.1, 0)}
    >
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#ffffff', '#9ec5ff', 0.5]} />
      <directionalLight position={[3, 5, 5]} intensity={1.6} />
      <Rig look={look} />
    </Canvas>
  )
}