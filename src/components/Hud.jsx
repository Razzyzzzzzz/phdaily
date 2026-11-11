import Avatar from './Avatar'
import { fmtTime, weather, level } from '../data/gameData'

function Bar({ icon, value, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-5 text-center text-sm">{icon}</span>
      <div className="relative h-4 flex-1 overflow-hidden rounded-full border-2 border-slate-900/70 bg-slate-800">
        <div className={`h-full transition-all ${color}`} style={{ width: `${value}%` }} />
        <span className="absolute inset-0 text-center text-[10px] font-extrabold leading-3 text-white">{Math.round(value)}/100</span>
      </div>
    </div>
  )
}

export default function Hud({ state }) {
  const { player, money, energy, hunger, health, day, minutes } = state
  const [wIcon, wLabel] = weather(day)
  return (
    <>
      <div className="absolute left-2 top-2 z-10 flex w-56 items-center gap-2 rounded-2xl bg-slate-900/70 p-2 backdrop-blur sm:w-64">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-4 border-yellow-400 bg-sky-200">
          <div style={{ transform: 'translate(-12px,-8px)' }}><Avatar look={player.look} /></div>
          <span className="absolute inset-x-0 bottom-0 bg-blue-700 text-center text-[9px] font-bold text-white">Lv.{level(state)}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-extrabold text-white">{player.name}</p>
          <Bar icon="❤️" value={health} color="bg-red-500" />
          <Bar icon="⚡" value={energy} color="bg-yellow-400" />
          <Bar icon="🍽️" value={hunger} color="bg-orange-500" />
        </div>
      </div>
      <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
        <div className="rounded-full bg-slate-900/70 px-3 py-1 font-extrabold text-yellow-300">🪙 ₱{Math.round(money).toLocaleString()}</div>
        <div className="rounded-xl bg-slate-900/70 px-3 py-1 text-sm font-bold text-white">{fmtTime(day, minutes)}<br />{wIcon} {wLabel}</div>
      </div>
    </>
  )
}
