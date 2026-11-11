import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene3D from '../game/Scene3D'
import { WW, WH, PLACES } from '../game/world'

const JEEP_HEX = ['#ef476f', '#06d6a0', '#ffd166', '#4cc9f0']
const ICONS = { house: '🏠', sari: '🏪', restaurant: '🍽️', market: '🛒', terminal: '🚌' }
const hex = (n) => '#' + n.toString(16).padStart(6, '0')

function Minimap({ bridge }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const k = cv.width / WW
    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x * k, y * k, w * k, h * k) }
    const icon = (t, x, y, size) => {
      ctx.font = `${size}px sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t, x * k, y * k)
    }
    let raf
    const draw = () => {
      raf = requestAnimationFrame(draw)
      rect('#86c66b', 0, 0, WW, WH)
      rect('#5fae5a', 60, 800, 1120, 840)            // park
      rect('#e7d3a7', 60, 1180, 1120, 80)
      rect('#e7d3a7', 540, 800, 80, 840)
      rect('#cfc8bb', 1440, 1020, WW - 1440, 600)    // lot
      rect('#d6d3d1', 0, 480, WW, 60)                // sidewalks
      rect('#4b5563', 0, 540, WW, 160)               // roads
      rect('#4b5563', 1240, 700, 160, WH - 700)
      PLACES.forEach((p) => {
        rect(hex(p.color), p.x, p.base - 200, p.w, 200)
        rect(hex(p.roof), p.x, p.base - 200, p.w, 60)
        icon(ICONS[p.id] || '📍', p.x + p.w / 2, p.base - 80, 20)
      })
      icon('🌳', 580, 1000, 22)

      const m = bridge.mini
      if (!m) return
      m.jeeps.forEach((j) => { ctx.fillStyle = JEEP_HEX[j.i]; ctx.fillRect((j.x - 56) * k, (j.z - 24) * k, 112 * k, 48 * k) })
      ctx.fillStyle = '#facc15'
      m.npcs.forEach((n) => { ctx.beginPath(); ctx.arc(n.x * k, n.z * k, 4, 0, Math.PI * 2); ctx.fill() })
      // player arrow (points where the character faces)
      ctx.save()
      ctx.translate(m.x * k, m.z * k)
      ctx.rotate(-m.face)
      ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(-6, -6); ctx.lineTo(6, -6); ctx.closePath()
      ctx.fillStyle = '#ff3b30'; ctx.fill()
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke()
      ctx.restore()
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <canvas
      ref={ref} width={336} height={238}
      className="pointer-events-none absolute right-2 top-[112px] z-10 rounded-xl border-4 border-white/80 shadow-lg"
      style={{ width: 168, height: 119 }}
    />
  )
}

export default function GameCanvas({ bridge, look, minutes = 480, day = 1 }) {
  bridge.look = look
  bridge.env = { minutes, day } // oras + araw para sa day/night at weather sa Scene3D
  return (
    <div className="absolute inset-0 select-none" style={{ touchAction: 'none' }} onContextMenu={(e) => e.preventDefault()}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.5, far: 600, position: [15, 8, 40] }}
        gl={{ antialias: true }}
      >
        <Scene3D bridge={bridge} look={look} />
      </Canvas>
      <Minimap bridge={bridge} />
    </div>
  )
}