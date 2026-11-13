import { useEffect, useRef, useState } from 'react'
import { mpStore, useMp } from '../store/mpStore'
import { multiplayer } from '../game/multiplayer'

const COLORS = ['#fca5a5', '#fcd34d', '#86efac', '#7dd3fc', '#c4b5fd', '#f9a8d4', '#fdba74']
const colorOf = (name = '') => COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length]
const ERRORS = { slow_down: 'Slow down a little…', rate_limited: 'Too many messages. Wait a few seconds.', empty: '', offline: 'Not connected.', timeout: 'Message not delivered.', not_in_world: 'Not connected.' }
const TABS = [['all', 'All'], ['near', 'Nearby'], ['friends', 'Friends']]
const QUICK = ['😀', '😂', '❤️', '👍', '😭', '🎉']
const NEAR = 700 // world px

function useTall() {
  const get = () => (typeof window === 'undefined' ? true : window.innerHeight > 560)
  const [t, setT] = useState(get)
  useEffect(() => { const f = () => setT(get()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return t
}

export default function ChatPanel({ bridge }) {
  const status = useMp((s) => s.status)
  const chat = useMp((s) => s.chat)
  const unread = useMp((s) => s.unread)
  const tall = useTall()
  const [open, setOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerHeight > 560))
  const [tab, setTab] = useState('all')
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [emojis, setEmojis] = useState(false)
  const [toast, setToast] = useState(null)
  const listRef = useRef(null)
  const last = chat[chat.length - 1]

  const isNear = (m) => {
    if (m.mine) return true
    const me = bridge?.me
    const r = multiplayer.remotes.get(m.userId)
    const p = r?.cur || r?.tgt
    return !!me && !!p && Math.hypot(me.x - p.x, me.z - p.z) < NEAR
  }
  const shown = tab === 'all' ? chat : tab === 'near' ? chat.filter(isNear) : []

  useEffect(() => { if (!tall) setOpen(false) }, [tall]) // small screen: collapse to the icon
  useEffect(() => { mpStore.set({ chatOpen: open, unread: 0 }) }, [open])
  useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [open, tab, chat.length])
  // while collapsed, flash the newest message from someone else for a few seconds
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
    setText(''); setEmojis(false)
    const res = await multiplayer.sendChat(t)
    if (!res.ok) {
      setText(t)
      setErr(ERRORS[res.error] ?? 'Message not sent.')
      setTimeout(() => setErr(''), 2500)
    }
  }

  // phone in landscape: sit above the joystick so nothing overlaps
  // small screen: the icon sits above the joystick; when opened it covers the joystick area (it is temporary)
  const bottom = tall || open ? 'max(0.5rem, env(safe-area-inset-bottom))' : 'calc(max(0.5rem, env(safe-area-inset-bottom)) + 9rem)'

  return (
    <div className={`absolute ${open ? 'z-20' : 'z-10'}`} style={{ left: 'max(0.5rem, env(safe-area-inset-left))', bottom }}>
      {!open && (
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open chat"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-sky-200/70 bg-slate-900/80 text-xl shadow-lg backdrop-blur">
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
        <div className={tall ? 'w-72 sm:w-80' : 'w-64'} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') setOpen(false) }}>
          {/* tabs */}
          <div className="flex items-end gap-1 pl-1">
            {TABS.map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`rounded-t-xl px-3 py-1 text-xs font-extrabold ${tab === k ? 'bg-slate-900/90 text-white' : 'bg-slate-700/70 text-white/70'}`}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => setOpen(false)} aria-label="Hide chat" className="ml-auto mb-0.5 rounded px-1.5 text-xs font-extrabold text-white/70 hover:text-white">—</button>
          </div>
          <div className="rounded-b-2xl rounded-tr-2xl border border-white/10 bg-slate-900/85 shadow-xl backdrop-blur">
            <div ref={listRef} className={`space-y-0.5 overflow-y-auto px-3 py-1.5 leading-snug ${tall ? 'h-20 text-xs sm:h-24 sm:text-sm' : 'h-14 text-xs'}`}>
              {tab === 'friends' && <p className="text-white/50">Wala pang friends list.</p>}
              {tab !== 'friends' && !shown.length && <p className="text-white/50">{tab === 'near' ? 'Walang malapit na nag-chat.' : 'No messages yet. Say hi!'}</p>}
              {shown.map((m) => (
                <p key={m.id} className="break-words font-semibold text-white">
                  <span className="font-extrabold" style={{ color: m.mine ? '#fde047' : colorOf(m.username) }}>{m.username}</span>
                  <span className="text-white/60"> : </span>{m.text}
                </p>
              ))}
            </div>
            {err && <p className="px-3 text-[11px] font-bold text-orange-300">{err}</p>}
            {emojis && (
              <div className="flex gap-1 px-2 pb-1">
                {QUICK.map((em) => (
                  <button key={em} type="button" onClick={() => setText((t) => (t + em).slice(0, 200))} className="rounded-lg bg-slate-800 px-1.5 text-lg">{em}</button>
                ))}
              </div>
            )}
            <form onSubmit={submit} className="flex items-center gap-1.5 p-2 pt-1">
              <input
                value={text} onChange={(e) => setText(e.target.value)} maxLength={200} autoComplete="off" enterKeyHint="send"
                disabled={!online} placeholder={online ? 'Type a message…' : 'Reconnecting…'}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-slate-800 px-3 py-1.5 text-base font-semibold text-white placeholder-white/40 outline-none focus:border-sky-400 sm:text-sm"
              />
              <button type="button" onClick={() => setEmojis((v) => !v)} aria-label="Emoji" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-700 text-base">🙂</button>
              <button type="submit" aria-label="Send" disabled={!online || !text.trim()} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-500 text-sm font-extrabold text-white disabled:opacity-40">➤</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}