import { useCallback, useEffect, useRef } from 'react'
import { api } from '../utils/api'

const DEBOUNCE_MS = 8000   // save this long after the last change...
const MAX_WAIT_MS = 30000  // ...but never wait longer than this (the reducer ticks constantly)

// Autosaves the reducer state to the server. Call it once, next to useReducer:
//   const { saveNow } = useServerSave(state, loggedIn && !!state.player)
// It also flushes when the tab is hidden / closed and when the component unmounts.
export function useServerSave(state, enabled) {
  const latest = useRef(state)
  const on = useRef(enabled)
  const timer = useRef(null)
  const dirtySince = useRef(0)
  const inflight = useRef(false)
  const queued = useRef(false)
  latest.current = state
  on.current = enabled

  const flush = useCallback(async (opts) => {
    clearTimeout(timer.current)
    dirtySince.current = 0
    if (!on.current || !latest.current?.player) return
    if (inflight.current) { queued.current = true; return }
    inflight.current = true
    try {
      await api.savePlayer(latest.current, opts)
    } catch {
      dirtySince.current = Date.now() // retried together with the next change
    } finally {
      inflight.current = false
      if (queued.current) { queued.current = false; flush() }
    }
  }, [])

  useEffect(() => {
    if (!enabled || !state.player) return
    const now = Date.now()
    if (!dirtySince.current) dirtySince.current = now
    clearTimeout(timer.current)
    timer.current = setTimeout(() => flush(), Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - (now - dirtySince.current))))
  }, [state, enabled, flush])

  useEffect(() => {
    const hide = () => { if (document.visibilityState === 'hidden') flush({ keepalive: true }) }
    const close = () => flush({ keepalive: true })
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', close)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', close)
      flush()
    }
  }, [flush])

  return { saveNow: () => flush() }
}
