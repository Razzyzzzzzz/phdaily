export const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } }
export const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
export const USERS = 'elph:users'
export const SETTINGS = 'elph:settings'
export const saveKey = (u) => 'elph:save:' + u
