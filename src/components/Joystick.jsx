import { useEffect, useRef, useState } from 'react'

// Joystick para sa touch: sumusunod sa laki, isang daliri lang ang binabasa (hindi nalilito sa camera drag),
// at hindi nagre-render ng React sa bawat galaw (direct transform) kaya makinis sa phone.
export default function Joystick({ vec }) {
  const base = useRef(null)
  const knob = useRef(null)
  const ptr = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => () => { vec.x = 0; vec.y = 0 }, [vec])

  const place = (x, y) => {
    if (knob.current) knob.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
  }
  const move = (e) => {
    const r = base.current.getBoundingClientRect()
    const R = r.width * 0.34
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R }
    place(dx, dy); vec.x = dx / R; vec.y = dy / R
  }
  const start = (e) => {
    if (ptr.current !== null) return
    ptr.current = e.pointerId
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setActive(true); move(e)
  }
  const end = (e) => {
    if (e && ptr.current !== null && e.pointerId !== ptr.current) return
    ptr.current = null
    setActive(false); place(0, 0); vec.x = 0; vec.y = 0
  }

  return (
    // mas malaking hit-area (padding) para madaling hawakan ng hinlalaki
    <div className="-m-3 touch-none p-3" onPointerDown={start} onPointerMove={(e) => e.pointerId === ptr.current && move(e)}
      onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onContextMenu={(e) => e.preventDefault()}>
      <div ref={base} className={`relative h-28 w-28 rounded-full border-4 shadow-lg transition-colors ${active ? 'border-white bg-slate-700/60' : 'border-white/70 bg-slate-700/40'}`}>
        <span className="absolute left-1/2 top-0.5 -translate-x-1/2 text-[10px] leading-none text-white/60">▲</span>
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] leading-none text-white/60">▼</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] leading-none text-white/60">◀</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] leading-none text-white/60">▶</span>
        <div ref={knob} className={`absolute left-1/2 top-1/2 h-12 w-12 rounded-full shadow-md ${active ? 'bg-white' : 'bg-white/85'}`} style={{ transform: 'translate(-50%, -50%)' }} />
      </div>
    </div>
  )
}