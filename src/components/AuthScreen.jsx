import { useRef, useState } from 'react'
import { api } from '../utils/api'

// Login / register screen for online accounts.
// onAuthed receives { token, user: { id, username }, hasCharacter } after a successful login or registration.
export default function AuthScreen({ onAuthed, onBack }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false) // blocks double submits instantly (state updates are async)
  const register = mode === 'register'

  const submit = async (e) => {
    e.preventDefault()
    if (inFlight.current) return
    setError('')
    const u = username.trim()
    if (!/^[A-Za-z0-9_]{3,16}$/.test(u)) return setError('Username: 3-16 letters, numbers or underscore.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (register && password !== confirm) return setError('Passwords do not match.')
    inFlight.current = true
    setBusy(true)
    try {
      const res = register ? await api.register(u, password) : await api.login(u, password)
      onAuthed(res)
    } catch (err) {
      setError(err.message)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const field = 'w-full rounded-xl border-2 border-slate-600 bg-slate-800 px-3 py-2 text-base font-semibold text-white placeholder-white/40 outline-none focus:border-yellow-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gradient-to-b from-sky-400 to-sky-200 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-3xl border-4 border-yellow-400 bg-slate-900/95 p-5 shadow-2xl">
        <h1 className="text-center text-2xl font-extrabold text-yellow-300">{register ? 'Create account' : 'Log in'}</h1>
        <p className="text-center text-xs font-semibold text-white/60">Everyday Life: Philippines online</p>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-800 p-1 text-sm font-extrabold">
          {[['login', 'Log in'], ['register', 'Register']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
              className={`rounded-lg py-1.5 ${mode === m ? 'bg-yellow-400 text-slate-900' : 'text-white/70'}`}>{label}</button>
          ))}
        </div>

        <input className={field} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={16} />
        <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} />
        {register && <input className={field} type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />}

        {error && <p className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-bold text-red-200">{error}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-xl bg-yellow-400 py-2.5 text-base font-extrabold text-slate-900 shadow disabled:opacity-60">
          {busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}
        </button>
        {onBack && <button type="button" onClick={onBack} className="w-full text-sm font-bold text-white/60 hover:text-white">← Back</button>}
      </form>
    </div>
  )
}