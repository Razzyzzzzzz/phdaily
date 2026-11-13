import { useState } from 'react'
import { MAIN_QUESTS, rewardText } from '../data/progression'

// Main-quest card (top-left under the profile). Tap the header to collapse it.
// When the objective is done it turns into a "Claim" button. `compact` = small phone in landscape.
export default function QuestTracker({ state, onClaim, onTravel, defaultOpen = true, compact = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const q = MAIN_QUESTS[state.mq || 0]
  const width = compact ? 'w-44' : 'w-52 sm:w-64'
  if (!q) {
    return (
      <div className={`${width} rounded-2xl border border-white/10 bg-slate-900/75 px-3 py-2 text-xs font-extrabold text-yellow-300 shadow-lg backdrop-blur`}>
        🏆 Natapos mo na ang lahat ng Main Quest!
      </div>
    )
  }
  const [cur, goal] = q.prog(state)
  const done = q.done(state)
  return (
    <div className={`${width} overflow-hidden rounded-2xl border border-white/10 bg-slate-900/75 text-white shadow-lg backdrop-blur`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`flex w-full items-center gap-2 text-left ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-yellow-400 text-xs font-extrabold text-slate-900">!</span>
        <span className={`flex-1 font-extrabold text-yellow-300 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Main Quest</span>
        {done && !open && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />}
        <span className={`text-xs transition-transform ${open ? '' : '-rotate-90'}`}>▾</span>
      </button>
      {open && (
        <div className={`space-y-1 pb-2 ${compact ? 'px-2' : 'px-2.5'}`}>
          <p className={`font-extrabold leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>{q.title}</p>
          <p className={`leading-snug text-slate-200 ${compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'}`}>{q.text}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-yellow-200">{cur} / {goal}</span>
            {!compact && <span className="truncate text-[10px] font-bold text-slate-300">{rewardText(q.reward)}</span>}
          </div>
          <div className="flex gap-1.5">
            {done
              ? <button type="button" onClick={onClaim} className="flex-1 animate-pulse rounded-lg border-b-2 border-green-800 bg-green-500 py-0.5 text-xs font-extrabold">✅ Claim reward</button>
              : onTravel && <button type="button" onClick={() => onTravel(q.where)} className="flex-1 rounded-lg border-b-2 border-blue-900 bg-blue-600 py-0.5 text-xs font-extrabold">📍 Travel</button>}
          </div>
        </div>
      )}
    </div>
  )
}