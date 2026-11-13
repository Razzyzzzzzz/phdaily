// Modal panel: kasya sa phone (dvh + safe-area), nasasa-scroll ang laman, malaki ang close button para sa daliri
export default function Panel({ title, onClose, children, wide = false }) {
  return (
    <div
      role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-3" onClick={onClose}
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))', paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      <div
        className={`flex max-h-full w-full ${wide ? 'max-w-2xl' : 'max-w-md'} flex-col overflow-hidden rounded-2xl border-4 border-blue-700 bg-sky-100 shadow-2xl`}
        style={{ animation: 'elph-pop 0.2s both' }} onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-b from-blue-500 to-blue-700 px-3 py-2 text-white">
          <h2 className="truncate text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 border-white bg-red-500 text-lg font-extrabold leading-none active:scale-95">×</button>
        </div>
        <div className="touch-pan-y overflow-y-auto overscroll-contain p-3">{children}</div>
      </div>
    </div>
  )
}