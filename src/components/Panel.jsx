export default function Panel({ title, onClose, children }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-4 border-blue-700 bg-sky-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-gradient-to-b from-blue-500 to-blue-700 px-3 py-2 text-white">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="h-7 w-7 rounded-md border-2 border-white bg-red-500 font-extrabold leading-none">×</button>
        </div>
        <div className="overflow-auto p-3">{children}</div>
      </div>
    </div>
  )
}
