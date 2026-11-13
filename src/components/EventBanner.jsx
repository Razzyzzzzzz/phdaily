import { useEffect, useState } from 'react'
import { eventState, fmtMs } from '../data/progression'

// "Fishing Tournament - Starts in 15m!" / "...is LIVE! 7m left". The schedule is derived from the real clock
// (see eventState in progression.js), so every player sees the same event at the same time.
export default function EventBanner({ state, onOpen }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const e = eventState(now)
  const mine = state.events?.[e.slot]
  const joined = !!mine && mine.evId === e.ev.id
  return (
    <button
      type="button" onClick={onOpen}
      className={`flex max-w-[15rem] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left shadow-lg backdrop-blur ${e.live ? 'border-yellow-300 bg-orange-600/90' : 'border-white/10 bg-slate-900/75'}`}
    >
      <span className="text-2xl leading-none">{e.ev.icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-extrabold text-white sm:text-sm">{e.ev.name}</span>
        <span className={`block text-[11px] font-extrabold sm:text-xs ${e.live ? 'text-yellow-200' : 'text-cyan-300'}`}>
          {e.live ? (joined ? `Joined · ${fmtMs(e.msLeft)} left` : `LIVE! ${fmtMs(e.msLeft)} left`) : `Starts in ${fmtMs(e.msToStart)}!`}
        </span>
      </span>
    </button>
  )
}
