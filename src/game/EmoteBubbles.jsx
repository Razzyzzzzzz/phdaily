import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { multiplayer } from './multiplayer'
import { EMOTE_BY_ID, EMOTE_MS } from './emotes'

const S = 0.05       // world px -> scene units (same as Scene3D / RemotePlayers)
const HEAD = 5.8     // feet -> above the name label (label sits at 4.7). Tweak if needed.
const cache = new Map()

function texture(emoji) {
  if (cache.has(emoji)) return cache.get(emoji)
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(255,255,255,0.95)'
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill()
  g.lineWidth = 5; g.strokeStyle = '#1e293b'; g.stroke()
  g.font = '72px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'
  g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(emoji, 64, 70)
  const t = new THREE.CanvasTexture(c)
  cache.set(emoji, t)
  return t
}

// Floating emoji above the local player and the remote players. Lives inside <Canvas>.
export default function EmoteBubbles({ bridge }) {
  const group = useRef()
  const sprites = useRef(new Map())

  useEffect(() => () => {
    sprites.current.forEach((s) => { s.material.dispose() })
    sprites.current.clear()
  }, [])

  useFrame(() => {
    const grp = group.current
    if (!grp) return
    const now = performance.now()

    multiplayer.emotes.forEach((v, id) => {
      const age = now - v.t0
      let s = sprites.current.get(id)
      if (age > EMOTE_MS) {
        multiplayer.emotes.delete(id)
        if (s) { grp.remove(s); s.material.dispose(); sprites.current.delete(id) }
        return
      }
      // where is this player?
      let x, y, z
      if (id === 'me' || (multiplayer.me && id === multiplayer.me.id)) {
        const m = bridge?.me
        if (!m) return
        x = m.x * S; y = m.y || 0; z = m.z * S
      } else {
        const r = multiplayer.remotes.get(id)
        const p = r?.cur || r?.tgt
        if (!p) return
        x = p.x * S; y = p.y || 0; z = p.z * S
      }
      const emo = EMOTE_BY_ID[v.emote]
      if (!emo) return
      if (!s) {
        s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(emo.e), transparent: true, depthTest: false }))
        s.renderOrder = 999
        grp.add(s)
        sprites.current.set(id, s)
      }
      const pop = Math.min(1, age / 220)                         // quick pop-in
      const fade = age > EMOTE_MS - 500 ? (EMOTE_MS - age) / 500 : 1
      const sc = 1.5 * (0.4 + 0.6 * pop)
      s.scale.set(sc, sc, 1)
      s.position.set(x, y + HEAD + Math.sin(age / 250) * 0.06, z)
      s.material.opacity = fade
    })
  })

  return <group ref={group} />
}