import { useState } from 'react'
import Panel from './Panel'
import { MAP_SPOTS, MISSIONS, level } from '../data/gameData'

export function MapPanel({ onGo, onClose }) {
  return (
    <Panel title="🗺️ World Map" onClose={onClose}>
      <p className="mb-2 text-center text-sm font-bold text-blue-900">Tap a place to travel there.</p>
      <div className="grid grid-cols-2 gap-2">
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
  return (
    <Panel title={`💬 ${npc.name}`} onClose={onClose}>
      <p className="mb-3 rounded-xl bg-white p-3 text-lg font-bold">{npc.line}</p>
      <div className="space-y-2">
        {npc.shop && <button className="btn-blue w-full" onClick={() => onShop(npc.shop)}>Yes, Sure!</button>}
        <button className="btn-blue w-full" onClick={onClose}>Not right now</button>
        <button className="btn-blue w-full" onClick={onClose}>Bye!</button>
      </div>
    </Panel>
  )
}

export function MissionsPanel({ state, onClaim, onClose }) {
  return (
    <Panel title="🏆 Missions" onClose={onClose}>
      <ul className="space-y-2">
        {MISSIONS.map((m) => {
          const done = m.done(state), claimed = state.claimed[m.id]
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-xl bg-white p-2">
              <span className="text-3xl">{m.icon}</span>
              <div className="flex-1">
                <p className="font-bold leading-tight">{m.text}</p>
                <p className="text-xs text-slate-500">({done ? 1 : 0} / 1)</p>
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

export function ProfilePanel({ state, onClose }) {
  const m = Math.floor(state.stats.play / 60)
  const rows = [['Total Money', `₱${Math.round(state.money).toLocaleString()}`], ['Jobs Done', state.stats.jobs], ['Play Time', `${Math.floor(m / 60)}h ${m % 60}m`]]
  return (
    <Panel title="👤 Profile" onClose={onClose}>
      <p className="text-2xl font-extrabold">{state.player.name} <span className="text-base text-blue-700">Lv.{level(state)}</span></p>
      <ul className="mt-2 space-y-1">
        {rows.map(([k, v]) => <li key={k} className="flex justify-between rounded-lg bg-white px-3 py-1 font-bold"><span>{k}</span><span>{v}</span></li>)}
      </ul>
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
          <p className="text-xs text-slate-500">Hunger/energy speed. Progress auto-saves.</p>
        </div>
      )}
      {tab === 'Controls' && <p className="rounded-xl bg-white p-3 text-sm font-bold">WASD / arrows: move<br />E: interact<br />I: inventory<br />Esc: close panel<br />Touch: joystick + E button</p>}
      {tab === 'Account' && (
        <div className="space-y-2">
          <p className="font-bold">Signed in as {user}</p>
          <button className="btn-blue w-full" onClick={onLogout}>Log out</button>
          <button className="btn-red w-full" onClick={() => window.confirm('Delete saved progress?') && onReset()}>Reset progress</button>
        </div>
      )}
    </Panel>
  )
}
