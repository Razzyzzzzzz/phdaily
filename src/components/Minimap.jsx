import { useEffect, useRef, useState } from 'react'
import { WW, WH, PLACES, ROAD2, VROAD, POND, LOCATIONS } from '../game/world'
import { multiplayer } from '../game/multiplayer'

const ZOOMS = [450, 750, 1200] // world px visible from the center to the edge
const PARK = [60, 800, 1120, 840]
const hexCss = (n) => '#' + n.toString(16).padStart(6, '0')
const JEEP_COL = ['#ef476f', '#06d6a0', '#ffd166', '#4cc9f0']

// Round minimap. Reads live data every 100 ms:
//   bridge.mini  -> { x, z, face, jeeps, npcs }   (published by Scene3D)
//   multiplayer.remotes -> other real players     (blue dots)
//   target       -> { x, z } of the active quest  (gold marker, clamps to the edge)
export default function Minimap({ bridge, target, onOpenMap, size = 112 }) {
  const cv = useRef(null)
  const [zi, setZi] = useState(1)
  const zoom = useRef(zi)
  zoom.current = zi
  const tgt = useRef(target)
  tgt.current = target

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = size * dpr; c.height = size * dpr
    const g = c.getContext('2d')
    const half = size / 2

    const draw = () => {
      const m = bridge?.mini
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, size, size)
      g.save()
      g.beginPath(); g.arc(half, half, half - 2, 0, Math.PI * 2); g.clip()
      g.fillStyle = '#86c66b'; g.fillRect(0, 0, size, size)
      if (!m) { g.restore(); return }

      const R = ZOOMS[zoom.current], k = half / R
      const X = (x) => half + (x - m.x) * k, Y = (z) => half + (z - m.z) * k
      const rect = (x, z, w, h, col) => { g.fillStyle = col; g.fillRect(X(x), Y(z), w * k, h * k) }

      rect(...PARK.slice(0, 2), PARK[2], PARK[3], '#5fae5a')
      rect(POND.x, POND.z, POND.w, POND.d, '#38bdf8')
      rect(0, 540, WW, 160, '#4b5563')
      rect(0, ROAD2.y, WW, ROAD2.h, '#4b5563')
      rect(VROAD.x, 700, VROAD.w, WH - 700, '#4b5563')
      PLACES.forEach((p) => rect(p.x, p.base - 200, p.w, 200, hexCss(p.color)))

      g.fillStyle = '#fde047'
      m.jeeps?.forEach((j) => { g.beginPath(); g.arc(X(j.x), Y(j.z), 2.4, 0, 7); g.fillStyle = JEEP_COL[j.i % 4] || '#fde047'; g.fill() })
      g.fillStyle = 'rgba(255,255,255,.85)'
      m.npcs?.forEach((n) => { g.beginPath(); g.arc(X(n.x), Y(n.z), 1.8, 0, 7); g.fill() })

      // real players
      multiplayer.remotes.forEach((r) => {
        const p = r.cur || r.tgt
        if (!p) return
        g.beginPath(); g.arc(X(p.x), Y(p.z), 3.2, 0, 7)
        g.fillStyle = '#3b82f6'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#fff'; g.stroke()
      })

      // quest marker (clamped to the rim when it is off the map)
      const t = tgt.current
      if (t) {
        let dx = (t.x - m.x) * k, dy = (t.z - m.z) * k
        const d = Math.hypot(dx, dy), lim = half - 9
        if (d > lim) { dx = (dx / d) * lim; dy = (dy / d) * lim }
        g.beginPath(); g.arc(half + dx, half + dy, 6, 0, 7)
        g.fillStyle = '#facc15'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#92400e'; g.stroke()
        g.fillStyle = '#7c2d12'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
        g.fillText('!', half + dx, half + dy + 0.5)
      }

      // you: arrow rotated by your facing (3D facing 0 = +z = down on the map)
      g.save()
      g.translate(half, half); g.rotate(-(m.face || 0))
      g.beginPath(); g.moveTo(0, 8); g.lineTo(-5.5, -5); g.lineTo(0, -2); g.lineTo(5.5, -5); g.closePath()
      g.fillStyle = '#38bdf8'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke()
      g.restore()
      g.restore()
    }
    draw()
    const t = setInterval(draw, 100)
    return () => clearInterval(t)
  }, [bridge, size])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={cv} onClick={onOpenMap}
        className="rounded-full border-[3px] border-white bg-green-700 shadow-lg"
        style={{ width: size, height: size, cursor: onOpenMap ? 'pointer' : 'default' }}
      />
      <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        <button type="button" aria-label="Zoom out" disabled={zi >= ZOOMS.length - 1} onClick={() => setZi(zi + 1)} className="h-5 w-5 rounded-full bg-slate-900/85 text-xs font-extrabold leading-5 text-white disabled:opacity-40">−</button>
        <button type="button" aria-label="Zoom in" disabled={zi <= 0} onClick={() => setZi(zi - 1)} className="h-5 w-5 rounded-full bg-slate-900/85 text-xs font-extrabold leading-5 text-white disabled:opacity-40">+</button>
      </div>
    </div>
  )
}

export const questTarget = (where) => (where && LOCATIONS[where] ? { x: LOCATIONS[where][0], z: LOCATIONS[where][1] } : null)
