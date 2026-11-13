import { useState } from 'react'
import HudPortrait from './HudPortrait'
import ChatPanel from './ChatPanel'
import OnlinePlayers from './OnlinePlayers'
import { useMp } from '../store/mpStore'
import { fmtTime, weather, level } from '../data/gameData'

const clamp = (v) => Math.max(0, Math.min(100, v))

function Bar({ icon, value, color }) {
  const v = clamp(value)
  const low = v <= 25
  return (
    <div className="flex items-center gap-1">
      <span className="w-5 text-center text-sm leading-none">{icon}</span>
      <div className={`relative h-4 flex-1 overflow-hidden rounded-full border-2 border-slate-950/80 bg-slate-800 sm:h-[18px] ${low ? 'animate-pulse' : ''}`}>
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${v}%` }} />
        {/* glossy highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold leading-none text-white sm:text-[11px]"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.8)' }}
        >
          {Math.round(v)}/100
        </span>
      </div>
    </div>
  )
}

const STATUS = {
  connecting: ['🟡', 'Connecting…'],
  reconnecting: ['🟠', 'Reconnecting…'],
  replaced: ['🔴', 'Signed in elsewhere'],
  error: ['🔴', 'Offline'],
}

// Multiplayer connection indicator. Click it while online to see who is in town.
function OnlineChip() {
  const status = useMp((s) => s.status)
  const count = useMp((s) => s.onlineCount)
  const [open, setOpen] = useState(false)
  if (status === 'offline') return null // not logged in online: single-player, nothing to show
  const [dot, text] = STATUS[status] || ['🟢', null]
  const online = status === 'online'
  return (
    <div className="relative">
      <button
        type="button" onClick={() => online && setOpen((o) => !o)}
        className="rounded-full border border-white/10 bg-slate-900/75 px-3 py-0.5 text-xs font-extrabold text-white shadow sm:py-1 sm:text-sm"
      >
        {dot} {online ? `${count} online` : text}
      </button>
      {open && online && <OnlinePlayers onClose={() => setOpen(false)} />}
    </div>
  )
}

export default function Hud({ state }) {
  const { player, money, energy, hunger, health, day, minutes } = state
  const [wIcon, wLabel] = weather(day)
  return (
    <>
      <div
        className="absolute z-10 flex w-52 items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-900/75 p-1.5 shadow-lg backdrop-blur sm:w-64 sm:p-2"
        style={{ top: 'max(0.5rem, env(safe-area-inset-top))', left: 'max(0.5rem, env(safe-area-inset-left))' }}
      >
        {/* 3D portrait (same model as the game) + level badge outside the circle */}
        <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-md">
            <HudPortrait look={player.look} />
          </div>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-white bg-blue-700 px-1.5 text-[9px] font-extrabold leading-4 text-white shadow">
            Lv.{level(state)}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-extrabold leading-tight text-white sm:text-base">{player.name}</p>
          <Bar icon="❤️" value={health} color="bg-gradient-to-b from-red-400 to-red-600" />
          <Bar icon="⚡" value={energy} color="bg-gradient-to-b from-yellow-300 to-yellow-500" />
          <Bar icon="🍽️" value={hunger} color="bg-gradient-to-b from-orange-400 to-orange-600" />
        </div>
      </div>

      <div className="absolute z-10 flex flex-col items-end gap-1" style={{ top: 'max(0.5rem, env(safe-area-inset-top))', right: 'max(0.5rem, env(safe-area-inset-right))' }}>
        <div className="rounded-full border border-white/10 bg-slate-900/75 px-3 py-0.5 text-sm font-extrabold text-yellow-300 shadow sm:py-1 sm:text-base">🪙 ₱{Math.round(money).toLocaleString()}</div>
        <div className="rounded-xl border border-white/10 bg-slate-900/75 px-3 py-0.5 text-xs font-bold leading-tight text-white shadow sm:py-1 sm:text-sm">{fmtTime(day, minutes)}<br />{wIcon} {wLabel}</div>
        <OnlineChip />
      </div>

      <ChatPanel />
    </>
  )
}