import { useEffect, useReducer, useRef, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import MainMenu from './components/MainMenu'
import CharacterCreation from './components/CharacterCreation'
import GameCanvas from './components/GameCanvas'
import Hud from './components/Hud'
import Joystick from './components/Joystick'
import InventoryPanel from './components/InventoryPanel'
import ShopPanel from './components/ShopPanel'
import JobPanel from './components/JobPanel'
import HouseRoom from './components/HouseRoom'
import { MapPanel, DialogPanel, MissionsPanel, ProfilePanel, PausePanel, SettingsPanel } from './components/MiscPanels'
import { reducer, initialState } from './store/gameReducer'
import { ITEMS, JOBS, JOB_BY_PLACE } from './data/gameData'
import { read, write, SETTINGS, saveKey } from './store/storage'

const defaults = { touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0, speed: 1 }
const DEFAULT_LOOK = { skin: '#f1c27d', hair: '#3b2417', hairStyle: 0, shirt: '#f8fafc', gender: 'male' }

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('elph:session'))
  const [screen, setScreen] = useState('menu')
  const [state, dispatch] = useReducer(reducer, initialState)
  const [settings, setSettings] = useState(() => ({ ...defaults, ...read(SETTINGS) }))
  const [panel, setPanel] = useState(null)
  const [nearby, setNearby] = useState(null)
  const [toast, setToast] = useState('')
  const timer = useRef()
  const bridge = useRef({ vec: { x: 0, y: 0 }, paused: false }).current
  const saved = user ? read(saveKey(user)) : null

  const notify = (m) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 1800) }
  const close = () => setPanel(null)

  const onInteract = (t) => {
    if (t.type === 'npc') return setPanel({ type: 'dialog', npc: t })
    if (t.id === 'house') return setPanel({ type: 'house' })
    if (t.id === 'terminal') return setPanel({ type: 'jobs' })
    setPanel({ type: 'shop', id: t.id })
  }

  useEffect(() => { bridge.paused = !!panel }, [panel])
  useEffect(() => { bridge.onNearby = setNearby; bridge.onInteract = onInteract })
  useEffect(() => { write(SETTINGS, settings) }, [settings])
  useEffect(() => { if (screen === 'game' && user && state.player) write(saveKey(user), state) }, [state, screen])
  useEffect(() => {
    if (screen !== 'game') return
    const id = setInterval(() => !bridge.paused && dispatch({ type: 'TICK', rate: settings.speed }), 2000)
    return () => clearInterval(id)
  }, [screen, settings.speed])
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') setPanel(null)
      else if (screen === 'game' && e.key.toLowerCase() === 'i') setPanel((p) => (p?.type === 'inventory' ? null : { type: 'inventory' }))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [screen])

  const here = nearby?.type === 'place' ? JOB_BY_PLACE[nearby.id] : null
  const login = (u) => { localStorage.setItem('elph:session', u); setUser(u); setScreen('menu') }
  const logout = () => { localStorage.removeItem('elph:session'); setUser(null); setPanel(null); setScreen('menu') }

  const play = () => {
    if (saved?.player) { dispatch({ type: 'LOAD', state: saved }); setScreen('game') } else setScreen('create')
  }
  const startCreator = () => {
    if (saved?.player && !window.confirm('Creating a new character resets your progress. Continue?')) return
    setScreen('create')
  }
  const buy = (id) => {
    if (state.money < ITEMS[id].price) return notify('Not enough money!')
    dispatch({ type: 'BUY', id }); notify(`${ITEMS[id].emoji} Bought ${ITEMS[id].name}`)
  }
  const use = (id) => { dispatch({ type: 'USE', id }); notify(`${ITEMS[id].emoji} Used ${ITEMS[id].name}`) }
  const sleep = () => { dispatch({ type: 'SLEEP' }); close(); notify(`😴 Good morning! Day ${state.day + 1}`) }
  const travel = (id) => { bridge.teleport?.(id); close() }

  if (!user) return <AuthScreen onAuth={login} />

  const btn = [['🎒', 'Inventory', 'inventory'], ['💼', 'Jobs', 'jobs'], ['📍', 'Map', 'map'], ['☰', 'Menu', 'pause']]
  return (
    <div className="relative h-full w-full overflow-hidden">
      {screen === 'menu' && (
        <MainMenu user={user} look={saved?.player?.look || DEFAULT_LOOK} onPlay={play} onCreate={startCreator}
          onSettings={() => setPanel({ type: 'settings' })} onExit={logout} />
      )}
      {screen === 'create' && (
        <CharacterCreation defaultName={user} onBack={() => setScreen('menu')}
          onCreate={(player) => { dispatch({ type: 'NEW', player }); setScreen('game') }} />
      )}
      {screen === 'game' && state.player && (
        <>
          <GameCanvas bridge={bridge} look={state.player.look} />
          <Hud state={state} />
          <div className="absolute bottom-3 right-2 z-10 flex gap-2">
            {btn.map(([icon, label, type]) => (
              <button key={type} onClick={() => setPanel({ type })} className="flex flex-col items-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl border-b-4 border-blue-900 bg-blue-500 text-2xl shadow-lg active:translate-y-0.5">{icon}</span>
                <span className="text-[10px] font-extrabold text-white drop-shadow">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => bridge.doInteract?.()}
            className={`absolute bottom-24 right-4 z-10 h-16 w-16 rounded-full border-b-4 border-orange-700 bg-orange-500 text-2xl font-extrabold text-white shadow-xl active:translate-y-0.5 ${nearby ? '' : 'opacity-50'}`}>E</button>
          {nearby && <div className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-1 text-sm font-bold text-white">{nearby.label}</div>}
          {settings.touch && <div className="absolute bottom-4 left-4 z-10"><Joystick vec={bridge.vec} /></div>}
        </>
      )}

      {panel?.type === 'inventory' && <InventoryPanel inventory={state.inventory} onUse={use} onDrop={(id) => dispatch({ type: 'DROP', id })} onClose={close} />}
      {panel?.type === 'shop' && <ShopPanel shopId={panel.id} money={state.money} onBuy={buy} onWork={() => setPanel({ type: 'jobs' })} onClose={close} />}
      {panel?.type === 'jobs' && <JobPanel here={here} state={state} notify={notify} onClose={close}
        onComplete={(id) => { dispatch({ type: 'WORK', id }); notify(`✅ +₱${JOBS[id].pay} earned`) }} />}
      {panel?.type === 'map' && <MapPanel onGo={travel} onClose={close} />}
      {panel?.type === 'house' && <HouseRoom state={state} touch={settings.touch} onSleep={sleep} onSave={(furniture) => dispatch({ type: 'FURNITURE', furniture })} onClose={close} />}
      {panel?.type === 'dialog' && <DialogPanel npc={panel.npc} onShop={(id) => setPanel({ type: 'shop', id })} onClose={close} />}
      {panel?.type === 'missions' && <MissionsPanel state={state} onClaim={(id) => dispatch({ type: 'CLAIM', id })} onClose={close} />}
      {panel?.type === 'profile' && <ProfilePanel state={state} onClose={close} />}
      {panel?.type === 'pause' && <PausePanel onResume={close} onClose={close} onMissions={() => setPanel({ type: 'missions' })}
        onProfile={() => setPanel({ type: 'profile' })} onSettings={() => setPanel({ type: 'settings' })} onMenu={() => { close(); setScreen('menu') }} />}
      {panel?.type === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} user={user} onLogout={logout}
        onReset={() => { localStorage.removeItem(saveKey(user)); close(); setScreen('menu') }} onClose={close} />}
      {toast && <div className="absolute left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-yellow-300 px-4 py-2 font-extrabold text-slate-900 shadow-lg">{toast}</div>}
    </div>
  )
}