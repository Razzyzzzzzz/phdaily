import { useRef, useState } from 'react'

export default function Joystick({ vec }) {
  const base = useRef(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const R = 44
  const move = (e) => {
    const r = base.current.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R }
    setKnob({ x: dx, y: dy }); vec.x = dx / R; vec.y = dy / R
  }
  const end = () => { setKnob({ x: 0, y: 0 }); vec.x = 0; vec.y = 0 }
  return (
    <div ref={base} className="relative h-28 w-28 touch-none rounded-full border-4 border-white/70 bg-slate-700/40"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={(e) => e.buttons && move(e)} onPointerUp={end} onPointerCancel={end}>
      <div className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/85 shadow"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
    </div>
  )
}
