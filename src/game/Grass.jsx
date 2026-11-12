import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TYPES, TINTS, tuftGeo, buildLayout } from './grassData'

const S = 0.05 // pareho sa Scene3D (px -> units)

// Instanced na damo: 6 draw calls lang kahit libo-libo ang tuft.
// Props: palms, poles, benches, parked (galing sa Scene3D) para iwasan ang mga ito; touch = mas kaunti sa phone.
export default function Grass({ palms, poles, benches, parked, touch }) {
  const refs = useRef([])
  const uTime = useMemo(() => ({ value: 0 }), [])
  const data = useMemo(() => buildLayout({ palms, poles, benches, parked, touch }), []) // eslint-disable-line react-hooks/exhaustive-deps
  const geos = useMemo(() => TYPES.map((t, i) => tuftGeo(t, 101 + i * 37)), [])
  const mat = useMemo(() => {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 0.09 + instanceMatrix[3].z * 0.07;
        float sw = sin(uTime * 1.7 + ph) * 0.5 + sin(uTime * 2.9 + ph * 1.7) * 0.25;
        transformed.x += sw * position.y * 0.09;
        transformed.z += sw * position.y * 0.05;`
      )
    }
    m.customProgramCacheKey = () => 'grass-sway'
    return m
  }, [uTime])

  useLayoutEffect(() => {
    const d = new THREE.Object3D(), c = new THREE.Color()
    data.forEach((list, ti) => {
      const m = refs.current[ti]
      if (!m) return
      list.forEach(([x, z, yaw, sx, sy, tint, jit], i) => {
        d.position.set(x * S, 0.01, z * S); d.rotation.set(0, yaw, 0); d.scale.set(sx, sy, sx); d.updateMatrix()
        m.setMatrixAt(i, d.matrix)
        const t = TINTS[tint]
        c.setRGB(t[0] * jit, t[1] * jit, t[2] * jit)
        m.setColorAt(i, c)
      })
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    })
  }, [data])

  useFrame(({ clock }) => { uTime.value = clock.elapsedTime })

  return (
    <group>
      {data.map((list, ti) =>
        list.length ? (
          <instancedMesh key={ti} ref={(m) => { refs.current[ti] = m }} args={[geos[ti], mat, list.length]} frustumCulled={false} />
        ) : null
      )}
    </group>
  )
}