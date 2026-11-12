import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene3D from '../game/Scene3D'
import { WW, WH, PLACES } from '../game/world'

const JEEP_HEX = ['#ef476f', '#06d6a0', '#ffd166', '#4cc9f0']
const ICONS = { house: '🏠', sari: '🏪', restaurant: '🍽️', market: '🛒', terminal: '🚌' }
const hex = (n) => '#' + n.toString(16).padStart(6, '0')

const MM_W = 224, MM_H = 160 // laki ng drawing buffer (ang aktwal na laki sa screen ay nasa .elph-minimap sa index.css)
const VIEW = 1000            // ilang world units ang kita sa lapad ng minimap (nakasentro sa player)
const VIEW_H = VIEW * (MM_H / MM_W)
const KEY = 'elph:minimap'

function Minimap({ bridge }) {
  const ref = useRef(null)
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(KEY) !== '0' } catch { return true }
  })
  const toggle = () => {
    setShow((s) => {
      try { localStorage.setItem(KEY, s ? '0' : '1') } catch { /* ignore */ }
      return !s
    })
  }

  useEffect(() => {
    if (!show) return // naka-hide: walang drawing, walang gastos
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const k = cv.width / VIEW
    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x * k, y * k, w * k, h * k) }
    const icon = (t, x, y, size) => {
      ctx.font = `${size}px sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t, x * k, y * k)
    }
    let raf
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const m = bridge.mini
      // nakasentro sa player; naka-clamp para hindi lumampas sa gilid ng mundo
      const cx = Math.min(Math.max(m ? m.x : WW / 2, VIEW / 2), WW - VIEW / 2)
      const cz = Math.min(Math.max(m ? m.z : WH / 2, VIEW_H / 2), WH - VIEW_H / 2)
      ctx.save()
      ctx.translate(cv.width / 2 - cx * k, cv.height / 2 - cz * k)

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
        icon(ICONS[p.id] || '📍', p.x + p.w / 2, p.base - 80, 18)
      })
      icon('🌳', 580, 1000, 20)

      if (m) {
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
      ctx.restore()
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [show, bridge])

  return (
    <div className="elph-minimap pointer-events-none absolute z-10 min-h-[1.75rem]">
      {show && (
        <canvas
          ref={ref} width={MM_W} height={MM_H}
          className="block w-full rounded-xl border-2 border-white/70 opacity-80 shadow-lg"
          style={{ aspectRatio: `${MM_W} / ${MM_H}` }}
        />
      )}
      <button
        type="button" aria-label={show ? 'Hide minimap' : 'Show minimap'} tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()} onClick={toggle}
        className={`pointer-events-auto absolute right-0 top-0 grid h-7 w-7 place-items-center rounded-full bg-slate-900/70 text-sm shadow ${show ? '' : 'opacity-90'}`}
      >{show ? '✕' : '🗺️'}</button>
    </div>
  )
}

export default function GameCanvas({ bridge, look, minutes = 480, day = 1 }) {
  bridge.look = look
  bridge.env = { minutes, day } // oras + araw para sa day/night at weather sa Scene3D
  return (
    <div className="absolute inset-0 select-none" style={{ touchAction: 'none' }} onContextMenu={(e) => e.preventDefault()}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.5, far: 600, position: [15, 8, 40] }}
        gl={{ antialias: true }}
      >
        <Scene3D bridge={bridge} look={look} />
      </Canvas>
      <Minimap bridge={bridge} />
    </div>
  )
}