import { useEffect, useReducer, useRef, useState } from 'react'
import AuthScreen from './components/AuthScreen'
import MainMenu from './components/MainMenu'
import CharacterCreation from './components/CharacterCreation'
import GameCanvas from './components/GameCanvas'
import Hud from './components/Hud'
import Joystick from './components/Joystick'
import InventoryPanel from './components/InventoryPanel'
import ShopPanel from './components/ShopPanel'
import FishingPanel from './components/FishingPanel'
import LearningPanel from './components/LearningPanel'
import ConfirmModal from './components/ConfirmModal'
import RotatePrompt from './components/RotatePrompt'
import { autoLandscape } from './utils/landscape'
import { api } from './utils/api'
import JobPanel from './components/JobPanel'
import HouseRoom from './components/HouseRoom'
import { DialogPanel, MissionsPanel, ProfilePanel, PausePanel, SettingsPanel } from './components/MiscPanels'
import { MapPanel } from './components/MapPanel'
import { reducer, initialState } from './store/gameReducer'
import { ITEMS, JOBS, JOB_BY_PLACE } from './data/gameData'
import { read, write, SETTINGS, saveKey } from './store/storage'

// Portrait phone: the main menu is turned 90° with CSS so it always looks landscape (no "rotate your phone" screen).
// Once the phone really is in landscape (or fullscreen + lock succeeds on Android) the rotation switches itself off.
const PORTRAIT_PHONE = '(orientation: portrait) and (pointer: coarse) and (max-width: 820px)'
function usePortraitPhone() {
  const read = () => {
    const vv = window.visualViewport
    return { on: window.matchMedia(PORTRAIT_PHONE).matches, w: Math.round(vv?.width || window.innerWidth), h: Math.round(vv?.height || window.innerHeight) }
  }
  const [v, setV] = useState(read)
  useEffect(() => {
    const f = () => setV(read())
    window.addEventListener('resize', f)
    window.visualViewport?.addEventListener('resize', f)
    return () => { window.removeEventListener('resize', f); window.visualViewport?.removeEventListener('resize', f) }
  }, [])
  return v
}

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
  const [confirm, setConfirm] = useState(null)
  const [doing, setDoing] = useState(null) // { act, placeId, dur } habang ginagawa ang activity
  const [prog, setProg] = useState(0)
  const timer = useRef()
  const pp = usePortraitPhone()
  const bridge = useRef({ vec: { x: 0, y: 0 }, paused: false }).current
  const saved = user ? read(saveKey(user)) : null

  const notify = (m) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 1800) }
  const close = () => setPanel(null)

  const onInteract = (t) => {
    if (t.type === 'npc') return setPanel({ type: 'dialog', npc: t })
    if (t.id === 'house') return setPanel({ type: 'house' })
    if (t.id === 'terminal') return setPanel({ type: 'jobs' })
    if (t.id === 'fishpond') return setPanel({ type: 'fishing' })
    setPanel({ type: 'shop', id: t.id })
  }

  useEffect(() => { bridge.paused = !!panel }, [panel])
  // auto-pause kapag lumipat ng tab / app (mobile)
  useEffect(() => {
    const h = () => { if (document.hidden && screen === 'game') setPanel((p) => p || { type: 'pause' }) }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [screen])
  useEffect(() => { bridge.act = doing ? doing.act.id : panel?.type === 'fishing' ? 'fish' : null }, [doing, panel])
  useEffect(() => {
    if (!doing) { setProg(0); return }
    const t0 = Date.now()
    const id = setInterval(() => {
      const k = (Date.now() - t0) / doing.dur
      if (k < 1) return setProg(k)
      clearInterval(id)
      dispatch({ type: 'ACTIVITY', act: doing.act })
      const a = doing.act
      const got = [
        a.money ? `+₱${a.money}` : '',
        a.give ? Object.entries(a.give).map(([id, q]) => `${ITEMS[id]?.emoji || '🎁'}×${q}`).join(' ') : '',
      ].filter(Boolean).join(' ')
      notify(`${a.emoji} ${a.name} done!${got ? ' ' + got : a.id === 'raffle' ? ' Sayang, walang laman!' : ''}`)
      setDoing(null)
    }, 100)
    return () => clearInterval(id)
  }, [doing])
  useEffect(() => { bridge.onNearby = setNearby; bridge.onInteract = onInteract })
  useEffect(() => { write(SETTINGS, settings) }, [settings])
  // phone: the very first tap anywhere (menu included) goes fullscreen + landscape.
  // Browsers only allow this after a tap, so it can't happen before the user touches the screen.
  useEffect(() => {
    if (!window.matchMedia?.('(pointer: coarse)').matches) return
    const go = () => {
      window.removeEventListener('pointerup', go)
      window.removeEventListener('touchend', go)
      autoLandscape()
    }
    window.addEventListener('pointerup', go)
    window.addEventListener('touchend', go)
    return () => { window.removeEventListener('pointerup', go); window.removeEventListener('touchend', go) }
  }, [])
  useEffect(() => { if (screen === 'game' && user && state.player) write(saveKey(user), state) }, [state, screen])
  useEffect(() => {
    if (screen !== 'game') return
    const id = setInterval(() => !bridge.paused && dispatch({ type: 'TICK', rate: settings.speed }), 2000)
    return () => clearInterval(id)
  }, [screen, settings.speed])
  useEffect(() => {
    const h = (e) => {
      // huwag mag-trigger ng shortcut (hal. "I") habang nagta-type sa textarea / input (paste ng module)
      if (e.key !== 'Escape' && /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return
      if (e.key === 'Escape') { setPanel(null); setDoing(null) }
      else if (screen === 'game' && e.key.toLowerCase() === 'i') setPanel((p) => (p?.type === 'inventory' ? null : { type: 'inventory' }))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [screen])

  const here = nearby?.type === 'place' ? JOB_BY_PLACE[nearby.id] : null
  // AuthScreen passes { token, user: { id, username }, hasCharacter } (token is already saved by api.js)
  const login = (res) => {
    const u = res?.user?.username
    if (!u) return
    localStorage.setItem('elph:session', u)
    setUser(u)
    setScreen('menu')
  }
  const logout = () => {
    api.logout() // invalidates the token on the server and clears it locally
    localStorage.removeItem('elph:session')
    setUser(null)
    setPanel(null)
    setScreen('menu')
  }

  const play = () => {
    autoLandscape() // phone: fullscreen + landscape
    if (saved?.player) { dispatch({ type: 'LOAD', state: saved }); setScreen('game') } else setScreen('create')
  }
  const startCreator = () => {
    if (saved?.player) {
      return setConfirm({
        title: 'New Character?', message: 'Creating a new character resets your progress. Continue?',
        confirmText: 'Yes, create new', onConfirm: () => setScreen('create'),
      })
    }
    setScreen('create')
  }
  const buy = (id) => {
    if (state.money < ITEMS[id].price) return notify('Not enough money!')
    dispatch({ type: 'BUY', id }); notify(`${ITEMS[id].emoji} Bought ${ITEMS[id].name}`)
  }
  const doActivity = (placeId, act) => {
    if (state.money < (act.cost || 0)) return notify('Not enough money!')
    if (act.energy < 0 && state.energy + act.energy < 0) return notify('Too tired!')
    if (act.hunger < 0 && state.hunger + act.hunger < 0) return notify('Too hungry!')
    close() // isara ang panel para makita ang character na ginagawa talaga ang activity
    setDoing({ act, placeId, dur: (act.secs || 5) * 1000 })
  }
  const cast = () => {
    if (state.energy < 5) { notify('Too tired to fish!'); return false }
    dispatch({ type: 'ACTIVITY', act: { id: 'fish', cost: 0, energy: -5, hunger: -2, minutes: 10 } })
    return true
  }
  const caught = (id) => { dispatch({ type: 'CATCH', id }); notify(`${ITEMS[id].emoji} Nahuli: ${ITEMS[id].name}!`) }
  const sellFish = () => {
    const total = Object.entries(state.inventory).reduce((t, [id, q]) => t + (ITEMS[id]?.loot ? ITEMS[id].price * q : 0), 0)
    if (!total) return notify('Walang maibebenta!')
    dispatch({ type: 'SELL_FISH' }); notify(`🪙 Sold for ₱${total}`)
  }
  const use = (id) => { dispatch({ type: 'USE', id }); notify(`${ITEMS[id].emoji} Used ${ITEMS[id].name}`) }
  const sleep = () => { dispatch({ type: 'SLEEP' }); close(); notify(`😴 Good morning! Day ${state.day + 1}`) }
  const travel = (id) => { setDoing(null); bridge.teleport?.(id); close() }

  if (!user) return <AuthScreen onAuthed={login} />

  const btn = [['🎒', 'Inventory', 'inventory'], ['💼', 'Jobs', 'jobs'], ['📍', 'Map', 'map'], ['☰', 'Menu', 'pause']]
  return (
    <div className="relative h-full w-full overflow-hidden"
      style={pp.on && screen === 'menu' ? { position: 'fixed', top: 0, left: 0, width: pp.h, height: pp.w, transform: `translateX(${pp.w}px) rotate(90deg)`, transformOrigin: '0 0' } : undefined}
      onContextMenu={(e) => screen === 'game' && e.preventDefault()}>
      {screen === 'menu' && (
        <MainMenu user={user} look={saved?.player?.look || DEFAULT_LOOK} onPlay={play} onCreate={startCreator}
          onSettings={() => setPanel({ type: 'settings' })} onExit={logout} />
      )}
      {screen === 'create' && (
        <CharacterCreation defaultName={user} onBack={() => setScreen('menu')}
          onCreate={(player) => { autoLandscape(); dispatch({ type: 'NEW', player }); setScreen('game') }} />
      )}
      {screen === 'game' && state.player && (
        <>
          <GameCanvas bridge={bridge} look={state.player.look} minutes={state.minutes} day={state.day} />
          <Hud state={state} />
          {/* menu buttons (safe-area aware) */}
          <div className="absolute z-10 flex gap-1.5 sm:gap-2" style={{ bottom: 'max(0.5rem, env(safe-area-inset-bottom))', right: 'max(0.5rem, env(safe-area-inset-right))' }}>
            {btn.map(([icon, label, type]) => (
              <button key={type} onClick={() => setPanel({ type })} className="flex flex-col items-center" aria-label={label} tabIndex={-1} onMouseDown={(e) => e.preventDefault()}>
                <span className="grid h-11 w-11 place-items-center rounded-xl border-b-4 border-blue-900 bg-blue-500 text-xl shadow-lg active:translate-y-0.5 sm:h-12 sm:w-12 sm:text-2xl">{icon}</span>
                <span className="text-[10px] font-extrabold text-white drop-shadow">{label}{type === 'inventory' && !settings.touch ? ' [I]' : ''}</span>
              </button>
            ))}
          </div>
          {/* action buttons: malaki sa touch, maliit sa PC (may keyboard) */}
          <div className="absolute z-10 flex items-end gap-2" style={{ bottom: 'calc(max(0.5rem, env(safe-area-inset-bottom)) + 4.4rem)', right: 'max(0.75rem, env(safe-area-inset-right))' }}>
            <button aria-label="Jump" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); bridge.jump = true }}
              className={`${settings.touch ? 'h-14 w-14 text-xl' : 'h-11 w-11 text-base'} rounded-full border-b-4 border-blue-900 bg-blue-500 font-extrabold text-white shadow-xl active:translate-y-0.5`}>⤒</button>
            <button aria-label="Interact" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => bridge.doInteract?.()}
              className={`${settings.touch ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-lg'} rounded-full border-b-4 border-orange-700 bg-orange-500 font-extrabold text-white shadow-xl active:translate-y-0.5 ${nearby ? '' : 'opacity-50'}`}>E</button>
          </div>
          {nearby && !doing && (
            <div className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-4 py-1 text-sm font-bold text-white" style={{ bottom: 'calc(max(0.5rem, env(safe-area-inset-bottom)) + 4.4rem)' }}>
              {!settings.touch && <kbd className="mr-2 rounded bg-white px-1.5 text-xs font-extrabold text-slate-900">E</kbd>}{nearby.label}
            </div>
          )}
          {settings.touch && (
            <div className="absolute z-10" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))', left: 'max(1rem, env(safe-area-inset-left))' }}>
              <Joystick vec={bridge.vec} />
            </div>
          )}
          {!settings.touch && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-full bg-slate-900/70 px-3 py-1 text-xs font-bold text-white sm:block" style={{ animation: 'elph-hint 16s forwards' }}>
              WASD move · Space jump · E interact · I inventory · drag to rotate · scroll to zoom
            </div>
          )}
        </>
      )}

      {panel?.type === 'inventory' && <InventoryPanel inventory={state.inventory} onUse={use} onDrop={(id) => dispatch({ type: 'DROP', id })} onClose={close} />}
      {panel?.type === 'shop' && <ShopPanel shopId={panel.id} money={state.money} energy={state.energy} hunger={state.hunger} onBuy={buy} onActivity={doActivity} onLearn={() => setPanel({ type: 'learn' })} onWork={() => setPanel({ type: 'jobs' })} onClose={close} />}
      {panel?.type === 'learn' && <LearningPanel modules={state.modules} learn={state.learn} energy={state.energy} hunger={state.hunger} notify={notify}
        onAdd={(module) => dispatch({ type: 'MODULE_ADD', module })} onDelete={(id) => dispatch({ type: 'MODULE_DEL', id })}
        onFinish={(hash, correct, total) => dispatch({ type: 'MODULE_DONE', hash, correct, total })} onClose={close} />}
      {panel?.type === 'fishing' && <FishingPanel state={state} onCast={cast} onCatch={caught} onSell={sellFish} onPhase={(p) => { bridge.actPhase = p }} onClose={close} />}
      {panel?.type === 'jobs' && <JobPanel here={here} state={state} notify={notify} onClose={close}
        onComplete={(id) => { dispatch({ type: 'WORK', id }); notify(`✅ +₱${JOBS[id].pay} earned`) }} />}
      {panel?.type === 'map' && <MapPanel onGo={travel} onClose={close} getPos={() => bridge.mini} />}
      {panel?.type === 'house' && <HouseRoom state={state} touch={settings.touch} onSleep={sleep} onSave={(furniture) => dispatch({ type: 'FURNITURE', furniture })} onClose={close} />}
      {panel?.type === 'dialog' && <DialogPanel npc={panel.npc} onShop={(id) => setPanel({ type: 'shop', id })} onClose={close} />}
      {panel?.type === 'missions' && <MissionsPanel state={state} onClaim={(id) => dispatch({ type: 'CLAIM', id })} onClose={close} />}
      {panel?.type === 'profile' && <ProfilePanel state={state} onClose={close} />}
      {panel?.type === 'pause' && <PausePanel onResume={close} onClose={close} onMissions={() => setPanel({ type: 'missions' })}
        onProfile={() => setPanel({ type: 'profile' })} onSettings={() => setPanel({ type: 'settings' })} onMenu={() => { close(); setScreen('menu') }} />}
      {panel?.type === 'settings' && <SettingsPanel settings={settings} setSettings={setSettings} user={user} onLogout={logout}
        onReset={() => setConfirm({
          title: 'Reset Progress?', message: 'Delete saved progress? This cannot be undone.',
          confirmText: 'Yes, delete', onConfirm: () => { localStorage.removeItem(saveKey(user)); close(); setScreen('menu') },
        })} onClose={close} />}
      {doing && (
        <div className="absolute inset-x-0 bottom-32 z-30 mx-auto w-[min(92%,22rem)] rounded-2xl border-4 border-blue-700 bg-sky-100/95 p-3 shadow-2xl sm:bottom-6 sm:w-[min(50%,22rem)]" style={{ animation: 'elph-pop 0.25s both' }}>
          <div className="flex items-center gap-3">
            <span className="animate-bounce text-4xl">{doing.act.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold leading-tight text-blue-900">{doing.act.name}...</p>
              <div className="mt-1 h-4 overflow-hidden rounded-full border-2 border-slate-900/60 bg-slate-700">
                <div className="h-full bg-gradient-to-r from-green-400 to-yellow-300" style={{ width: `${Math.round(prog * 100)}%` }} />
              </div>
            </div>
            <button className="btn-red px-3 py-1" onClick={() => setDoing(null)} aria-label="Cancel">✕</button>
          </div>
        </div>
      )}
      {confirm && (
        <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} onConfirm={() => { const go = confirm.onConfirm; setConfirm(null); go() }} />
      )}
      {screen === 'game' && <RotatePrompt />}
      {toast && <div className="absolute left-1/2 top-24 z-50 -translate-x-1/2 rounded-full bg-yellow-300 px-4 py-2 font-extrabold text-slate-900 shadow-lg">{toast}</div>}
    </div>
  )
}