import { useMp } from '../store/mpStore'

// Dropdown list of everybody in the world right now (opened from the online chip in the HUD).
export default function OnlinePlayers({ onClose }) {
  const players = useMp((s) => s.players)
  return (
    <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-slate-900/90 text-white shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs font-extrabold text-yellow-300">
        <span>Players in town</span>
        <button type="button" onClick={onClose} className="rounded px-1 text-white/70 hover:text-white" aria-label="Close">✕</button>
      </div>
      <ul className="max-h-48 overflow-y-auto py-1">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2 px-3 py-1 text-xs font-bold">
            <span className={`h-2 w-2 shrink-0 rounded-full ${p.online ? 'bg-green-400' : 'bg-orange-400'}`} />
            <span className="min-w-0 flex-1 truncate">{p.username}{p.self ? ' (you)' : ''}</span>
            <span className="shrink-0 rounded-full bg-blue-700 px-1.5 text-[10px]">Lv.{p.level}</span>
          </li>
        ))}
        {!players.length && <li className="px-3 py-2 text-xs text-white/60">Nobody here yet.</li>}
      </ul>
    </div>
  )
}
