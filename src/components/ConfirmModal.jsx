import { useEffect } from 'react'

// In-game confirm modal (pamalit sa window.confirm)
export default function ConfirmModal({ title = 'Are you sure?', message, confirmText = 'Yes', cancelText = 'Cancel', danger = true, onConfirm, onCancel }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCancel() } }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="alertdialog" aria-modal="true" aria-label={title}
        className="w-full max-w-sm overflow-hidden rounded-3xl border-4 border-blue-700 bg-sky-100 shadow-2xl"
        style={{ animation: 'elph-pop 0.25s both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-b from-blue-500 to-blue-700 px-4 py-2 text-center text-lg font-extrabold text-white">
          {title}
        </div>
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          <div className={`grid h-16 w-16 place-items-center rounded-full border-4 text-3xl shadow-inner ${danger ? 'border-yellow-400 bg-yellow-100' : 'border-blue-300 bg-blue-100'}`}>
            {danger ? '⚠️' : '❓'}
          </div>
          <p className="rounded-xl bg-white px-3 py-2 font-bold text-slate-700">{message}</p>
          <div className="mt-1 grid w-full grid-cols-2 gap-3">
            <button className="btn-blue py-2" onClick={onCancel}>{cancelText}</button>
            <button className={`${danger ? 'btn-red' : 'btn-green'} py-2`} onClick={onConfirm} autoFocus>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  )
}