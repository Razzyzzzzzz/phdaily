import { useState } from 'react'
import Title from './Title'
import { read, write, USERS } from '../store/storage'

// Local-only placeholder auth (btoa is NOT security). Swap for a real backend later.
export default function AuthScreen({ onAuth }) {
  const [register, setRegister] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  const submit = () => {
    const u = user.trim()
    if (!u || pass.length < 4) return setErr('Enter a username and a password (4+ characters).')
    const users = read(USERS) || {}
    if (register) {
      if (users[u]) return setErr('That username is taken.')
      write(USERS, { ...users, [u]: btoa(pass) })
    } else if (users[u] !== btoa(pass)) return setErr('Wrong username or password.')
    onAuth(u)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 overflow-auto bg-gradient-to-b from-sky-400 via-sky-200 to-green-300 p-4">
      <Title />
      <div className="w-full max-w-xs space-y-3 rounded-2xl border-4 border-blue-700 bg-white/90 p-4 shadow-xl">
        <p className="text-center text-lg font-extrabold text-blue-900">{register ? 'Create account' : 'Welcome Back!'}</p>
        <input className="field" placeholder="Username" value={user} maxLength={14} onChange={(e) => setUser(e.target.value)} />
        <input className="field" type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        {err && <p className="text-sm font-bold text-red-600">{err}</p>}
        <button className="btn-blue w-full" onClick={submit}>{register ? 'Register' : 'Login'}</button>
        <p className="text-center text-sm text-slate-600">
          {register ? 'Already have an account? ' : "Don't have an account? "}
          <button className="font-bold text-blue-600 underline" onClick={() => { setRegister(!register); setErr('') }}>{register ? 'Login' : 'Register'}</button>
        </p>
      </div>
    </div>
  )
}
