import { EMOTES } from '../game/emotes'

export default function EmotePicker({ onPick, onClose }) {
  return (
    <div
      className="absolute left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/90 p-2 shadow-xl backdrop-blur"
      style={{ bottom: 'calc(max(0.5rem, env(safe-area-inset-bottom)) + 4.8rem)' }}
    >
      <div className="mb-1 flex items-center justify-between px-1 text-xs font-extrabold text-yellow-300">
        <span>Emotes</span>
        <button type="button" onClick={onClose} aria-label="Close" className="px-1 text-white/70 hover:text-white">✕</button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {EMOTES.map((x) => (
          <button
            key={x.id} type="button" tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(x.id)}
            className="flex w-14 flex-col items-center rounded-xl bg-slate-800 py-1 active:scale-95"
          >
            <span className="text-2xl leading-none">{x.e}</span>
            <span className="mt-0.5 text-[10px] font-bold text-white/80">{x.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}