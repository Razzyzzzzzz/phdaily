import { Component, lazy, Suspense, useState } from 'react'
import Panel from './Panel'
import Avatar from './Avatar'
import { MAP_SPOTS, MISSIONS, NPC_TIPS, xpInfo } from '../data/gameData'

// 3D code is only loaded when the Profile panel is opened
const ProfileCharacter = lazy(() => import('./ProfileCharacter'))
class StageBoundary extends Component {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e) { console.warn('Profile 3D fallback:', e) }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}

const toggleFs = async () => {
  try {
    if (document.fullscreenElement) { await document.exitFullscreen(); screen.orientation?.unlock?.() }
    else { await document.documentElement.requestFullscreen(); await screen.orientation?.lock?.('landscape').catch(() => {}) }
  } catch { /* hindi suportado ng browser */ }
}

export function MapPanel({ onGo, onClose }) {
  return (
    <Panel title="🗺️ World Map" onClose={onClose}>
      <p className="mb-2 text-center text-sm font-bold text-blue-900">Tap a place to travel there.</p>
      <div className="grid max-h-[60dvh] grid-cols-2 gap-2 overflow-y-auto">
        {MAP_SPOTS.map(([id, icon, label]) => (
          <button key={id} onClick={() => onGo(id)} className="rounded-xl border-2 border-green-700 bg-green-200 py-3 text-lg font-extrabold text-green-900 active:scale-95">
            <span className="block text-3xl">{icon}</span>{label}
          </button>
        ))}
      </div>
    </Panel>
  )
}

export function HousePanel({ onSleep, onClose }) {
  return (
    <Panel title="🏠 My House" onClose={onClose}>
      <div className="mb-3 rounded-xl bg-white p-3 text-center font-bold">“Rest here to recover Energy!”</div>
      <button className="btn-blue w-full py-3 text-xl" onClick={onSleep}>🛏️ Sleep</button>
    </Panel>
  )
}

export function DialogPanel({ npc, onShop, onClose }) {
  const [tip, setTip] = useState(false)
  const hint = NPC_TIPS[npc.id]
  return (
    <Panel title={`💬 ${npc.name}`} onClose={onClose}>
      <p className="mb-3 rounded-xl bg-white p-3 text-lg font-bold">{tip && hint ? hint : npc.line}</p>
      <div className="space-y-2">
        {npc.shop && <button className="btn-green w-full" onClick={() => onShop(npc.shop)}>Yes, Sure!</button>}
        {hint && !tip && <button className="btn-orange w-full" onClick={() => setTip(true)}>💡 May maipapagawa ka ba?</button>}
        <button className="btn-blue w-full" onClick={onClose}>Not right now</button>
        <button className="btn-blue w-full" onClick={onClose}>Bye!</button>
      </div>
    </Panel>
  )
}

export function MissionsPanel({ state, onClaim, onClose }) {
  const claimable = MISSIONS.filter((m) => !state.claimed[m.id] && m.done(state)).length
  const doneCount = MISSIONS.filter((m) => state.claimed[m.id]).length
  return (
    <Panel title="🏆 Missions" onClose={onClose}>
      <p className="mb-2 text-center text-sm font-bold text-blue-900">
        ✅ {doneCount}/{MISSIONS.length} tapos {claimable > 0 && <span className="text-orange-600">· {claimable} na pwedeng i-claim!</span>}
      </p>
      <ul className="max-h-[56dvh] space-y-2 overflow-y-auto">
        {MISSIONS.map((m) => {
          const done = m.done(state), claimed = state.claimed[m.id]
          const [cur, goal] = m.prog ? m.prog(state) : [done ? 1 : 0, 1]
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-xl bg-white p-2">
              <span className="text-3xl">{m.icon}</span>
              <div className="flex-1">
                <p className="font-bold leading-tight">{m.text}</p>
                <p className="text-xs text-slate-500">({cur} / {goal})</p>
              </div>
              <span className="rounded-full bg-yellow-300 px-2 text-sm font-extrabold">₱{m.reward}</span>
              {claimed ? <span className="w-9 text-center text-xl">✅</span>
                : <button className="btn-blue px-3 py-1" disabled={!done} onClick={() => onClaim(m.id)}>→</button>}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

const STAT_CARDS = [
  ['💰', 'Total Money', 'from-yellow-400 to-amber-600'],
  ['💼', 'Jobs Done', 'from-sky-400 to-blue-700'],
  ['🎯', 'Activities', 'from-emerald-400 to-green-700'],
  ['🐟', 'Fish Caught', 'from-cyan-400 to-teal-700'],
  ['⏱️', 'Play Time', 'from-fuchsia-400 to-purple-700'],
]
const POSES = [['', '🧍', 'Idle'], ['wave', '👋', 'Wave'], ['dance', '🎵', 'Dance']]
const clampPct = (v) => Math.max(0, Math.min(100, v || 0))

function Vital({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 text-center text-sm">{icon}</span>
      <div className="relative h-3.5 flex-1 overflow-hidden rounded-full border-2 border-slate-900/70 bg-slate-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clampPct(value)}%` }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
      </div>
      <span className="w-14 text-right text-[11px] font-extrabold text-slate-700">{Math.round(clampPct(value))}/100</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function ProfilePanel({ state, onClose }) {
  const [pose, setPose] = useState('')
  const m = Math.floor(state.stats.play / 60)
  const xp = xpInfo(state.xp || 0)
  const values = [
    `₱${Math.round(state.money).toLocaleString()}`,
    state.stats.jobs,
    state.stats.activities || 0,
    state.stats.fished || 0,
    `${Math.floor(m / 60)}h ${m % 60}m`,
  ]
  const fallback = (
    <div className="absolute inset-x-0 bottom-3 flex justify-center"><div className="origin-bottom scale-75"><Avatar look={state.player.look} /></div></div>
  )
  return (
    <Panel title="👤 Profile" onClose={onClose} wide>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* ---- character stage ---- */}
        <div className="shrink-0 sm:w-52">
          <div className="relative h-52 overflow-hidden rounded-2xl border-4 border-yellow-400 bg-gradient-to-b from-indigo-600 via-fuchsia-500 to-orange-300 shadow-lg sm:h-60">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" style={{ clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)' }} />
            <span className="pointer-events-none absolute left-3 top-8 text-sm opacity-80">✨</span>
            <span className="pointer-events-none absolute right-4 top-16 text-xs opacity-80">✦</span>
            <span className="pointer-events-none absolute left-6 top-28 text-xs opacity-70">✦</span>
            <div className="pointer-events-none absolute bottom-2 left-1/2 h-5 w-28 -translate-x-1/2 rounded-full bg-black/35 blur-sm" />
            <StageBoundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <ProfileCharacter look={state.player.look} pose={pose} />
              </Suspense>
            </StageBoundary>
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-blue-700 px-2 py-px text-xs font-extrabold text-white shadow">Lv. {xp.level}</span>
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            {POSES.map(([k, icon, label]) => (
              <button key={label} type="button" onClick={() => setPose(k)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${pose === k ? 'bg-blue-600 text-white' : 'bg-white text-blue-800'}`}>{icon} {label}</button>
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] font-bold text-slate-500">I-drag para paikutin</p>
        </div>

        {/* ---- details ---- */}
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="flex items-center gap-1.5 truncate text-2xl font-extrabold leading-tight text-slate-900"><span>👑</span>{state.player.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative h-3.5 flex-1 overflow-hidden rounded-full border-2 border-slate-900/70 bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-b from-lime-300 to-green-600" style={{ width: `${clampPct((xp.into / xp.need) * 100)}%` }} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-700">{Math.round(xp.into)} / {Math.round(xp.need)} XP</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {STAT_CARDS.map(([icon, label, color], i) => (
              <div key={label} className={`flex items-center gap-2 rounded-xl border-2 border-white/80 bg-gradient-to-b px-2 py-1.5 text-white shadow ${color} ${i === STAT_CARDS.length - 1 ? 'col-span-2' : ''}`}>
                <span className="text-2xl leading-none">{icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-extrabold leading-tight">{values[i]}</span>
                  <span className="block text-[10px] font-bold leading-tight text-white/85">{label}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1 rounded-xl bg-white p-2">
            <Vital icon="❤️" label="Health" value={state.health} color="bg-gradient-to-b from-red-400 to-red-600" />
            <Vital icon="⚡" label="Energy" value={state.energy} color="bg-gradient-to-b from-yellow-300 to-yellow-500" />
            <Vital icon="🍽️" label="Hunger" value={state.hunger} color="bg-gradient-to-b from-orange-400 to-orange-600" />
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function PausePanel({ onResume, onMissions, onProfile, onSettings, onMenu, onClose }) {
  return (
    <Panel title="⏸ Paused" onClose={onClose}>
      <div className="space-y-2">
        <button className="btn-green w-full" onClick={onResume}>▶ Resume</button>
        <button className="btn-blue w-full" onClick={onMissions}>🏆 Missions</button>
        <button className="btn-blue w-full" onClick={onProfile}>👤 Profile</button>
        <button className="btn-blue w-full" onClick={onSettings}>⚙️ Settings</button>
        <button className="btn-red w-full" onClick={onMenu}>🏠 Main Menu</button>
      </div>
    </Panel>
  )
}

export function SettingsPanel({ settings, setSettings, user, onLogout, onReset, onClose }) {
  const [tab, setTab] = useState('Game')
  return (
    <Panel title="⚙️ Settings" onClose={onClose}>
      <div className="mb-3 flex gap-1">
        {['Game', 'Controls', 'Account'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-lg py-1 font-bold ${tab === t ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-800'}`}>{t}</button>
        ))}
      </div>
      {tab === 'Game' && (
        <div className="space-y-3">
          <button className="flex w-full justify-between rounded-xl bg-white px-3 py-2 font-bold" onClick={() => setSettings({ ...settings, touch: !settings.touch })}>
            Touch controls <span>{settings.touch ? 'ON' : 'OFF'}</span>
          </button>
          <div className="grid grid-cols-3 gap-2">
            {[['Relaxed', 0.5], ['Normal', 1], ['Hard', 1.5]].map(([l, v]) => (
              <button key={l} onClick={() => setSettings({ ...settings, speed: v })} className={`rounded-lg py-1 font-bold ${settings.speed === v ? 'bg-blue-600 text-white' : 'bg-white'}`}>{l}</button>
            ))}
          </div>
          <button className="flex w-full justify-between rounded-xl bg-white px-3 py-2 font-bold" onClick={toggleFs}>Fullscreen <span>⛶</span></button>
          <p className="text-xs text-slate-500">Hunger/energy speed. Progress auto-saves.</p>
        </div>
      )}
      {tab === 'Controls' && <p className="rounded-xl bg-white p-3 text-sm font-bold">WASD / arrows: move<br />Space: jump (tap / timing sa mini-games)<br />E: interact<br />Drag: rotate camera<br />Scroll / pinch: zoom<br />I: inventory<br />Esc: close panel<br />Touch: joystick + E button</p>}
      {tab === 'Account' && (
        <div className="space-y-2">
          <p className="font-bold">Signed in as {user}</p>
          <button className="btn-blue w-full" onClick={onLogout}>Log out</button>
          <button className="btn-red w-full" onClick={onReset}>Reset progress</button>
        </div>
      )}
    </Panel>
  )
}