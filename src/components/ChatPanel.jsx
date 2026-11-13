import { useEffect, useRef, useState } from 'react'
import { mpStore, useMp } from '../store/mpStore'
import { multiplayer } from '../game/multiplayer'

const COLORS = ['#fca5a5', '#fcd34d', '#86efac', '#7dd3fc', '#c4b5fd', '#f9a8d4', '#fdba74']
const colorOf = (name) => COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length]
const ERRORS = { slow_down: 'Slow down a little…', rate_limited: 'Too many messages. Wait a few seconds.', empty: '', offline: 'Not connected.', timeout: 'Message not delivered.', not_in_world: 'Not connected.' }

export default function ChatPanel() {
  const status = useMp((s) => s.status)
  const chat = useMp((s) => s.chat)
  const unread = useMp((s) => s.unread)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [toast, setToast] = useState(null)
  const listRef = useRef(null)
  const last = chat[chat.length - 1]

  useEffect(() => { mpStore.set({ chatOpen: open, unread: 0 }) }, [open])
  useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [open, chat.length])
  // while the panel is closed, flash the newest message from someone else for a few seconds
  useEffect(() => {
    if (open || !last || last.mine) return undefined
    setToast(last)
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [last?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'offline') return null
  const online = status === 'online'

  const submit = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || !online) return
    setText('')
    const res = await multiplayer.sendChat(t)
    if (!res.ok) {
      setText(t)
      setErr(ERRORS[res.error] ?? 'Message not sent.')
      setTimeout(() => setErr(''), 2500)
    }
  }

  return (
    <div className="absolute z-10" style={{ top: 'calc(max(0.5rem, env(safe-area-inset-top)) + 5.75rem)', left: 'max(0.5rem, env(safe-area-inset-left))' }}>
      {!open && (
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open chat"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/75 text-lg shadow backdrop-blur">
            💬
            {unread > 0 && <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-red-500 px-1 text-center text-[10px] font-extrabold leading-4 text-white">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {toast && (
            <div className="max-w-[14rem] rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white shadow backdrop-blur">
              <span style={{ color: colorOf(toast.username) }}>{toast.username}: </span>{toast.text}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="w-64 rounded-2xl border border-white/10 bg-slate-900/85 shadow-xl backdrop-blur sm:w-72" onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') setOpen(false) }}>
          <div className="flex items-center justify-between px-3 pt-1.5 text-xs font-extrabold text-yellow-300">
            <span>Town chat</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded px-1 text-white/70 hover:text-white" aria-label="Close chat">✕</button>
          </div>
          <div ref={listRef} className="h-32 space-y-0.5 overflow-y-auto px-3 py-1 text-xs leading-snug sm:h-40">
            {!chat.length && <p className="text-white/50">No messages yet. Say hi!</p>}
            {chat.map((m) => (
              <p key={m.id} className="break-words font-semibold text-white">
                <span className="font-extrabold" style={{ color: m.mine ? '#fde047' : colorOf(m.username) }}>{m.username}</span>
                <span className="text-white/60">: </span>{m.text}
              </p>
            ))}
          </div>
          {err && <p className="px-3 text-[11px] font-bold text-orange-300">{err}</p>}
          <form onSubmit={submit} className="flex gap-1.5 p-2">
            <input
              value={text} onChange={(e) => setText(e.target.value)} maxLength={200} autoComplete="off" enterKeyHint="send"
              disabled={!online} placeholder={online ? 'Type a message…' : 'Reconnecting…'}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-base font-semibold text-white placeholder-white/40 outline-none focus:border-yellow-400 sm:text-sm"
            />
            <button type="submit" disabled={!online || !text.trim()} className="rounded-lg bg-yellow-400 px-3 text-sm font-extrabold text-slate-900 disabled:opacity-40">Send</button>
          </form>
        </div>
      )}
    </div>
  )
}
