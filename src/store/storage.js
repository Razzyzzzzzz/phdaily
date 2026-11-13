export const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } }
export const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
export const USERS = 'elph:users'
export const SETTINGS = 'elph:settings'
export const saveKey = (u) => 'elph:save:' + u

// ---------- online accounts (backend/) ----------
export const TOKEN = 'elph:token'
export const getToken = () => { try { return localStorage.getItem(TOKEN) } catch { return null } }
export const setToken = (t) => { try { localStorage.setItem(TOKEN, t) } catch { /* private mode: session lasts until reload */ } }
export const clearToken = () => { try { localStorage.removeItem(TOKEN) } catch { /* ignore */ } }

// Backend URL. Set VITE_API_URL in .env for production (e.g. https://your-api.onrender.com).
// By default it points at port 4000 of whatever host served the page, so a phone that opened
// http://192.168.x.x:5173 automatically talks to http://192.168.x.x:4000.
const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : undefined
const fallback = typeof location !== 'undefined' ? `${location.protocol}//${location.hostname}:4000` : 'http://localhost:4000'
export const API_URL = (envUrl || fallback).replace(/\/+$/, '')
