import { useEffect, useRef, useState } from 'react'
import Panel from './Panel'
import { WW, WH, PLACES, LOCATIONS, ROAD2, VROAD, POND } from '../game/world'

// icon per place id. New places added to world.js show up automatically (fallback: 📍)
const ICONS = {
  house: '🏠', sari: '🏪', restaurant: '🍽️', market: '🛒', terminal: '🚌', barangay: '🏛️', hospital: '🏥',
  church: '⛪', bakery: '🥖', school: '🏫', mall: '🛍️', police: '🚓', gym: '🏀', library: '📚',
  barber: '💈', hardware: '🔧', park: '🌳', fishpond: '🎣',
}
// places that are in LOCATIONS but not in PLACES (no building)
const EXTRA = {
  park: { label: 'Parke', area: { x: 380, y: 1090, w: 420, h: 320 } }, // approximate, adjust to your real park
  fishpond: { label: 'Fishpond' },
}
const BLDG_H = 240 // drawn height of a building on the map (world px)

export function MapPanel({ onGo, onClose, getPos }) {
  // getPos: () => ({ x, z }) | undefined — pass () => bridge.mini from App.jsx
  const [sel, setSel] = useState(null)
  const [zoom, setZoom] = useState(2) // 1 = whole town, 2-3 = bigger (scroll / drag to move)
  const box = useRef(null)
  const [me, setMe] = useState(() => getPos?.() || null)

  useEffect(() => {
    if (!getPos) return
    const t = setInterval(() => { const p = getPos(); if (p) setMe({ x: p.x, z: p.z }) }, 250)
    return () => clearInterval(t)
  }, [getPos])

  // keep the view centered on the selected place (or on you) when zoom changes
  useEffect(() => {
    const el = box.current
    if (!el) return
    const [cx, cz] = sel ? LOCATIONS[sel] : me ? [me.x, me.z] : [WW / 2, WH / 2]
    el.scrollLeft = (cx / WW) * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = (cz / WH) * el.scrollHeight - el.clientHeight / 2
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom])

  const label = (id) => PLACES.find((p) => p.id === id)?.label || EXTRA[id]?.label || id
  const ids = Object.keys(LOCATIONS)
  const mark = (id) => {
    const [x, z] = LOCATIONS[id]
    return { id, x, z, icon: ICONS[id] || '📍', label: label(id) }
  }

  return (
    <Panel title="🗺️ World Map" onClose={onClose}>
      <ol className="mb-2 space-y-0.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-blue-900">
        <li>1️⃣ Pindutin ang lugar sa mapa (🔴 = ikaw ngayon).</li>
        <li>2️⃣ Pindutin ang <span className="rounded bg-green-500 px-1 text-white">Travel</span> para pumunta doon.</li>
        <li>🔍 Gamitin ang <b>+</b> / <b>−</b> para mag-zoom; i-scroll o i-drag ang mapa para gumalaw.</li>
      </ol>

      <div className="mb-1 flex items-center justify-center gap-2">
        <button className="btn-blue px-3 py-0.5" disabled={zoom <= 1} onClick={() => setZoom(zoom - 1)}>−</button>
        <span className="text-sm font-extrabold text-blue-900">Zoom {zoom}x</span>
        <button className="btn-blue px-3 py-0.5" disabled={zoom >= 3} onClick={() => setZoom(zoom + 1)}>+</button>
      </div>
      <div ref={box} className="overflow-auto rounded-xl border-2 border-blue-700 bg-green-300" style={{ maxHeight: '48dvh' }}>
        <svg viewBox={`0 0 ${WW} ${WH}`} className="block h-auto max-w-none" style={{ width: `${zoom * 100}%` }}>
          <defs>
            <pattern id="grass" width="120" height="120" patternUnits="userSpaceOnUse">
              <rect width="120" height="120" fill="#86d27a" />
              <circle cx="30" cy="40" r="6" fill="#74c46a" />
              <circle cx="90" cy="85" r="6" fill="#74c46a" />
            </pattern>
          </defs>
          <rect width={WW} height={WH} fill="url(#grass)" />

          {/* roads */}
          <rect x={0} y={540} width={WW} height={190} fill="#475569" />
          <rect x={0} y={625} width={WW} height={12} fill="#fde047" opacity="0.8" />
          <rect x={VROAD.x} y={730} width={VROAD.w} height={ROAD2.y - 730} fill="#475569" />
          <rect x={0} y={ROAD2.y} width={WW} height={ROAD2.h} fill="#475569" />
          <rect x={0} y={ROAD2.y + ROAD2.h / 2 - 6} width={WW} height={12} fill="#fde047" opacity="0.8" />

          {/* park */}
          <rect {...EXTRA.park.area} rx="60" fill="#4ade80" stroke="#15803d" strokeWidth="12" />

          {/* fishpond */}
          <rect x={POND.x} y={POND.z} width={POND.w} height={POND.d} rx="80" fill="#38bdf8" stroke="#0369a1" strokeWidth="14" />

          {/* buildings */}
          {PLACES.map((p) => (
            <g key={p.id}>
              <rect x={p.x} y={p.base - BLDG_H} width={p.w} height={BLDG_H} rx="18"
                fill={'#' + p.color.toString(16).padStart(6, '0')}
                stroke={'#' + p.roof.toString(16).padStart(6, '0')} strokeWidth="22" />
            </g>
          ))}

          {/* pins */}
          {ids.map((id) => {
            const m = mark(id), on = sel === id
            return (
              <g key={id} onClick={() => setSel(id)} style={{ cursor: 'pointer' }}>
                <circle cx={m.x} cy={m.z} r={on ? 150 : 120} fill={on ? '#facc15' : '#ffffff'} stroke={on ? '#b45309' : '#1e3a8a'} strokeWidth="18" />
                {zoom >= 2 && (
                  <text x={m.x} y={m.z + 270} textAnchor="middle" fontSize="105" fontWeight="800" fill="#fff"
                    stroke="#0f172a" strokeWidth="26" paintOrder="stroke" strokeLinejoin="round">{m.label}</text>
                )}
                <text x={m.x} y={m.z + (on ? 56 : 46)} textAnchor="middle" fontSize={on ? 150 : 124}>{m.icon}</text>
              </g>
            )
          })}

          {/* you are here */}
          {me && (
            <g pointerEvents="none">
              <circle cx={me.x} cy={me.z} r="110" fill="#ef4444" opacity="0.3">
                <animate attributeName="r" values="60;140;60" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle cx={me.x} cy={me.z} r="52" fill="#ef4444" stroke="#fff" strokeWidth="18" />
            </g>
          )}
        </svg>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-white px-3 py-2 text-lg font-extrabold">
          {sel ? <><span className="mr-1">{ICONS[sel] || '📍'}</span>{label(sel)}</> : <span className="text-slate-400">No place selected</span>}
        </div>
        <button className="btn-green px-4 py-2 disabled:opacity-40" disabled={!sel} onClick={() => onGo(sel)}>Travel</button>
      </div>
      {me && <p className="mt-1 text-center text-xs font-bold text-slate-500">🔴 You are here</p>}
    </Panel>
  )
}