import { useEffect, useRef, useState } from 'react'
import { ITEMS } from '../data/gameData'

// [id, weight]
const POOL = [['tilapia', 40], ['hito', 22], ['bangus', 16], ['bota', 10], ['dalag', 8], ['alimango', 4]]
const roll = () => {
  let r = Math.random() * 100
  for (const [id, w] of POOL) if ((r -= w) < 0) return id
  return 'tilapia'
}
const RARE = { dalag: 'Rare!', alimango: 'Rare!', bangus: 'Nice!' }

export default function FishingPanel({ state, onCast, onCatch, onSell, onPhase, onClose }) {
  const [phase, setPhase] = useState('idle') // idle | waiting | bite | result
  const [result, setResult] = useState(null)
  const timers = useRef([])
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => clear, [])
  // ipasa sa 3D scene para gumalaw ang character (cast / kagat / huli)
  useEffect(() => { onPhase?.(phase === 'result' ? (result?.id ? 'catch' : 'miss') : phase) }, [phase, result])
  useEffect(() => () => onPhase?.('idle'), [])

  const cast = () => {
    if (!onCast()) return
    clear(); setResult(null); setPhase('waiting')
    later(() => {
      setPhase('bite')
      later(() => { setResult({ miss: true }); setPhase('result') }, 1500)
    }, 1500 + Math.random() * 3200)
  }
  const hook = () => {
    if (phase === 'waiting') { clear(); setResult({ early: true }); setPhase('result') }
    else if (phase === 'bite') { clear(); const id = roll(); onCatch(id); setResult({ id }); setPhase('result') }
  }

  const loot = Object.entries(state.inventory).filter(([id]) => ITEMS[id]?.loot)
  const total = loot.reduce((t, [id, q]) => t + ITEMS[id].price * q, 0)
  const it = result?.id && ITEMS[result.id]

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-2 pb-2 sm:pb-4" style={{ animation: 'elph-pop 0.25s both' }}>
    <div className="overflow-hidden rounded-3xl border-4 border-blue-700 bg-sky-100 shadow-2xl">
      <div className="flex items-center justify-between bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-1.5 text-white">
        <span className="font-extrabold">🎣 Palaisdaan</span>
        <button onClick={onClose} aria-label="Close" className="rounded-lg border-b-2 border-red-800 bg-red-500 px-2 font-extrabold">✕</button>
      </div>
      <div className="max-h-[46vh] overflow-y-auto p-3">
      <div className="relative mb-3 h-28 overflow-hidden rounded-2xl border-4 border-sky-700 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-500">
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-sky-400/60 to-transparent" />
        <span className="absolute left-3 top-3 text-3xl">☀️</span>
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-sky-500 to-blue-700" />
        <div className="absolute inset-x-0 bottom-12 h-1 bg-white/40" />
        <span className="absolute bottom-3 left-6 animate-pulse text-xl opacity-70">🐟</span>
        <span className="absolute bottom-6 right-8 animate-pulse text-lg opacity-60">🐠</span>
        <span className="absolute left-5 top-6 text-3xl">🎣</span>
        {phase === 'waiting' && <span className="absolute left-1/2 top-12 -translate-x-1/2 animate-bounce text-2xl">🔴</span>}
        {phase === 'bite' && (
          <>
            <span className="absolute left-1/2 top-12 -translate-x-1/2 animate-ping text-2xl">🔴</span>
            <span className="absolute left-1/2 top-1 -translate-x-1/2 animate-bounce text-3xl">❗</span>
          </>
        )}
        {phase === 'idle' && <p className="absolute inset-x-0 bottom-3 text-center text-sm font-extrabold text-white drop-shadow">Ihagis ang pamingwit!</p>}
        {phase === 'waiting' && <p className="absolute inset-x-0 bottom-3 text-center text-sm font-extrabold text-white drop-shadow">Hintayin ang kagat...</p>}
        {phase === 'bite' && <p className="absolute inset-x-0 bottom-3 text-center text-lg font-extrabold text-yellow-200 drop-shadow">KUMAGAT! Hilahin na!</p>}
        {phase === 'result' && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/50 text-center text-white">
            {result?.miss && <div><p className="text-3xl">💨</p><p className="text-lg font-extrabold">Nakawala!</p></div>}
            {result?.early && <div><p className="text-3xl">🙈</p><p className="text-lg font-extrabold">Masyadong maaga!</p></div>}
            {it && (
              <div>
                <p className="text-4xl">{it.emoji}</p>
                <p className="text-lg font-extrabold">{it.name} {RARE[result.id] && <span className="text-yellow-300">{RARE[result.id]}</span>}</p>
                <p className="text-sm font-bold text-yellow-200">₱{it.price}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {phase === 'bite'
        ? <button className="btn-green w-full animate-pulse py-3 text-xl" onClick={hook}>🎣 HILAHIN!</button>
        : phase === 'waiting'
          ? <button className="btn-blue w-full py-3 text-lg" onClick={hook}>⏳ Hintay muna...</button>
          : <button className="btn-blue w-full py-3 text-lg" onClick={cast} disabled={state.energy < 5}>🎣 {phase === 'result' ? 'Cast Again' : 'Cast Line'} <span className="text-sm">(⚡ -5)</span></button>}
      {state.energy < 5 && <p className="mt-1 text-center text-xs font-bold text-red-600">Pagod ka na. Magpahinga o uminom muna.</p>}

      <div className="mt-3 rounded-xl bg-amber-100 p-2">
        <p className="mb-1 text-sm font-extrabold text-amber-900">🧺 Mga huli mo</p>
        {loot.length === 0 && <p className="p-1 text-center text-sm text-slate-500">Wala pang huli.</p>}
        <ul className="flex flex-wrap gap-1">
          {loot.map(([id, q]) => (
            <li key={id} className="rounded-full bg-white px-2 py-0.5 text-sm font-bold">{ITEMS[id].emoji} {ITEMS[id].name} ×{q}</li>
          ))}
        </ul>
        <button className="btn-green mt-2 w-full py-2" disabled={!total} onClick={onSell}>💰 Sell All {total ? `(₱${total})` : ''}</button>
        <p className="mt-1 text-center text-[11px] text-slate-500">Pwede mo ring kainin ang isda sa Inventory (I).</p>
      </div>
      </div>
    </div>
    </div>
  )
}