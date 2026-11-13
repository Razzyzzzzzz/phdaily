import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Character } from './Scene3D'
import { multiplayer } from './multiplayer'
import { useMp } from '../store/mpStore'

const S = 0.05 // world px -> scene units (same constant as Scene3D)
const lerpAngle = (a, b, t) => a + ((((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * t)

// One real remote player: the SAME <Character> used for you and the NPCs, driven by network snapshots.
function Remote({ id, username, level, online, look }) {
  const ref = useRef()
  useLayoutEffect(() => { if (ref.current) ref.current.visible = false }, []) // hidden until the first snapshot is applied

  useFrame((_, dt0) => {
    const g = ref.current
    const r = multiplayer.remotes.get(id)
    if (!g || !r) return
    const t = r.tgt
    if (!r.cur) r.cur = { ...t }
    const c = r.cur
    const k = 1 - Math.exp(-14 * Math.min(dt0, 0.1)) // smooths 15 Hz snapshots into 60 fps motion
    if (Math.hypot(t.x - c.x, t.z - c.z) > 500) { c.x = t.x; c.z = t.z } // teleport / map travel: do not slide across the map
    else { c.x += (t.x - c.x) * k; c.z += (t.z - c.z) * k }
    c.y += (t.y - c.y) * k
    c.sc += (t.sc - c.sc) * k
    c.walk += (t.walk - c.walk) * k
    c.ry = lerpAngle(c.ry, t.ry, k)
    g.visible = true
    g.position.set(c.x * S, c.y, c.z * S)
    g.rotation.y = c.ry
    g.scale.setScalar(c.sc)
    // These fields drive the existing Character animations (walk cycle, jump pose, gym / fishing / basketball / pray ...)
    g.userData.walk = c.walk
    g.userData.air = t.air
    g.userData.act = t.act
    g.userData.phase = t.phase
  })

  return <Character ref={ref} look={look} label={online ? `${username}  Lv.${level}` : `${username}  (reconnecting…)`} acts />
}

export default function RemotePlayers() {
  const players = useMp((s) => s.players)
  return (
    <>
      {players.filter((p) => !p.self).map((p) => (
        <Remote key={p.id + ':' + JSON.stringify(p.look)} id={p.id} username={p.username} level={p.level} online={p.online} look={p.look} />
      ))}
    </>
  )
}
