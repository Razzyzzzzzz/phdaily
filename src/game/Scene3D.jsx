import { forwardRef, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { WW, WH, PLACES, NPCS, LOCATIONS, ROAD2, VROAD, POND } from './world'
import { weatherIndex } from '../data/gameData'

// Simulation runs in the same pixel units as the old 2D game (x, z = old x, y).
// Everything is scaled by S when rendered.
const S = 0.05
const JEEP = [0xef476f, 0x06d6a0, 0xffd166, 0x4cc9f0]
// ----- umiiyak na NPC (NPCS entry na may `cry: true`) -----
const CRY_TRIGGER = 110   // px: gaano kalapit ang player bago siya magsalita
const CRY_SAY_TIME = 2.4  // seconds na nakikita ang speech bubble bago tumakbo
const CRY_LINE_TIME = 1.9 // seconds bawat linya habang hinahabol
const CRY_STAND_TIME = 0.6 // seconds ng pagtayo mula sa upuan bago tumakbo
const CRY_FLEE_SPEED = 200 // px/s (mabilis; ang player ay 165)
const CRY_FLEE_TIME = 8   // seconds na tatakbo palayo bago mawala
const CRY_RESPAWN = 20    // seconds na malayo ka bago siya bumalik sa bench niya
const PARKED = [[1700, 1180, 3, false], [2020, 1260, 1, true], [2260, 1170, 0, false]]
const PALMS = [[140, 900], [320, 900], [820, 900], [1020, 900], [140, 1500], [400, 1560], [760, 1560], [1040, 1500], [300, 1340], [860, 1340],
  // new land (east lot, south, plaza)
  [2500, 1500], [2900, 1500], [3300, 1500], [3700, 1500], [4100, 1500], [4500, 1500], [2600, 1300], [3000, 1250], [3600, 1250], [4300, 1250],
  [400, 2500], [1000, 2620], [1700, 2420], [2050, 2600], [2750, 2650], [2900, 2750], [3950, 2750], [4400, 2600], [4650, 2300]]
const POLES = [] // [x, zBase]
for (const zb of [750, ROAD2.y + ROAD2.h + 30]) for (let x = 120; x < WW; x += 360) if (!(x > VROAD.x - 60 && x < VROAD.x + VROAD.w + 60)) POLES.push([x, zb])

// ---------- collision (px) ----------
const R = 11
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const BOXES = [
  [POND.x, POND.z, POND.x + POND.w, POND.z + POND.d], // tubig ng palaisdaan
  ...PLACES.filter((pl) => pl.base > 600).map((pl) => [pl.x, pl.base - 200, pl.x + pl.w, pl.base]), // terminal, mall, police, gym, south row
  [516, 802, 524, 810], [636, 802, 644, 810], // mga poste ng "Parke" sign
]
const BENCHES = [[430, 1180], [730, 1285], [2230, 2520], [2570, 2520]].map(([x, z]) => [x - 42, z - 17, x + 42, z + 17]) // mga bench sa park
let DYN = [] // moving jeepneys (traffic + terminal jeepneys), refreshed every frame

// ----- jeepneys at the terminal you can ride -----
const RIDE_SPEED = 170
// out of the lot, up the main road, west along the town, back east, home again (px)
const ROUTE = (x, z) => [[x, z], [x, 1400], [1360, 1400], [1360, 560], [300, 560], [300, 672], [1290, 672], [1290, 1440], [x, 1440], [x, z]]
const rideBox = (r) => (Math.abs(Math.sin(r.yaw)) > 0.7 ? [r.x - 27, r.z - 58, r.x + 27, r.z + 58] : [r.x - 58, r.z - 27, r.x + 58, r.z + 27])
const hitBox = (x, z, [a, b, c, d]) => {
  const cx = clamp(x, a, c), cz = clamp(z, b, d)
  return (x - cx) ** 2 + (z - cz) ** 2 < R * R
}
const CIRCLES = [
  ...PALMS.map(([x, y]) => [x, y - 4, 8]),
  ...POLES.map(([x, zb]) => [x, zb - 4, 6]),
  [580, 1225, 72], // fountain
  [2400, 2450, 72], // south plaza fountain
]
// free = true kapag nasa loob na ng bench (nakaupo o kakatayo pa lang) para makalabas
const blocked = (x, z, free) => {
  if (x < R || x > WW - R || z < 492 || z > WH - R) return true
  for (const b of BOXES) if (hitBox(x, z, b)) return true
  if (!free) for (const b of BENCHES) if (hitBox(x, z, b)) return true
  for (const b of DYN) if (hitBox(x, z, b)) return true
  for (const [cx, cz, r] of CIRCLES) if ((x - cx) ** 2 + (z - cz) ** 2 < (r + R) ** 2) return true
  return false
}
const onBench = (o) => BENCHES.some((b) => hitBox(o.x, o.z, b))
const step = (o, dx, dz) => {
  const fr = onBench(o)
  if (!blocked(o.x + dx, o.z, fr)) o.x += dx
  if (!blocked(o.x, o.z + dz, fr)) o.z += dz
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
// a free spot beside a jeepney (px) for getting off
const findFree = (r) => {
  const fx = Math.cos(r.yaw), fz = -Math.sin(r.yaw) // forward
  const sx = Math.sin(r.yaw), sz = Math.cos(r.yaw) // side
  const jb = rideBox(r)
  for (const [f, s] of [[0, 80], [0, -80], [0, 120], [0, -120], [-90, 80], [-90, -80], [90, 80], [90, -80], [0, 170], [0, -170], [-140, 0], [140, 0]]) {
    const x = r.x + fx * f + sx * s, z = r.z + fz * f + sz * s
    if (!blocked(x, z) && !hitBox(x, z, jb)) return [x, z]
  }
  return [r.x, r.z + 90]
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
// toon outline (inverted hull): madilim na gilid para pumop ang 3D look
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: '#1b1b2a', side: THREE.BackSide })

// capsule (bilugan ang dulo) para sa braso, binti at katawan
function Cap({ p = [0, 0, 0], r = 0.2, l = 0.6, c = '#ffffff', s = [1, 1, 1], ol = false }) {
  return (
    <group position={p} scale={s}>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[r, l, 4, 12]} />
        <meshLambertMaterial color={c} />
      </mesh>
      {ol && (
        <mesh scale={1.07}>
          <capsuleGeometry args={[r, l, 4, 12]} />
          <primitive object={OUTLINE_MAT} attach="material" dispose={null} />
        </mesh>
      )}
    </group>
  )
}
function Ball({ p = [0, 0, 0], r = 0.2, c = '#ffffff', s = [1, 1, 1] }) {
  return (
    <mesh position={p} scale={s} castShadow>
      <sphereGeometry args={[r, 14, 12]} />
      <meshLambertMaterial color={c} />
    </mesh>
  )
}

// chibi 3D character: malaking ulo, anime na mata (kumukurap), buhok na may bangs,
// uniform (babae: ribbon + palda + medyas) / hoodie (lalaki)
export const Character = forwardRef(function Character({ look, label, cry, bubble }, ref) {
  const fem = look.gender === 'female'
  const st = look.hairStyle ?? 0
  const body = useRef(), legL = useRef(), legR = useRef(), armL = useRef(), armR = useRef()
  const head = useRef(), tearL = useRef(), tearR = useRef(), bubbleRef = useRef()
  const textR = useRef(), bgR = useRef(), bdR = useRef(), lastTxt = useRef(bubble)
  const eyeRefs = useRef([])
  const blinkOff = useMemo(() => Math.random() * 3, [])
  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const w = g.userData.walk || 0
    const t = clock.elapsedTime * (cry ? 15 : 10)
    const sw = Math.sin(t) * 0.8 * w
    legL.current.rotation.x = sw; legR.current.rotation.x = -sw
    armL.current.rotation.x = -sw; armR.current.rotation.x = sw
    body.current.position.y = Math.abs(Math.sin(t)) * 0.12 * w
    head.current.rotation.z = Math.sin(t * 0.5) * 0.05 * w // bahagyang indayog ng ulo
    // kurap
    const bl = (clock.elapsedTime + blinkOff) % 3.8 < 0.12 ? 0.1 : 1
    eyeRefs.current.forEach((e) => { if (e) e.scale.y = bl })
    if (cry) {
      const tt = clock.elapsedTime
      const pose = !!g.userData.cry // nakatayong umiiyak (hindi tumatakbo)
      if (pose) {
        const sob = Math.sin(tt * 9) * 0.5 + 0.5
        armL.current.rotation.x = -2.25 + sob * 0.12; armR.current.rotation.x = -2.25 + sob * 0.12
        armL.current.rotation.z = 0.25; armR.current.rotation.z = -0.25
        head.current.rotation.x = 0.38 + sob * 0.08
        body.current.position.x = Math.sin(tt * 26) * 0.02
        body.current.position.y += sob * 0.05
      } else {
        armL.current.rotation.z = 0; armR.current.rotation.z = 0
        head.current.rotation.x = 0; body.current.position.x = 0
      }
      // nakaupo (nakalabas ang mga binti, mas mababa ang katawan); smooth ang pagtayo
      const sitT = g.userData.sit ? 1 : 0
      let sitK = g.userData.sitK ?? sitT
      sitK = g.visible ? sitK + (sitT - sitK) * Math.min(1, dt * 8) : sitT
      g.userData.sitK = sitK
      if (sitK > 0.001) {
        legL.current.rotation.x = legL.current.rotation.x * (1 - sitK) - 1.5 * sitK
        legR.current.rotation.x = legR.current.rotation.x * (1 - sitK) - 1.5 * sitK
        body.current.position.y += sitK * 0.27
      }
      // luha
      const on = g.userData.tears ? 1 : 0
      ;[[tearL.current, 0], [tearR.current, 0.5]].forEach(([m, off]) => {
        if (!m) return
        const run = w > 0.3 // mas marami/malaki ang luha kapag tumatakbo
        const ph = (tt * (run ? 3 : 1.5) + off) % 1
        m.position.y = -0.12 - ph * 0.85
        m.scale.setScalar(on * (run ? 2.2 : 1.4) * (1 - ph * 0.5))
      })
      if (bubbleRef.current) {
        const txt = g.userData.say ? g.userData.sayText || bubble : null
        bubbleRef.current.visible = !!txt
        if (txt && txt !== lastTxt.current) {
          lastTxt.current = txt
          textR.current.text = txt; textR.current.sync?.()
          const w = txt.length * 0.27 + 0.9
          bgR.current.scale.x = w; bdR.current.scale.x = w + 0.2
        }
      }
    }
  })
  const pants = fem ? look.skin : '#2b303c'
  const skirt = useMemo(() => '#' + new THREE.Color(look.shirt).multiplyScalar(0.55).getHexString(), [look.shirt])
  const shirtLight = useMemo(() => '#' + new THREE.Color(look.shirt).lerp(new THREE.Color('#ffffff'), 0.25).getHexString(), [look.shirt])
  const hairMat = { side: THREE.DoubleSide }
  return (
    <group ref={ref}>
      <group ref={body}>
        {/* legs */}
        {[[legL, -0.23], [legR, 0.23]].map(([lr, x]) => (
          <group key={x} ref={lr} position={[x, 1.2, 0]}>
            {fem ? (
              <>
                <Cap p={[0, -0.38, 0]} r={0.16} l={0.3} c={look.skin} />
                <Cap p={[0, -0.82, 0]} r={0.175} l={0.34} c="#f8fafc" />
              </>
            ) : (
              <Cap p={[0, -0.6, 0]} r={0.18} l={0.85} c={pants} />
            )}
            <Ball p={[0, -1.14, 0.1]} r={0.26} s={[0.95, 0.55, 1.55]} c={fem ? '#161616' : '#f1f5f9'} />
            {!fem && <Ball p={[0, -1.24, 0.1]} r={0.26} s={[0.98, 0.18, 1.58]} c="#9ca3af" />}
          </group>
        ))}
        {/* torso */}
        {fem ? (
          <>
            <Cap p={[0, 1.95, 0]} r={0.38} l={0.3} c={look.shirt} s={[1.08, 1, 0.66]} ol />
            <Cyl p={[0, 2.38, 0]} a={[0.36, 0.44, 0.1, 16]} c="#f8fafc" />
            <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.78, 0.7, 12]} />
              <meshLambertMaterial color={skirt} flatShading />
            </mesh>
            <Cyl p={[0, 0.97, 0]} a={[0.79, 0.79, 0.05, 12]} c="#f8fafc" />
            {/* ribbon */}
            <group position={[0, 2.2, 0.34]}>
              <Ball p={[-0.14, 0, 0]} r={0.12} c="#dc2626" s={[1.3, 0.9, 0.6]} />
              <Ball p={[0.14, 0, 0]} r={0.12} c="#dc2626" s={[1.3, 0.9, 0.6]} />
              <Ball p={[0, 0, 0.02]} r={0.07} c="#b91c1c" />
            </group>
          </>
        ) : (
          <>
            <Cap p={[0, 1.82, 0]} r={0.44} l={0.4} c={look.shirt} s={[1.15, 1, 0.62]} ol />
            <Cyl p={[0, 1.28, 0]} a={[0.5, 0.5, 0.14, 16]} c="#1f2937" />
            {/* hoodie: hood sa likod, bulsa, tali */}
            <Ball p={[0, 2.45, -0.3]} r={0.38} c={shirtLight} s={[1.25, 0.7, 0.7]} />
            <Box p={[0, 1.55, 0.29]} s={[0.7, 0.3, 0.06]} c={shirtLight} />
            <Cyl p={[-0.13, 2.18, 0.3]} a={[0.02, 0.02, 0.5, 6]} c="#f8fafc" />
            <Cyl p={[0.13, 2.18, 0.3]} a={[0.02, 0.02, 0.5, 6]} c="#f8fafc" />
          </>
        )}
        {/* arms */}
        {[[armL, -1], [armR, 1]].map(([ar, d]) => (
          <group key={d} ref={ar} position={[d * (fem ? 0.55 : 0.66), 2.3, 0]}>
            <Cap p={[0, -0.2, 0]} r={0.16} l={0.18} c={look.shirt} />
            <Cap p={[0, -0.58, 0]} r={0.125} l={0.3} c={fem ? look.skin : look.shirt} />
            <Ball p={[0, -0.9, 0]} r={0.15} c={look.skin} />
          </group>
        ))}
        {/* head (chibi: malaki) */}
        <group ref={head} position={[0, 3.05, 0]}>
          <mesh castShadow scale={[1, 0.96, 0.97]}>
            <sphereGeometry args={[0.72, 28, 20]} />
            <meshLambertMaterial color={look.skin} />
          </mesh>
          <mesh scale={[1.05, 1.01, 1.02]}>
            <sphereGeometry args={[0.72, 20, 14]} />
            <primitive object={OUTLINE_MAT} attach="material" dispose={null} />
          </mesh>
          {/* ears */}
          {[-1, 1].map((d) => <Ball key={d} p={[d * 0.7, -0.04, 0]} r={0.11} c={look.skin} s={[0.6, 1, 1]} />)}
          {/* anime eyes + kilay */}
          {[-1, 1].map((d) => (
            <group key={d}>
              <group ref={(e) => { eyeRefs.current[d < 0 ? 0 : 1] = e }} position={[d * 0.27, -0.02, 0.63]}>
                <mesh scale={[1, 1.3, 0.45]}><sphereGeometry args={[0.15, 12, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
                <mesh position={[0, -0.01, 0.05]} scale={[1, 1.2, 0.5]}><sphereGeometry args={[0.105, 12, 12]} /><meshBasicMaterial color="#2b1b12" /></mesh>
                <mesh position={[0, 0, 0.08]} scale={[1, 1.2, 0.4]}><sphereGeometry args={[0.06, 10, 10]} /><meshBasicMaterial color="#000000" /></mesh>
                <mesh position={[d * 0.03, 0.07, 0.1]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
                <mesh position={[-d * 0.03, -0.06, 0.1]}><sphereGeometry args={[0.018, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
              </group>
              <mesh position={[d * 0.27, 0.3, 0.6]} rotation={[0, 0, cry ? -d * 0.3 : d * 0.08]}>
                <boxGeometry args={[0.26, 0.05, 0.05]} /><meshBasicMaterial color={look.hair} />
              </mesh>
            </group>
          ))}
          {/* ilong + bibig */}
          <Ball p={[0, -0.12, 0.7]} r={0.035} c={look.skin} />
          <mesh position={[0, cry ? -0.4 : -0.32, 0.65]} rotation={[0, 0, cry ? 0 : Math.PI]}>
            <torusGeometry args={[0.08, 0.02, 6, 12, Math.PI]} /><meshBasicMaterial color="#7a2e2e" />
          </mesh>
          {cry && (
            <>
              <mesh ref={tearL} position={[-0.27, -0.12, 0.7]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#60c8ff" /></mesh>
              <mesh ref={tearR} position={[0.27, -0.12, 0.7]}><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color="#60c8ff" /></mesh>
            </>
          )}
          {fem && (
            <>
              <mesh position={[-0.42, -0.16, 0.55]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.12, 8, 8]} /><meshBasicMaterial color="#f472b6" transparent opacity={0.6} /></mesh>
              <mesh position={[0.42, -0.16, 0.55]} scale={[1, 0.6, 0.4]}><sphereGeometry args={[0.12, 8, 8]} /><meshBasicMaterial color="#f472b6" transparent opacity={0.6} /></mesh>
            </>
          )}
          {/* hair: takip sa ulo + bangs */}
          <mesh castShadow rotation={[-0.45, 0, 0]} position={[0, 0.04, -0.06]}>
            <sphereGeometry args={[0.8, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshLambertMaterial color={look.hair} {...hairMat} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const bx = (i - 2.5) * 0.22
            const by = 0.46 - Math.abs(bx) * 0.25
            const bz = Math.sqrt(Math.max(0.05, 0.5184 - by * by - bx * bx)) + 0.03
            return <Ball key={i} p={[bx, by, bz]} r={0.2} c={look.hair} s={[1.1, 0.8, 0.7]} />
          })}
          {/* style 0: maikli (lalaki: matulis na spikes) */}
          {st === 0 && !fem && Array.from({ length: 8 }, (_, k) => (
            <group key={k} rotation={[0, 0.9 + k * ((Math.PI * 2 - 1.8) / 7), 0]}>
              <mesh position={[0, 0.62, 0.3]} rotation={[0.8, 0, 0]} castShadow>
                <coneGeometry args={[0.2, 0.55, 8]} /><meshLambertMaterial color={look.hair} />
              </mesh>
            </group>
          ))}
          {/* style 1: bushy */}
          {st === 1 && [[-0.4, 0.62, 0], [0, 0.78, 0], [0.4, 0.62, 0], [-0.62, 0.3, -0.2], [0.62, 0.3, -0.2]].map(([hx, hy, hz]) => (
            <Ball key={hx + '_' + hy} p={[hx, hy, hz]} r={0.3} c={look.hair} />
          ))}
          {/* style 2: mahaba */}
          {st === 2 && (
            <>
              <Cap p={[0, -0.95, -0.4]} r={0.55} l={1.2} c={look.hair} s={[1.25, 1, 0.5]} />
              <Cap p={[-0.68, -0.55, 0.12]} r={0.13} l={0.9} c={look.hair} />
              <Cap p={[0.68, -0.55, 0.12]} r={0.13} l={0.9} c={look.hair} />
            </>
          )}
          {/* babaeng maikli/bushy: shoulder-length na gilid */}
          {fem && st !== 2 && (
            <>
              <Cap p={[-0.68, -0.35, -0.05]} r={0.14} l={0.7} c={look.hair} />
              <Cap p={[0.68, -0.35, -0.05]} r={0.14} l={0.7} c={look.hair} />
            </>
          )}
        </group>
      </group>
      {cry && bubble && (
        <group ref={bubbleRef} visible={false}>
          <Billboard position={[0, 5.5, 0]}>
            <mesh ref={bgR} position={[0, 0, -0.02]} scale={[bubble.length * 0.27 + 0.9, 1, 1]}>
              <planeGeometry args={[1, 1.05]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh ref={bdR} position={[0, 0, -0.03]} scale={[bubble.length * 0.27 + 1.1, 1, 1]}>
              <planeGeometry args={[1, 1.25]} />
              <meshBasicMaterial color="#1e3a8a" />
            </mesh>
            <Text ref={textR} fontSize={0.48} color="#1e293b" anchorX="center" anchorY="middle">{bubble}</Text>
          </Billboard>
        </group>
      )}
      {label && (
        <Billboard position={[0, 4.7, 0]}>
          <Text fontSize={0.5} color="#ffffff" outlineWidth={0.07} outlineColor="#1e3a8a" anchorX="center" anchorY="middle">{label}</Text>
        </Billboard>
      )}
    </group>
  )
})

// ---------- day / night + weather ----------
// shared materials na umiilaw kapag gabi (ina-update bawat frame sa Scene3D)
const WINDOW_MAT = new THREE.MeshLambertMaterial({ color: '#bfe9ff', emissive: '#ffd27a', emissiveIntensity: 0 })
const HEAD_MAT = new THREE.MeshLambertMaterial({ color: '#fff3a0', emissive: '#fff3a0', emissiveIntensity: 0.1 })
const GLOW_MAT = new THREE.MeshBasicMaterial({ color: '#ffe9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
const POOL_MAT = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })

// [oras, tuktok ng langit, abot-tanaw, hemi light, araw/buwan light, kulay ng light, bituin]
const KF = [
  [0,    '#050a1f', '#16224a', 0.35, 0.35, '#9fb4ff', 1],
  [5,    '#07102a', '#1c2a55', 0.35, 0.35, '#9fb4ff', 1],
  [6,    '#3b4c86', '#ff9a6a', 0.5,  0.7,  '#ffb27a', 0.35],
  [7.5,  '#4d8ee0', '#ffd9b0', 0.75, 1.25, '#fff0d8', 0],
  [9,    '#3f8fe0', '#cdeeff', 0.85, 1.5,  '#ffffff', 0],
  [16,   '#3f8fe0', '#cdeeff', 0.85, 1.5,  '#ffffff', 0],
  [17.5, '#4a6cc0', '#ffc38a', 0.7,  1.1,  '#ffc08a', 0],
  [18.5, '#34447f', '#ff8a5c', 0.5,  0.6,  '#ff9a6a', 0.35],
  [19.5, '#0e1636', '#2c2d5c', 0.38, 0.38, '#9fb4ff', 0.9],
  [20.5, '#050a1f', '#16224a', 0.35, 0.35, '#9fb4ff', 1],
  [24,   '#050a1f', '#16224a', 0.35, 0.35, '#9fb4ff', 1],
].map(([h, t, o, hm, li, lc, st]) => [h, new THREE.Color(t), new THREE.Color(o), hm, li, new THREE.Color(lc), st])
const SK = { top: new THREE.Color(), hor: new THREE.Color(), lightColor: new THREE.Color(), hemi: 1, light: 1, star: 0 }
function skyAt(h, cloud) {
  let i = 0
  while (i < KF.length - 2 && h >= KF[i + 1][0]) i++
  const A = KF[i], B = KF[i + 1], f = (h - A[0]) / (B[0] - A[0])
  SK.top.copy(A[1]).lerp(B[1], f); SK.hor.copy(A[2]).lerp(B[2], f); SK.lightColor.copy(A[5]).lerp(B[5], f)
  SK.hemi = A[3] + (B[3] - A[3]) * f
  SK.light = A[4] + (B[4] - A[4]) * f
  SK.star = A[6] + (B[6] - A[6]) * f
  // makulimlim / maulan: kulay-abo at mas madilim
  const g = Math.min(1, cloud * 0.85)
  ;[SK.top, SK.hor].forEach((c) => {
    const l = (c.r * 0.3 + c.g * 0.59 + c.b * 0.11) * (1 - 0.3 * g)
    c.r += (l - c.r) * g; c.g += (l - c.g) * g; c.b += (l - c.b) * g
  })
  SK.light *= 1 - 0.65 * cloud
  SK.hemi *= 1 - 0.2 * cloud
  return SK
}
const STAR_POS = (() => {
  const a = new Float32Array(360 * 3)
  for (let i = 0; i < 360; i++) {
    const th = Math.random() * Math.PI * 2, y = 0.06 + Math.random() * 0.94, r = Math.sqrt(1 - y * y)
    a[i * 3] = Math.cos(th) * r * 350; a[i * 3 + 1] = y * 350; a[i * 3 + 2] = Math.sin(th) * r * 350
  }
  return a
})()
const _sd = new THREE.Vector3()

// patak ng ulan sa paligid ng player
function Rain({ envR, cam }) {
  const N = 900
  const ref = useRef(), geo = useRef()
  const data = useMemo(() => Float32Array.from({ length: N * 3 }, (_, i) => (i % 3 === 1 ? Math.random() * 28 : (Math.random() - 0.5) * 50)), [])
  const pos = useMemo(() => new Float32Array(N * 6), [])
  useFrame((_, dt0) => {
    const dt = Math.min(dt0, 0.05), r = envR.current.rain, g = ref.current
    g.visible = r > 0.03
    if (!g.visible) return
    g.position.set(cam.current.px, 0, cam.current.pz)
    const n = Math.floor(N * r)
    for (let i = 0; i < n; i++) {
      let y = data[i * 3 + 1] - 55 * dt
      if (y < 0) y += 28
      data[i * 3 + 1] = y
      const x = data[i * 3], z = data[i * 3 + 2]
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = z
      pos[i * 6 + 3] = x + 0.12; pos[i * 6 + 4] = y - 0.9; pos[i * 6 + 5] = z
    }
    geo.current.attributes.position.needsUpdate = true
    geo.current.setDrawRange(0, n * 2)
  })
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <lineBasicMaterial color="#bcd4ff" transparent opacity={0.5} fog={false} />
    </lineSegments>
  )
}

function Lamp({ p, s }) {
  return <mesh position={p}><boxGeometry args={s} /><primitive object={HEAD_MAT} attach="material" dispose={null} /></mesh>
}

// ---------- world pieces ----------
// ---------- dagdag na palamuti para sa bawat espesyal na lugar ----------
function Flag({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 5, 0]} a={[0.08, 0.1, 10, 8]} c="#d1d5db" />
      <Box p={[0.95, 9.2, 0]} s={[1.9, 0.55, 0.06]} c="#0038a8" cast={false} />
      <Box p={[0.95, 8.65, 0]} s={[1.9, 0.55, 0.06]} c="#ce1126" cast={false} />
      <Box p={[0.95, 8.9, 0.02]} s={[0.5, 1.1, 0.06]} c="#ffffff" cast={false} />
    </group>
  )
}
function Decor({ p }) {
  const cx = (p.x + p.w / 2) * S, zf = p.base * S, W = p.w * S
  const roofY = 10.4, zr = zf - 4.75
  switch (p.id) {
    case 'hospital':
      return (
        <group>
          <Box p={[cx, roofY + 1.7, zr]} s={[0.9, 3, 0.5]} c="#dc2626" />
          <Box p={[cx, roofY + 1.7, zr]} s={[3, 0.9, 0.5]} c="#dc2626" />
          <Box p={[cx, 8.1, zf + 0.12]} s={[W, 0.25, 0.1]} c="#dc2626" cast={false} />
        </group>
      )
    case 'church':
      return (
        <group>
          <Box p={[cx, roofY + 2.8, zr]} s={[3.6, 5.6, 3.6]} c="#e7e5e4" />
          <mesh position={[cx, roofY + 7.2, zr]} rotation-y={Math.PI / 4} castShadow><coneGeometry args={[2.9, 3.6, 4]} /><meshLambertMaterial color="#78350f" /></mesh>
          <Box p={[cx, roofY + 10.3, zr]} s={[0.3, 2, 0.3]} c="#fcd116" />
          <Box p={[cx, roofY + 10.6, zr]} s={[1.2, 0.3, 0.3]} c="#fcd116" />
          <mesh position={[cx, roofY + 3.4, zr + 1.85]}><boxGeometry args={[1.2, 2.4, 0.1]} /><primitive object={WINDOW_MAT} attach="material" dispose={null} /></mesh>
        </group>
      )
    case 'police':
      return (
        <group>
          <Box p={[cx, 8.1, zf + 0.12]} s={[W, 0.3, 0.1]} c="#1e3a8a" cast={false} />
          <Box p={[cx - 0.8, roofY + 0.45, zr]} s={[1.4, 0.5, 0.8]} c="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
          <Box p={[cx + 0.8, roofY + 0.45, zr]} s={[1.4, 0.5, 0.8]} c="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.6} />
        </group>
      )
    case 'school':
      return <Flag x={(p.x + p.w - 30) * S} z={zf + 2.6} />
    case 'barangay':
      return <Flag x={(p.x + p.w - 20) * S} z={zf + 2.6} />
    case 'gym':
      return (
        <group>
          <mesh position={[cx, roofY + 1.4, zr]} castShadow><sphereGeometry args={[1.5, 16, 12]} /><meshLambertMaterial color="#f97316" /></mesh>
          <mesh position={[cx, roofY + 1.4, zr]} rotation-x={Math.PI / 2}><torusGeometry args={[1.5, 0.05, 6, 20]} /><meshBasicMaterial color="#1f2937" /></mesh>
          <Box p={[cx, 8.1, zf + 0.12]} s={[W, 0.3, 0.1]} c="#f97316" cast={false} />
        </group>
      )
    case 'mall':
      return (
        <group>
          <Box p={[cx, roofY + 2, zr]} s={[W * 0.45, 3, 0.6]} c="#4c1d95" />
          <Text position={[cx, roofY + 2, zr + 0.34]} fontSize={1.5} color="#fde047" anchorX="center" anchorY="middle">MALL</Text>
        </group>
      )
    case 'bakery':
      return (
        <mesh position={[cx, roofY + 1, zr]} scale={[2.2, 1.1, 1.2]} castShadow><sphereGeometry args={[1, 14, 10]} /><meshLambertMaterial color="#d97706" /></mesh>
      )
    case 'library':
      return (
        <group>
          {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map((c, i) => (
            <Box key={c} p={[cx - 1.6 + i * 0.8, roofY + 1 + (i % 2) * 0.2, zr]} s={[0.6, 1.8 + (i % 3) * 0.3, 1.2]} c={c} />
          ))}
        </group>
      )
    case 'barber':
      return (
        <group position={[(p.door - 70) * S, 0, zf + 1.2]}>
          {[0, 1, 2, 3, 4, 5].map((i) => <Cyl key={i} p={[0, 0.6 + i * 0.6, 0]} a={[0.32, 0.32, 0.6, 12]} c={i % 2 ? '#ffffff' : '#dc2626'} />)}
          <Cyl p={[0, 4.1, 0]} a={[0.4, 0.4, 0.25, 12]} c="#3b82f6" />
        </group>
      )
    case 'hardware':
      return (
        <group position={[(p.door + 90) * S, 0, zf + 1.4]}>
          <Box p={[0, 0.5, 0]} s={[1.4, 1, 1.4]} c="#b45309" />
          <Box p={[0.3, 1.45, 0]} s={[1.2, 0.9, 1.2]} c="#d97706" />
          <Box p={[-1.7, 0.4, 0.2]} s={[1.2, 0.8, 1.2]} c="#92400e" />
        </group>
      )
    default:
      return null
  }
}

function Building({ p }) {
  const zf = p.base * S
  const cx = (p.x + p.w / 2) * S
  const W = p.w * S
  return (
    <group>
      <Box p={[cx, 4.5, zf - 5]} s={[W, 9, 10]} c={p.color} />
      {/* pundasyon at cornice */}
      <Box p={[cx, 0.35, zf + 0.06]} s={[W + 0.2, 0.7, 0.3]} c="#6b7280" />
      <Box p={[cx, 8.75, zf + 0.1]} s={[W + 0.3, 0.4, 0.5]} c="#f8fafc" />
      {/* bubong */}
      <Box p={[cx, 9.3, zf - 4.75]} s={[(p.w + 20) * S, 1.4, 10.5]} c={p.roof} />
      <Box p={[cx, 10.15, zf - 4.75]} s={[W - 1, 0.5, 7]} c={p.roof} />
      <Text position={[cx, 9.3, zf + 0.52]} fontSize={0.95} color="#ffffff" outlineWidth={0.05} outlineColor="#000000" outlineOpacity={0.4} anchorX="center" anchorY="middle">{p.label}</Text>
      {[p.x + 28, p.x + p.w - 98].map((wx) => {
        const wcx = (wx + 35) * S
        return (
          <group key={wx}>
            <Box p={[wcx, 6.25, zf + 0.05]} s={[78 * S, 3.1, 0.1]} c="#ffffff" />
            <mesh position={[wcx, 6.25, zf + 0.1]}><boxGeometry args={[70 * S, 2.7, 0.1]} /><primitive object={WINDOW_MAT} attach="material" dispose={null} /></mesh>
            <Box p={[wcx, 6.25, zf + 0.15]} s={[4 * S, 2.7, 0.08]} c="#ffffff" />
            <Box p={[wcx, 6.3, zf + 0.15]} s={[70 * S, 4 * S, 0.08]} c="#ffffff" />
            {/* sill + shutters */}
            <Box p={[wcx, 4.6, zf + 0.25]} s={[78 * S + 0.5, 0.18, 0.5]} c="#e5e7eb" />
            <Box p={[wcx - 2.15, 6.25, zf + 0.12]} s={[0.35, 3.1, 0.12]} c={p.roof} />
            <Box p={[wcx + 2.15, 6.25, zf + 0.12]} s={[0.35, 3.1, 0.12]} c={p.roof} />
          </group>
        )
      })}
      {/* pinto: frame, bintana, hakbang */}
      <Box p={[p.door * S, 2.75, zf + 0.06]} s={[3.5, 5.5, 0.2]} c="#f8fafc" />
      <Box p={[p.door * S, 2.6, zf + 0.12]} s={[3, 5.2, 0.3]} c="#4a2c17" />
      <mesh position={[p.door * S, 3.7, zf + 0.29]}><boxGeometry args={[1.6, 1.5, 0.06]} /><primitive object={WINDOW_MAT} attach="material" dispose={null} /></mesh>
      <Box p={[p.door * S, 0.12, zf + 0.7]} s={[4, 0.24, 1.3]} c="#d6d3d1" />
      <mesh position={[(p.door + 20) * S, 2.6, zf + 0.35]}><sphereGeometry args={[0.15, 8, 8]} /><meshLambertMaterial color="#fcd116" /></mesh>
      {p.awning && (
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <group key={i}>
              <Box p={[(p.door - 100 + i * 20 + 10) * S, 5.2, zf + 0.95]} s={[1, 0.12, 1.9]} r={[0.3, 0, 0]} c={i % 2 ? '#ffffff' : '#d62828'} />
              <Box p={[(p.door - 100 + i * 20 + 10) * S, 4.78, zf + 1.9]} s={[1, 0.3, 0.06]} c={i % 2 ? '#ffffff' : '#d62828'} />
            </group>
          ))}
          <Box p={[(p.door - 100) * S, 2.4, zf + 1.7]} s={[0.15, 4.8, 0.15]} c="#4b5563" />
          <Box p={[(p.door + 100) * S, 2.4, zf + 1.7]} s={[0.15, 4.8, 0.15]} c="#4b5563" />
        </>
      )}
      <Decor p={p} />
      {/* yellow entrance marker */}
      <Box p={[p.door * S, p.base < 600 || p.base > 2000 ? 0.17 : 0.09, (p.base + 27) * S]} s={[1.8, 0.02, 0.5]} c="#fcd116" cast={false} />
    </group>
  )
}

// pakurbang puno ng niyog: mga segment ng trunk, 9 na dahon na nakalaylay, bunga
const PALM_PTS = Array.from({ length: 7 }, (_, i) => [0.035 * i * i, i * 1.4])
function Palm({ x, z }) {
  return (
    <group position={[x * S, 0, z * S]}>
      <Cyl p={[0, 0.25, 0]} a={[0.55, 0.65, 0.5, 10]} c="#7c4a21" />
      {PALM_PTS.slice(0, 6).map(([px, py], i) => {
        const [nx, ny] = PALM_PTS[i + 1]
        const dx = nx - px, dy = ny - py, len = Math.hypot(dx, dy)
        return (
          <mesh key={i} position={[(px + nx) / 2, (py + ny) / 2, 0]} rotation={[0, 0, -Math.atan2(dx, dy)]} castShadow receiveShadow>
            <cylinderGeometry args={[0.36 - i * 0.03, 0.4 - i * 0.03, len + 0.08, 9]} />
            <meshLambertMaterial color={i % 2 ? '#8a5a2b' : '#7c4a21'} />
          </mesh>
        )
      })}
      <group position={[PALM_PTS[6][0], PALM_PTS[6][1], 0]}>
        {Array.from({ length: 9 }, (_, k) => (
          <group key={k} rotation={[0, (k * Math.PI * 2) / 9 + 0.2, 0]}>
            <mesh position={[1.4, 0.05, 0]} rotation={[0, 0, -0.25]} scale={[1, 0.1, 0.38]} castShadow>
              <sphereGeometry args={[1.6, 10, 8]} />
              <meshLambertMaterial color={k % 2 ? '#2f9e44' : '#38a84e'} />
            </mesh>
            <mesh position={[3.0, -0.5, 0]} rotation={[0, 0, -0.85]} scale={[1, 0.1, 0.34]} castShadow>
              <sphereGeometry args={[1.25, 10, 8]} />
              <meshLambertMaterial color={k % 2 ? '#278a3b' : '#2f9e44'} />
            </mesh>
          </group>
        ))}
        {[[0.3, -0.35, 0.1], [-0.25, -0.3, 0.15], [0, -0.4, -0.3]].map(([nx, ny, nz]) => (
          <mesh key={nx} position={[nx, ny, nz]} castShadow><sphereGeometry args={[0.3, 10, 10]} /><meshLambertMaterial color="#6b3f1d" /></mesh>
        ))}
      </group>
    </group>
  )
}

function Bench({ x, z }) {
  return (
    <group position={[x * S, 0, z * S]}>
      {/* upuan (slats) */}
      {[-0.45, 0, 0.45].map((dz) => <Box key={dz} p={[0, 1.25, dz]} s={[4.2, 0.14, 0.36]} c="#a0692f" />)}
      {/* sandalan */}
      {[1.55, 1.95, 2.35].map((y, i) => <Box key={y} p={[0, y, -0.68 - i * 0.04]} s={[4.2, 0.28, 0.1]} c="#a0692f" r={[-0.12, 0, 0]} />)}
      {/* metal na frame + armrest */}
      {[-1, 1].map((d) => (
        <group key={d}>
          <Box p={[d * 1.85, 0.62, 0]} s={[0.16, 1.24, 1.2]} c="#374151" />
          <Box p={[d * 1.95, 1.75, -0.6]} s={[0.14, 1.5, 0.14]} c="#374151" />
          <Box p={[d * 1.95, 1.7, 0.1]} s={[0.14, 0.14, 1.3]} c="#374151" />
        </group>
      ))}
    </group>
  )
}

function Fountain({ x, z }) {
  return (
    <group position={[x * S, 0, z * S]}>
      <Cyl p={[0, 0.7, 0]} a={[3.5, 3.6, 1.4, 28]} c="#bdb8b4" />
      <mesh position={[0, 1.4, 0]} rotation-x={Math.PI / 2} castShadow><torusGeometry args={[3.5, 0.2, 8, 36]} /><meshLambertMaterial color="#cfcac6" /></mesh>
      <Cyl p={[0, 1.4, 0]} a={[3.2, 3.2, 0.06, 28]} c="#38bdf8" />
      <Cyl p={[0, 2.6, 0]} a={[0.5, 0.6, 3.2, 12]} c="#bdb8b4" />
      <Cyl p={[0, 4.2, 0]} a={[1.8, 1.0, 0.5, 20]} c="#bdb8b4" />
      <mesh position={[0, 4.45, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[1.8, 0.1, 6, 24]} /><meshLambertMaterial color="#cfcac6" /></mesh>
      <mesh position={[0, 4.9, 0]}><sphereGeometry args={[0.5, 12, 12]} /><meshLambertMaterial color="#bae6fd" /></mesh>
    </group>
  )
}

function Jeep({ color }) {
  return (
    <group>
      <Box p={[0, 0.95, 0]} s={[5.6, 1, 2.6]} c={color} />
      <Box p={[0, 0.75, 0]} s={[5.62, 0.18, 2.62]} c="#fcd116" />
      {/* asul na guhit sa gilid */}
      <Box p={[0, 1.3, 1.31]} s={[5.4, 0.16, 0.02]} c="#0038a8" />
      <Box p={[0, 1.3, -1.31]} s={[5.4, 0.16, 0.02]} c="#0038a8" />
      <Box p={[0, 1.73, 0]} s={[4.7, 0.55, 2.4]} c="#bfe9ff" transparent opacity={0.4} />
      {[-2, -0.7, 0.7, 2].map((x) => <Box key={x} p={[x, 1.73, 0]} s={[0.14, 0.56, 2.5]} c={color} />)}
      <Box p={[0, 2.06, 0]} s={[4.9, 0.14, 2.7]} c={color} />
      {/* luggage rack */}
      <Box p={[-0.2, 2.2, 0]} s={[3.6, 0.06, 2.2]} c="#9ca3af" />
      {/* bumper, grille, visor */}
      <Box p={[2.9, 0.55, 0]} s={[0.18, 0.28, 2.5]} c="#d1d5db" />
      <Box p={[-2.9, 0.55, 0]} s={[0.18, 0.28, 2.5]} c="#d1d5db" />
      <Box p={[2.82, 1.0, 0]} s={[0.06, 0.4, 1.1]} c="#111111" />
      <Box p={[2.55, 2.2, 0]} s={[0.7, 0.08, 2.7]} c="#fcd116" />
      <Lamp p={[2.82, 0.95, 0.8]} s={[0.1, 0.3, 0.4]} />
      <Lamp p={[2.82, 0.95, -0.8]} s={[0.1, 0.3, 0.4]} />
      {[[-1.9, 1.25], [1.9, 1.25], [-1.9, -1.25], [1.9, -1.25]].map(([x, z]) => (
        <group key={x + '_' + z} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
          <Cyl a={[0.5, 0.5, 0.32, 14]} c="#111111" />
          <Cyl a={[0.2, 0.2, 0.34, 10]} c="#9ca3af" />
        </group>
      ))}
    </group>
  )
}

// mga bulaklak sa parke (nakapirming posisyon, hindi tumatama sa daan, fountain, bench, palm)
const FLOWERS = (() => {
  const out = []
  let s = 7
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  while (out.length < 70) {
    const x = 90 + rnd() * 1060, z = 830 + rnd() * 790
    if (z > 1170 && z < 1270) continue
    if (x > 530 && x < 630) continue
    if (Math.hypot(x - 580, z - 1225) < 120) continue
    if (BENCHES.some(([a, b, c, d]) => x > a - 30 && x < c + 30 && z > b - 30 && z < d + 30)) continue
    if (PALMS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 30)) continue
    out.push([x, z, ['#f472b6', '#fde047', '#ffffff', '#fb923c', '#a78bfa'][out.length % 5]])
  }
  return out
})()
function Flowers() {
  return (
    <group>
      {FLOWERS.map(([fx, fz, col], i) => (
        <group key={i} position={[fx * S, 0.03, fz * S]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.02, 0.02, 0.24, 5]} /><meshLambertMaterial color="#2f7d32" /></mesh>
          <mesh position={[0, 0.28, 0]}><sphereGeometry args={[0.13, 8, 6]} /><meshLambertMaterial color={col} /></mesh>
          <mesh position={[0, 0.3, 0.1]}><sphereGeometry args={[0.05, 6, 6]} /><meshBasicMaterial color="#facc15" /></mesh>
        </group>
      ))}
    </group>
  )
}

function Ground() {
  const dashesH = []
  for (let x = 0; x < WW; x += 90) if (x < VROAD.x - 40 || x > VROAD.x + VROAD.w + 40) dashesH.push(x)
  const dashesV = []
  for (let y = 770; y < WH; y += 90) if (y < ROAD2.y - 20 || y > ROAD2.y + ROAD2.h) dashesV.push(y)
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
      {[1200, 1400].map((vx) => (
        <group key={vx}>
          <Rect x={vx} z={760} w={40} d={ROAD2.y - 40 - 760} h={0.16} c="#d6d3d1" />
          <Rect x={vx} z={ROAD2.y + ROAD2.h + 40} w={40} d={WH - (ROAD2.y + ROAD2.h + 40)} h={0.16} c="#d6d3d1" />
        </group>
      ))}
      {/* second road (south) + sidewalks */}
      {[[0, 1240], [1400, WW - 1400]].map(([sx, sw]) => (
        <group key={sx}>
          <Rect x={sx} z={ROAD2.y - 40} w={sw} d={40} h={0.16} c="#d6d3d1" />
          <Rect x={sx} z={ROAD2.y + ROAD2.h} w={sw} d={40} h={0.16} c="#d6d3d1" />
          <Rect x={sx} z={2160} w={sw} d={60} h={0.16} c="#d6d3d1" />
        </group>
      ))}
      <Rect x={0} z={ROAD2.y} w={WW} d={ROAD2.h} h={0.06} c="#4b5563" />
      {dashesH.map((x) => <Rect key={'h2' + x} x={x} z={ROAD2.y + ROAD2.h / 2 - 4} w={48} d={8} y={0.06} h={0.02} c="#fcd116" />)}
      {/* south plaza */}
      <Rect x={2150} z={2230} w={500} d={420} h={0.05} c="#e7d3a7" />
      {/* roads */}
      <Rect x={0} z={540} w={WW} d={160} h={0.06} c="#4b5563" />
      <Rect x={1240} z={700} w={160} d={WH - 700} h={0.06} c="#4b5563" />
      {dashesH.map((x) => <Rect key={'h' + x} x={x} z={618} w={48} d={8} y={0.06} h={0.02} c="#fcd116" />)}
      {dashesV.map((y) => <Rect key={'v' + y} x={1316} z={y} w={8} d={48} y={0.06} h={0.02} c="#fcd116" />)}
    </group>
  )
}

// ---------- palaisdaan (fishpond) ----------
const FISH_COL = ['#fb923c', '#e5e7eb', '#fbbf24', '#f97316', '#d1d5db', '#fdba74']
const PADS = [[3120, 2450, 1], [3250, 2560, 0.8], [3560, 2480, 1.1], [3700, 2600, 0.9], [3820, 2440, 0.8], [3300, 2420, 0.7], [3650, 2410, 0.9], [3100, 2600, 0.8]]
function Pond() {
  const fish = useRef([])
  const rings = useRef([])
  const cx = (POND.x + POND.w / 2) * S, cz = (POND.z + POND.d / 2) * S
  const rx = (POND.w / 2) * S - 3, rz = (POND.d / 2) * S - 2.5
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    fish.current.forEach((g, i) => {
      if (!g) return
      const sp = 0.25 + (i % 3) * 0.08, ph = i * 1.7, k = 0.55 + (i % 4) * 0.12
      const a = t * sp * (i % 2 ? 1 : -1) + ph
      g.position.set(cx + Math.cos(a) * rx * k, 0.05, cz + Math.sin(a) * rz * k)
      g.rotation.y = -a + (i % 2 ? -Math.PI / 2 : Math.PI / 2)
      g.children[1].rotation.y = Math.sin(t * 8 + i) * 0.5
    })
    rings.current.forEach((m, i) => {
      if (!m) return
      const ph = (t * 0.35 + i * 0.33) % 1
      m.scale.setScalar(0.4 + ph * 2.2)
      m.material.opacity = (1 - ph) * 0.5
    })
  })
  const dx = POND.dock[0] * S
  return (
    <group>
      {/* banko ng putik / bato */}
      <Rect x={POND.x - 40} z={POND.z - 40} w={POND.w + 80} d={POND.d + 80} h={0.05} c="#a3865a" />
      <Rect x={POND.x - 15} z={POND.z - 15} w={POND.w + 30} d={POND.d + 30} h={0.07} c="#78716c" />
      {/* tubig */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.1, cz]}>
        <planeGeometry args={[POND.w * S, POND.d * S]} />
        <meshLambertMaterial color="#38bdf8" transparent opacity={0.78} />
      </mesh>
      {/* ripples */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => (rings.current[i] = m)} rotation-x={-Math.PI / 2} position={[cx - 8 + i * 8, 0.12, cz + (i - 1) * 3]}>
          <ringGeometry args={[0.8, 1, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
      {/* mga isda sa ilalim */}
      {FISH_COL.map((c, i) => (
        <group key={i} ref={(g) => (fish.current[i] = g)}>
          <mesh scale={[0.55, 0.2, 0.22]}><sphereGeometry args={[1, 10, 8]} /><meshLambertMaterial color={c} /></mesh>
          <mesh position={[-0.55, 0, 0]} rotation-z={Math.PI / 2}><coneGeometry args={[0.2, 0.35, 4]} /><meshLambertMaterial color={c} /></mesh>
        </group>
      ))}
      {/* lily pads + bulaklak */}
      {PADS.map(([x, z, k], i) => (
        <group key={i} position={[x * S, 0.12, z * S]} scale={k}>
          <mesh rotation-x={-Math.PI / 2}><circleGeometry args={[0.55, 14]} /><meshLambertMaterial color="#2f9e44" /></mesh>
          {i % 3 === 0 && <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.18, 8, 6]} /><meshLambertMaterial color="#f9a8d4" /></mesh>}
        </group>
      ))}
      {/* tambo (reeds) sa gilid */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = POND.x + 40 + i * ((POND.w - 80) / 17), z = i % 2 ? POND.z + POND.d - 8 : POND.z + POND.d + 6
        if (Math.abs(x - POND.dock[0]) < 60 && false) return null
        return (
          <group key={i} position={[x * S, 0, z * S]}>
            <Cyl p={[0, 0.9, 0]} a={[0.04, 0.06, 1.8, 5]} c="#65a30d" />
            <Cyl p={[0.12, 0.7, 0.05]} a={[0.04, 0.06, 1.4, 5]} c="#84cc16" />
            <Cyl p={[0, 1.85, 0]} a={[0.1, 0.1, 0.4, 6]} c="#7c4a21" />
          </group>
        )
      })}
      {/* dock */}
      <group position={[dx, 0, POND.dock[1] * S]}>
        {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[0, 0.22, -0.4 + i * 0.95]} s={[4.4, 0.18, 0.85]} c={i % 2 ? '#a16207' : '#92400e'} />)}
        {[[-2.1, 0.5], [2.1, 0.5], [-2.1, 7], [2.1, 7]].map(([x, z], i) => <Cyl key={i} p={[x, 0.5, z]} a={[0.18, 0.18, 1, 8]} c="#78350f" />)}
        <Box p={[-2.1, 1.2, 4.2]} s={[0.12, 0.12, 5.6]} c="#78350f" />
        <Box p={[2.1, 1.2, 4.2]} s={[0.12, 0.12, 5.6]} c="#78350f" />
        <Box p={[3.4, 0.3, 0.6]} s={[1.1, 0.6, 1.1]} c="#b45309" />
      </group>
      {/* karatula */}
      <group position={[dx - 6, 0, (POND.dock[1] - 25) * S]}>
        <Box p={[-1.4, 1.6, 0]} s={[0.25, 3.2, 0.25]} c="#8b5a2b" />
        <Box p={[1.4, 1.6, 0]} s={[0.25, 3.2, 0.25]} c="#8b5a2b" />
        <Box p={[0, 3.3, 0]} s={[4.6, 1.3, 0.3]} c="#8b5a2b" />
        <Text position={[0, 3.3, 0.18]} fontSize={0.7} color="#ffffff" anchorX="center" anchorY="middle">🎣 Palaisdaan</Text>
      </group>
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

function Clouds({ envR }) {
  const g = useRef()
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 }), [])
  const gray = useMemo(() => new THREE.Color('#8a95a3'), [])
  useFrame((_, dt) => {
    const cl = envR.current.cloud
    mat.color.set('#ffffff').lerp(gray, Math.min(1, cl * 0.9))
    g.current.children.forEach((c) => {
      c.position.x += dt * 0.8; if (c.position.x > WW * S + 70) c.position.x = -70
      c.scale.setScalar(1 + cl * 0.6)
    })
  })
  return (
    <group ref={g}>
      {Array.from({ length: 12 }, (_, i) => (
        <group key={i} position={[i * 28 - 60, 32 + (i % 3) * 3, -10 + ((i * 37) % 90)]}>
          <mesh scale={[5, 1.6, 2.6]}><sphereGeometry args={[1, 12, 8]} /><primitive object={mat} attach="material" dispose={null} /></mesh>
          <mesh position={[2.4, 0.9, 0]} scale={[3.2, 1.4, 2.2]}><sphereGeometry args={[1, 12, 8]} /><primitive object={mat} attach="material" dispose={null} /></mesh>
          <mesh position={[-2.6, 0.5, 0.4]} scale={[3, 1.2, 2]}><sphereGeometry args={[1, 12, 8]} /><primitive object={mat} attach="material" dispose={null} /></mesh>
        </group>
      ))}
    </group>
  )
}

// ---------- main scene ----------
export default function Scene3D({ bridge, look }) {
  const { camera, gl } = useThree()
  const light = useRef()
  const hemi = useRef(), fogR = useRef(), skyG = useRef(), sunM = useRef(), moonM = useRef(), starsR = useRef()
  const envR = useRef({ t: null, cloud: 0, rain: 0 })
  const skyGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(400, 24, 16)
    const n = g.attributes.position.count, ys = new Float32Array(n)
    for (let i = 0; i < n; i++) ys[i] = g.attributes.position.getY(i) / 400
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.userData.ys = ys
    return g
  }, [])
  const player = useRef()
  const npcRefs = useRef(NPCS.map(() => ({ current: null })))
  const jeepRefs = useRef([])
  const ps = useRef({ x: 300, z: 520, face: 0 })
  const npcState = useRef(NPCS.map((n) => ({ x: n.x, z: n.y, hx: n.x, hz: n.y, vx: 0, vz: 0, think: Math.random() * 1.8, stop: 0, face: 0, mode: n.cry ? 'cry' : 'idle', mt: 0, li: 0, lt: 0 })))
  const vehicles = useRef([[0, 610, -1], [1, 680, 1], [2, 640, -1], [3, 1750, 1], [0, 1820, -1], [1, 1780, 1]].map(([i, z, d], n) => ({ i, z, d, x: 300 + n * 800, speed: d * (60 + n * 15) })))
  const rideRefs = useRef([])
  const rides = useRef(PARKED.map(([x, z, , f]) => ({
    hx: x, hz: z - 8, x, z: z - 8, yaw: f ? Math.PI : 0, home: f ? Math.PI : 0,
    route: null, seg: 0, active: false, rider: false, dir: undefined,
  })))
  const riding = useRef(null)
  const keys = useRef(new Set())
  const cam = useRef({ yaw: 0, dist: 12, px: 300, pz: 520, snap: true })
  const near = useRef({ key: null, best: null })

  const startRide = (k) => {
    const r = rides.current[k]
    if (r.active) return
    r.route = ROUTE(r.hx, r.hz); r.seg = 0; r.active = true; r.rider = true; r.dir = undefined
    riding.current = k
  }
  const stopRide = () => {
    const k = riding.current
    if (k == null) return
    const r = rides.current[k]
    const [x, z] = findFree(r)
    ps.current.x = x; ps.current.z = z
    r.rider = false
    riding.current = null
  }
  const interact = () => {
    if (bridge.paused) return
    if (riding.current != null) return stopRide()
    const best = near.current.best
    if (!best) return
    if (best.type === 'ride') return startRide(best.k)
    bridge.onInteract?.(best)
  }

  useEffect(() => {
    bridge.doInteract = interact
    bridge.teleport = (id) => {
      if (riding.current != null) { rides.current[riding.current].rider = false; riding.current = null }
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
    DYN = [
      ...vehicles.current.map((v) => [v.x - 58, v.z - 27, v.x + 58, v.z + 27]),
      ...rides.current.filter((r) => !r.rider).map(rideBox),
    ]
    const onJeep = riding.current != null
    if (!onJeep) pushOut(p)
    npcState.current.forEach(pushOut)

    // ----- player input (camera-relative) -----
    let ix = 0, iy = 0
    if (!bridge.paused && !onJeep) {
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
      const cfg = NPCS[i]
      const flags = { pose: false, tears: false, say: false, hidden: false, sit: false, text: null }
      if (cfg.cry) {
        // umiiyak -> may sinasabi -> tumatakbo palayo -> nawawala -> bumabalik
        const dp = Math.hypot(p.x - n.x, p.z - n.z)
        if (n.mode === 'cry') {
          n.vx = 0; n.vz = 0
          flags.pose = true; flags.tears = true; flags.sit = true
          n.face = lerpAngle(n.face, 0, 1 - Math.exp(-10 * dt))
          if (dp < CRY_TRIGGER && !onJeep) { n.mode = 'say'; n.mt = CRY_SAY_TIME }
        } else if (n.mode === 'say') {
          // nakaupo pa rin, lumalabas ang "Ako nalang kasi..."
          n.vx = 0; n.vz = 0
          flags.pose = true; flags.tears = true; flags.say = true; flags.sit = true; flags.text = cfg.line
          n.mt -= dt
          if (n.mt <= 0) { n.mode = 'stand'; n.mt = CRY_STAND_TIME }
        } else if (n.mode === 'stand') {
          // tumatayo mula sa upuan
          n.vx = 0; n.vz = 0
          flags.pose = true; flags.tears = true
          n.face = lerpAngle(n.face, Math.atan2(p.x - n.x, p.z - n.z), 1 - Math.exp(-10 * dt))
          n.mt -= dt
          if (n.mt <= 0) { n.mode = 'flee'; n.mt = CRY_FLEE_TIME; n.li = 0; n.lt = CRY_LINE_TIME; n.rt = 0; n.fa = Math.atan2(n.z - p.z, n.x - p.x) }
        } else if (n.mode === 'flee') {
          // tumatakbo palayo sa player; umiiwas sa fountain, puno, pader (pumipili ng libreng direksyon)
          const away = Math.atan2(n.z - p.z, n.x - p.x)
          n.rt -= dt
          const fr = onBench(n)
          if (n.rt <= 0 || blocked(n.x + Math.cos(n.fa) * 30, n.z + Math.sin(n.fa) * 30, fr)) {
            n.rt = 0.4
            for (const off of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.2, -2.2]) {
              const a = away + off
              if (!blocked(n.x + Math.cos(a) * 35, n.z + Math.sin(a) * 35, fr) && !blocked(n.x + Math.cos(a) * 90, n.z + Math.sin(a) * 90, fr)) { n.fa = a; break }
            }
          }
          n.vx = Math.cos(n.fa) * CRY_FLEE_SPEED; n.vz = Math.sin(n.fa) * CRY_FLEE_SPEED
          flags.pose = true; flags.tears = true // tumatakbo habang umiiyak (nakatakip ang kamay sa mukha)
          // may sinasabi habang hinahabol: "miss na miss ko na siya..." atbp.
          const lines = cfg.chaseLines
          if (lines && lines.length) {
            n.lt -= dt
            if (n.lt <= 0) { n.lt = CRY_LINE_TIME; n.li = (n.li + 1) % lines.length }
            flags.say = true; flags.text = lines[n.li]
          }
          n.mt -= dt
          if (n.mt <= 0 || dp > 420) { n.mode = 'away'; n.mt = 0; n.vx = 0; n.vz = 0 } // hindi nawawala: tumitigil at umiiyak
        } else if (n.mode === 'away') {
          // nakatayo at umiiyak sa pinagtigilan niya; tatakbo ulit kapag nilapitan mo
          n.vx = 0; n.vz = 0
          flags.pose = true; flags.tears = true
          if (dp < CRY_TRIGGER && !onJeep) {
            n.mode = 'flee'; n.mt = CRY_FLEE_TIME; n.li = 0; n.lt = CRY_LINE_TIME; n.rt = 0; n.fa = Math.atan2(n.z - p.z, n.x - p.x)
          } else if (dp > 500) {
            // kapag matagal ka nang malayo, babalik siya sa bench (hindi mo makikita)
            n.mt += dt
            if (n.mt >= CRY_RESPAWN) { n.x = n.hx; n.z = n.hz; n.face = 0; n.mode = 'cry' }
          } else n.mt = 0
        } else {
          // gone: nakatago; babalik lang kapag malayo na ang player
          flags.hidden = true
          n.mt -= dt
          if (n.mt <= 0 && dp > 500) { n.x = n.hx; n.z = n.hz; n.face = 0; n.mode = 'cry' }
        }
      } else {
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
      }
      step(n, n.vx * dt, n.vz * dt)
      const mv = n.vx !== 0 || n.vz !== 0
      if (mv) n.face = lerpAngle(n.face, Math.atan2(n.vx, n.vz), 1 - Math.exp(-10 * dt))
      const g = npcRefs.current[i].current
      if (!g) return
      g.userData.walk = (g.userData.walk || 0) + ((mv ? 1 : 0) - (g.userData.walk || 0)) * Math.min(1, dt * 12)
      g.visible = !flags.hidden
      g.userData.cry = flags.pose; g.userData.tears = flags.tears; g.userData.say = flags.say; g.userData.sayText = flags.text; g.userData.sit = flags.sit
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

    // ----- rideable jeepneys at the terminal -----
    rides.current.forEach((r, k) => {
      const g = rideRefs.current[k]
      if (!g) return
      if (r.active) {
        // wait behind slower traffic
        const ax = r.x + Math.cos(r.yaw) * 90, az = r.z - Math.sin(r.yaw) * 90
        const stuck = vehicles.current.some((v) => ax > v.x - 68 && ax < v.x + 68 && az > v.z - 37 && az < v.z + 37)
        let move = stuck ? 0 : RIDE_SPEED * dt
        while (move > 0 && r.seg < r.route.length - 1) {
          const [tx, tz] = r.route[r.seg + 1]
          const dx = tx - r.x, dz = tz - r.z, dist = Math.hypot(dx, dz)
          if (dist <= move) { r.x = tx; r.z = tz; r.seg++; move -= dist } else {
            r.x += (dx / dist) * move; r.z += (dz / dist) * move
            r.dir = Math.atan2(-dz, dx); move = 0
          }
        }
        if (r.dir !== undefined) r.yaw = lerpAngle(r.yaw, r.dir, 1 - Math.exp(-8 * dt))
        if (r.seg >= r.route.length - 1) {
          // back at the terminal: park and let the passenger off
          r.active = false; r.x = r.hx; r.z = r.hz; r.yaw = r.home
          if (r.rider) {
            r.rider = false; riding.current = null
            const [fx, fz] = findFree(r)
            p.x = fx; p.z = fz
          }
        }
      }
      g.position.set(r.x * S, 0, r.z * S)
      g.rotation.y = r.yaw
    })
    if (riding.current != null) {
      // the passenger sits inside, visible through the windows
      const r = rides.current[riding.current]
      p.x = r.x; p.z = r.z
      pg.position.set(r.x * S + Math.cos(r.yaw) * 0.6, 0.45, r.z * S - Math.sin(r.yaw) * 0.6)
      pg.rotation.y = r.yaw + Math.PI / 2
      pg.scale.setScalar(0.42)
      pg.userData.walk = 0
    } else pg.scale.setScalar(1)

    // ----- nearest interactable -----
    let best = null, bd = 70
    PLACES.forEach((pl) => {
      const d = Math.hypot(p.x - pl.door, p.z - (pl.base + 28))
      if (d < bd) { bd = d; best = { type: 'place', id: pl.id, label: pl.label } }
    })
    {
      const d = Math.hypot(p.x - POND.dock[0], p.z - POND.dock[1])
      if (d < bd) { bd = d; best = { type: 'place', id: 'fishpond', label: 'Palaisdaan (Fishing)' } }
    }
    NPCS.forEach((n, i) => {
      if (n.cry) return
      const s = npcState.current[i]
      const d = Math.hypot(p.x - s.x, p.z - s.z)
      if (d < Math.min(bd, 60)) { bd = d; best = { type: 'npc', id: n.id, label: 'Talk to ' + n.name, name: n.name, line: n.line, shop: n.shop } }
    })
    rides.current.forEach((r, k) => {
      if (r.active) return
      const [a, b, c, d] = rideBox(r)
      const dd = Math.hypot(p.x - clamp(p.x, a, c), p.z - clamp(p.z, b, d))
      if (dd < Math.min(bd, 50)) { bd = dd; best = { type: 'ride', id: 'ride' + k, k, label: '🚌 Ride Jeepney' } }
    })
    if (riding.current != null) best = { type: 'rideoff', id: 'off', label: 'Get off Jeepney' }
    const key = best && best.type + best.id
    if (key !== near.current.key) {
      near.current = { key, best }
      bridge.onNearby?.(best && { type: best.type, id: best.id, label: best.label })
    }

    // data for the minimap
    bridge.mini = {
      x: p.x, z: p.z, face: p.face,
      jeeps: [
        ...vehicles.current.map((v) => ({ x: v.x, z: v.z, i: v.i })),
        ...rides.current.map((r, k) => ({ x: r.x, z: r.z, i: PARKED[k][2] })),
      ],
      npcs: npcState.current.filter((n) => n.mode !== 'gone').map((n) => ({ x: n.x, z: n.z })),
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

    // ----- day / night + weather -----
    const E = envR.current, ev = bridge.env || { minutes: 480, day: 1 }
    const eAbs = ev.day * 1440 + ev.minutes
    const wi = weatherIndex(ev.day)
    const cloudT = [0, 0.55, 1][wi], rainT = [0, 0, 1][wi]
    if (E.t == null) { E.t = eAbs; E.cloud = cloudT; E.rain = rainT }
    if (eAbs < E.t || eAbs - E.t > 180) E.t = eAbs // natulog / bagong araw
    else E.t += (eAbs - E.t) * (1 - Math.exp(-2.5 * dt))
    const wk = 1 - Math.exp(-0.8 * dt)
    E.cloud += (cloudT - E.cloud) * wk
    E.rain += (rainT - E.rain) * wk
    const hr = (E.t % 1440) / 60
    const sk = skyAt(hr, E.cloud)

    // langit (gradient), fog, ilaw
    const col = skyGeo.attributes.color, ys = skyGeo.userData.ys
    for (let i = 0; i < ys.length; i++) {
      const tt = Math.pow(Math.max(0, ys[i]), 0.55)
      col.setXYZ(i, sk.hor.r + (sk.top.r - sk.hor.r) * tt, sk.hor.g + (sk.top.g - sk.hor.g) * tt, sk.hor.b + (sk.top.b - sk.hor.b) * tt)
    }
    col.needsUpdate = true
    if (fogR.current) {
      fogR.current.color.copy(sk.hor)
      fogR.current.near = 90 - 20 * E.cloud - 45 * E.rain
      fogR.current.far = 220 - 40 * E.cloud - 90 * E.rain
    }
    if (hemi.current) hemi.current.intensity = sk.hemi

    // araw sa umaga/hapon, buwan sa gabi (iisang directional light, sumusunod sa player)
    const sunA = ((hr - 6) / 12) * Math.PI
    const sX = Math.cos(sunA), sY = Math.max(Math.abs(Math.sin(sunA)), 0.25), sZ = 0.45
    const sLen = Math.hypot(sX, sY, sZ)
    if (light.current) {
      const L = light.current
      L.intensity = sk.light; L.color.copy(sk.lightColor)
      L.position.set(c.px + (sX / sLen) * 50, (sY / sLen) * 50, c.pz + (sZ / sLen) * 50)
      L.target.position.set(c.px, 0, c.pz)
      L.target.updateMatrixWorld()
    }
    // makikitang araw, buwan at bituin
    if (skyG.current) {
      skyG.current.position.copy(camera.position)
      _sd.set(Math.cos(sunA), Math.sin(sunA), 0.45).normalize()
      const veil = 1 - 0.95 * E.cloud
      sunM.current.visible = _sd.y > -0.08
      sunM.current.position.copy(_sd).multiplyScalar(300)
      sunM.current.material.opacity = veil
      moonM.current.visible = -_sd.y > -0.08
      moonM.current.position.copy(_sd).multiplyScalar(-300)
      moonM.current.material.opacity = veil
      const so = sk.star * veil
      starsR.current.visible = so > 0.02
      starsR.current.material.opacity = so
      starsR.current.rotation.y = E.t * 0.0004
    }
    // mga ilaw: bintana, poste, headlights
    const lamp = clamp(sk.star + E.cloud * 0.25, 0, 1)
    WINDOW_MAT.emissiveIntensity = lamp * 0.9
    HEAD_MAT.emissiveIntensity = 0.1 + lamp * 1.2
    GLOW_MAT.opacity = lamp * 0.3
    POOL_MAT.opacity = lamp * 0.28
  })

  return (
    <>
      <group ref={skyG}>
        <mesh geometry={skyGeo} renderOrder={-10}>
          <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
        <mesh ref={sunM}>
          <sphereGeometry args={[16, 16, 12]} />
          <meshBasicMaterial color="#fff3a0" transparent depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
        <mesh ref={moonM}>
          <sphereGeometry args={[11, 16, 12]} />
          <meshBasicMaterial color="#f1f0e6" transparent depthWrite={false} fog={false} toneMapped={false} />
        </mesh>
        <points ref={starsR} frustumCulled={false}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[STAR_POS, 3]} /></bufferGeometry>
          <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} transparent opacity={0} depthWrite={false} fog={false} toneMapped={false} />
        </points>
      </group>
      <fog ref={fogR} attach="fog" args={['#d9efff', 90, 220]} />
      <hemisphereLight ref={hemi} args={['#ffffff', '#6aa84f', 0.85]} />
      <directionalLight
        ref={light} castShadow intensity={1.5}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}
        shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={32} shadow-camera-bottom={-32}
        shadow-camera-near={1} shadow-camera-far={120}
      />

      <Ground />
      <Backdrop />
      <Clouds envR={envR} />
      <Rain envR={envR} cam={cam} />
      {PLACES.map((p) => <Building key={p.id} p={p} />)}

      {/* park */}
      {PALMS.map(([x, z]) => <Palm key={x + '_' + z} x={x} z={z} />)}
      <Bench x={430} z={1180} />
      <Bench x={730} z={1285} />
      <Bench x={2230} z={2520} />
      <Bench x={2570} z={2520} />
      <Fountain x={2400} z={2450} />
      <Pond />
      <Fountain x={580} z={1225} />
      <Flowers />
      <group position={[580 * S, 0, 806 * S]}>
        <Box p={[-3, 1.5, 0]} s={[0.4, 3, 0.4]} c="#8b5a2b" />
        <Box p={[3, 1.5, 0]} s={[0.4, 3, 0.4]} c="#8b5a2b" />
        <Box p={[0, 3.4, 0]} s={[8, 1.7, 0.25]} c="#8b5a2b" />
        <Text position={[0, 3.4, 0.16]} fontSize={0.9} color="#ffffff" anchorX="center" anchorY="middle">Parke</Text>
      </group>

      {/* street lights */}
      {POLES.map(([x, zb]) => (
        <group key={x + '_' + zb} position={[x * S, 0, zb * S]}>
          <Cyl p={[0, 3.75, 0]} a={[0.15, 0.22, 7.5, 8]} c="#374151" />
          <mesh position={[0, 7.7, 0]}><sphereGeometry args={[0.45, 12, 12]} /><meshBasicMaterial color="#fff3a0" /></mesh>
          <mesh position={[0, 7.7, 0]}><sphereGeometry args={[1.5, 12, 12]} /><primitive object={GLOW_MAT} attach="material" dispose={null} /></mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.22, 0]}><circleGeometry args={[5.5, 24]} /><primitive object={POOL_MAT} attach="material" dispose={null} /></mesh>
        </group>
      ))}

      {/* traffic + parked jeepneys */}
      {vehicles.current.map((v, i) => (
        <group key={i} ref={(g) => (jeepRefs.current[i] = g)}><Jeep color={JEEP[v.i]} /></group>
      ))}
      {PARKED.map(([x, z, i, f], k) => (
        <group
          key={x}
          ref={(g) => {
            rideRefs.current[k] = g
            if (g && !g.userData.init) { g.userData.init = true; g.position.set(x * S, 0, (z - 8) * S); g.rotation.y = f ? Math.PI : 0 }
          }}
        ><Jeep color={JEEP[i]} /></group>
      ))}

      {/* people */}
      <Character ref={player} look={look} />
      {NPCS.map((n, i) => <Character key={n.id} ref={npcRefs.current[i]} look={n.look} label={n.name} cry={n.cry} bubble={n.cry ? n.line : undefined} />)}
    </>
  )
}