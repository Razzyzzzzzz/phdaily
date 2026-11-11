import { useState } from 'react'
import Panel from './Panel'
import { JOBS } from '../data/gameData'

export default function JobPanel({ here, state, onComplete, notify, onClose }) {
  const [active, setActive] = useState(null)
  const [taps, setTaps] = useState(0)
  const job = active && JOBS[active]

  const apply = (id) => {
    const j = JOBS[id]
    if (here !== id) return notify(`📍 Go to the ${j.place} first (see Map).`)
    if (state.energy < j.energy) return notify('😴 Too tired. Sleep at home first.')
    if (state.hunger < j.hunger) return notify('🍽️ Too hungry. Eat first.')
    setActive(id); setTaps(0)
  }
  const tap = () => {
    if (taps + 1 >= job.taps) { onComplete(active); setActive(null); setTaps(0) } else setTaps(taps + 1)
  }

  if (job) {
    return (
      <Panel title={`${job.emoji} ${job.name}`} onClose={() => setActive(null)}>
        <p className="mb-2 text-center font-extrabold">{job.task} {taps + 1}/{job.taps}</p>
        <div className="mb-4 h-4 overflow-hidden rounded-full bg-white">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${(taps / job.taps) * 100}%` }} />
        </div>
        <button className="btn-orange w-full py-6 text-2xl" onClick={tap}>{job.emoji} Tap!</button>
        <button className="mt-2 w-full text-sm font-bold text-slate-500" onClick={() => setActive(null)}>Cancel shift</button>
      </Panel>
    )
  }
  return (
    <Panel title="💼 Job Panel" onClose={onClose}>
      <ul className="space-y-2">
        {Object.entries(JOBS).map(([id, j]) => (
          <li key={id} className="flex items-center gap-3 rounded-xl bg-white p-2">
            <span className="text-4xl">{j.emoji}</span>
            <div className="flex-1">
              <p className="font-extrabold">{j.name}</p>
              <p className="text-xs text-slate-500">Earn ₱{j.pay} · {j.taps} taps · ⚡−{j.energy} 🍽️−{j.hunger}</p>
            </div>
            <button className={here === id ? 'btn-blue px-4 py-1' : 'btn-blue px-4 py-1 opacity-60'} onClick={() => apply(id)}>Apply</button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-sm font-bold text-blue-900">Work to earn money!</p>
    </Panel>
  )
}
