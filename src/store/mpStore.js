import { useSyncExternalStore } from 'react'

// Small external store for multiplayer UI state (connection status, roster, chat).
// Live positions are NOT kept here: they change 15x/second and live in multiplayer.remotes instead.
let state = {
  status: 'offline', // offline | connecting | online | reconnecting | replaced | error
  error: null,
  selfId: null,
  selfLabel: '',     // text shown above the local player's head
  players: [],       // [{ id, username, level, look, online, self? }]
  onlineCount: 0,
  chat: [],          // [{ id, userId, username, text, ts, mine }]
  unread: 0,
  chatOpen: false,
}
const listeners = new Set()

export const mpStore = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

// The selector must return a primitive or an existing reference (not a freshly built array/object).
export function useMp(selector = (s) => s) {
  return useSyncExternalStore(mpStore.subscribe, () => selector(state), () => selector(state))
}
