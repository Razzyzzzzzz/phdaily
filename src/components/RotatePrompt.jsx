import { useEffect, useState } from 'react'
import { enterLandscape } from '../utils/landscape'

const useMq = (q) => {
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const h = (e) => setM(e.matches)
    setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [q])
  return m
}

// Lalabas lang sa phone na naka-portrait. Mawawala agad kapag pinaikot mo sa landscape.
export default function RotatePrompt() {
  const portrait = useMq('(orientation: portrait)')
  const touch = useMq('(pointer: coarse)')
  const phone = useMq('(max-width: 820px)')
  const [skip, setSkip] = useState(false)
  if (!portrait || !touch || !phone || skip) return null
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-slate-900/95 p-6 text-center text-white backdrop-blur-sm"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="text-7xl" style={{ animation: 'elph-rotate 2.4s ease-in-out infinite' }}>📱</div>
      <h2 className="text-2xl font-extrabold text-yellow-300">Paikutin ang phone mo</h2>
      <p className="max-w-xs font-bold text-white/80">Mas maganda at mas malawak ang laro sa landscape.</p>
      <button className="btn-orange w-full max-w-xs py-3 text-lg" onClick={enterLandscape}>⛶ Fullscreen + Landscape</button>
      <p className="max-w-xs text-xs font-bold text-white/60">iPhone: i-off ang “Portrait Orientation Lock” sa Control Center, tapos paikutin ang phone.</p>
      <button className="text-sm font-bold text-sky-300 underline" onClick={() => setSkip(true)}>Maglaro pa rin sa portrait</button>
    </div>
  )
}