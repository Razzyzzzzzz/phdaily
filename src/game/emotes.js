// Shared emote list. The backend has the same ids in emoteHandlers.js (whitelist).
export const EMOTES = [
  { id: 'wave', e: '👋', name: 'Wave' },
  { id: 'laugh', e: '😂', name: 'Laugh' },
  { id: 'love', e: '❤️', name: 'Love' },
  { id: 'cry', e: '😭', name: 'Cry' },
  { id: 'angry', e: '😡', name: 'Angry' },
  { id: 'thumbs', e: '👍', name: 'Nice' },
  { id: 'party', e: '🎉', name: 'Party' },
  { id: 'sleep', e: '😴', name: 'Sleepy' },
]
export const EMOTE_BY_ID = Object.fromEntries(EMOTES.map((x) => [x.id, x]))
export const EMOTE_MS = 3500