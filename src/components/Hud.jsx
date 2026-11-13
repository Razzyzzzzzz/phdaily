import { useEffect, useRef, useState } from 'react'
import HudPortrait from './HudPortrait'
import ChatPanel from './ChatPanel'
import OnlinePlayers from './OnlinePlayers'
import Minimap, { questTarget } from './Minimap'
import QuestTracker from './QuestTracker'
import EventBanner from './EventBanner'
import { useMp } from '../store/mpStore'
import { multiplayer } from '../game/multiplayer'
import { fmtTime, weather, xpInfo, MISSIONS } from '../data/gameData'
import { MAIN_QUESTS, DAILY_BY_ID, dailyProgress, eventState } from '../data/progression'
import { PLACES } from '../game/world'

// Short screens (phone in landscape, <= 560px high) get the COMPACT layout:
// smaller cards, no event banner, 4 top-right buttons, chat collapsed to an icon, nothing overlapping.
function useTall() {
  const get = () => (typeof window === 'undefined' ? true : window.innerHeight > 560)
  const [t, setT] = useState(get)
  useEffect(() => { const f = () => setT(get()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return t
}

const clamp = (v) => Math.max(0, Math.min(100, v))
const safe = (side) => `max(0.5rem, env(safe-area-inset-${side}))`
const shadow = { textShadow: '0 1px 3px #000, 0 0 3px #000' }

function Bar({ icon, value, color, compact }) {
  const v = clamp(value)
  const low = v <= 25
  return (
    <div className="flex items-center gap-1">
      <span className="w-4 text-center text-[11px] leading-none">{icon}</span>
      <div className={`relative flex-1 overflow-hidden rounded-full border-2 border-slate-950/80 bg-slate-800 ${compact ? 'h-3' : 'h-3.5'} ${low ? 'animate-pulse' : ''}`}>
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${v}%` }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
      </div>
    </div>
  )
}

// coin / gem pill. `onAdd` shows the round "+" button (only when a handler is passed)
function Pill({ icon, value, color, onAdd, compact }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/15 bg-slate-900/80 py-0.5 pl-1 pr-1 shadow-lg backdrop-blur">
      <span className={`grid place-items-center rounded-full ${compact ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-sm'} ${color}`}>{icon}</span>
      <span className={`text-right font-extrabold text-white ${compact ? 'min-w-[2.4rem] text-xs' : 'min-w-[3.2rem] text-sm sm:text-base'}`}>{Math.round(value).toLocaleString()}</span>
      {onAdd
        ? <button type="button" onClick={onAdd} aria-label="Add" className={`grid place-items-center rounded-full bg-green-500 font-extrabold leading-none text-white ${compact ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-xs'}`}>+</button>
        : <span className="w-1" />}
    </div>
  )
}

// square icon button (Quest / Event / Jobs / Menu ...) with an optional red dot
const ICON = {
  xs: ['w-11', 'h-9 w-9 text-lg', 'text-[9px]'],
  sm: ['w-12', 'h-10 w-10 text-xl', 'text-[10px]'],
  md: ['w-14', 'h-11 w-11 text-2xl', 'text-[10px]'],
}
function IconBtn({ icon, label, onClick, dot, size = 'md' }) {
  const [w, box, txt] = ICON[size]
  return (
    <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`relative flex flex-col items-center active:scale-95 ${w}`}>
      <span className={`grid place-items-center rounded-2xl border-2 border-white/70 bg-gradient-to-b from-sky-400 to-blue-700 shadow-lg ${box}`}>{icon}</span>
      <span className={`mt-0.5 font-extrabold leading-none text-white ${txt}`} style={shadow}>{label}</span>
      {dot && <span className="absolute right-0.5 top-0 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-red-500" />}
    </button>
  )
}

// round button of the bottom row (Emote / Action / Inventory / Map)
function RoundBtn({ icon, label, onClick, compact }) {
  return (
    <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="flex flex-col items-center active:scale-95">
      <span className={`grid place-items-center rounded-full border-2 border-sky-200/70 bg-gradient-to-b from-slate-600 to-slate-900 shadow-lg ring-2 ring-slate-950/60 ${compact ? 'h-10 w-10 text-xl' : 'h-12 w-12 text-2xl sm:h-14 sm:w-14 sm:text-3xl'}`}>{icon}</span>
      <span className={`-mt-2 rounded-full bg-slate-900/90 px-2 py-px font-extrabold text-white ${compact ? 'text-[9px] leading-3' : 'text-[10px] leading-4 sm:text-[11px]'}`}>{label}</span>
    </button>
  )
}

// coloured quick-action button (Dance / Sit / Wave)
function QuickBtn({ icon, label, color, onClick, compact }) {
  return (
    <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`flex flex-col items-center active:scale-95 ${compact ? 'w-10' : 'w-12 sm:w-14'}`}>
      <span className={`grid place-items-center rounded-2xl border-2 border-white/70 bg-gradient-to-b shadow-lg ${compact ? 'h-9 w-9 text-lg' : 'h-11 w-11 text-2xl sm:h-12 sm:w-12'} ${color}`}>{icon}</span>
      <span className={`mt-0.5 font-extrabold leading-none text-white ${compact ? 'text-[9px]' : 'text-[10px]'}`} style={shadow}>{label}</span>
    </button>
  )
}

const STATUS = {
  connecting: ['🟡', 'Connecting…'],
  reconnecting: ['🟠', 'Reconnecting…'],
  replaced: ['🔴', 'Signed in elsewhere'],
  error: ['🔴', 'Offline'],
}

function OnlineChip({ onRetry, compact }) {
  const status = useMp((s) => s.status)
  const count = useMp((s) => s.onlineCount)
  const error = useMp((s) => s.error)
  const [open, setOpen] = useState(false)
  if (status === 'offline') return null
  const [dot, text] = STATUS[status] || ['🟢', null]
  const online = status === 'online'
  const failed = status === 'error' || status === 'replaced'
  // show the real reason (e.g. "Create your character first.") instead of a bare "Offline"
  const label = online ? `${count} online` : `${error || text}${failed ? ' ↻' : ''}`
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { if (online) setOpen((o) => !o); else if (failed) onRetry?.() }}
        className={`truncate rounded-full border border-white/10 bg-slate-900/75 font-extrabold text-white shadow ${compact ? 'max-w-[7.5rem] px-2 py-0.5 text-[10px]' : 'max-w-[11rem] px-3 py-0.5 text-xs sm:py-1 sm:text-sm'}`}
      >
        {dot} {label}
      </button>
      {open && online && <OnlinePlayers onClose={() => setOpen(false)} />}
    </div>
  )
}

// name of the area for the label above the minimap
const areaName = (m) => {
  if (!m) return 'Town Proper'
  let best = null, bd = 380
  for (const p of PLACES) {
    const d = Math.hypot(m.x - (p.x + p.w / 2), m.z - (p.base - 100))
    if (d < bd) { bd = d; best = p.label }
  }
  return best || 'Town Proper'
}

// Red dot on the Quest button: something is ready to claim
const questDot = (s) => {
  const q = MAIN_QUESTS[s.mq || 0]
  if (q?.done(s)) return true
  if (MISSIONS.some((m) => !s.claimed[m.id] && m.done(s))) return true
  if (s.login?.last && s.login.claimed !== s.login.last) return true
  const d = s.daily
  if (d) {
    if (d.ids.some((id) => !d.claimed[id] && dailyProgress(s, id)[0] >= DAILY_BY_ID[id].goal)) return true
    if (!d.bonus && d.ids.every((id) => d.claimed[id])) return true
  }
  return false
}

/**
 * Props
 *  state    game state (from the reducer)
 *  bridge   the object shared with Scene3D (needed for the minimap / nearby chat)
 *  actions  OPTIONAL handlers. A button is drawn only when its handler is passed:
 *           quests, events, shop, bag, jobs, menu, minigames, farming, pet, house,
 *           emote, action, inventory, map, dance, sit, wave,
 *           addCoins, addGems, mainClaim, travel(placeId), openMap (tap on the minimap)
 */
export default function Hud({ state, bridge, actions = {} }) {
  const { player, money, energy, hunger, health, day, minutes } = state
  const gems = state.gems || 0
  const [wIcon, wLabel] = weather(day)
  const xp = xpInfo(state.xp || 0)
  const q = MAIN_QUESTS[state.mq || 0]

  // ---- "Level up!" toast (not shown for the level you load with) ----
  const [toast, setToast] = useState(null)
  const seen = useRef(state.levelUp?.n || 0)
  useEffect(() => {
    const n = state.levelUp?.n || 0
    if (n > seen.current) { setToast(state.levelUp.level); const t = setTimeout(() => setToast(null), 3500); seen.current = n; return () => clearTimeout(t) }
    seen.current = n
  }, [state.levelUp])

  // live event dot
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 5000); return () => clearInterval(t) }, [])
  const ev = eventState()
  const eventDot = ev.live && !state.events?.[ev.slot]

  const A = actions
  const tall = useTall()
  const compact = !tall
  const bsz = compact ? 'xs' : 'md'
  const side = [['minigames', '🎮', 'Mini Games'], ['farming', '🌱', 'Farming'], ['pet', '🐶', 'Pet'], ['house', '🏠', 'House']].filter(([k]) => A[k])
  const quick = [['dance', '🎵', 'Dance', 'from-purple-500 to-purple-800'], ['sit', '🪑', 'Sit', 'from-sky-400 to-blue-700'], ['wave', '👋', 'Wave', 'from-lime-400 to-green-700']].filter(([k]) => A[k])
  const bottom = [['emote', '😀', 'Emote'], ['action', '🏃', 'Action'], ['inventory', '🎒', 'Inventory'], ['map', '🗺️', 'Map']].filter(([k]) => A[k])
  const bottomPad = 'max(0.5rem, env(safe-area-inset-bottom))'

  return (
    <>
      {/* ===== top-left: profile + main quest ===== */}
      <div className="absolute z-10 flex flex-col gap-1" style={{ top: safe('top'), left: safe('left') }}>
        <div className={`flex items-center rounded-2xl border border-white/10 bg-slate-900/75 shadow-lg backdrop-blur ${compact ? 'w-44 gap-1.5 p-1' : 'w-52 gap-2 p-1.5 sm:w-64 sm:p-2'}`}>
          <div className={`relative shrink-0 ${compact ? 'h-10 w-10' : 'h-14 w-14 sm:h-16 sm:w-16'}`}>
            <div className={`absolute inset-0 rounded-full border-yellow-400 shadow-md ${compact ? 'border-2' : 'border-4'}`}>
              <HudPortrait look={player.look} />
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className={`flex items-center gap-1 truncate font-extrabold leading-tight text-white ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}><span>👑</span>{player.name}</p>
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-extrabold leading-4 text-white">Lv. {xp.level}</span>
              <div className={`relative flex-1 overflow-hidden rounded-full border-2 border-slate-950/80 bg-slate-800 ${compact ? 'h-3' : 'h-3.5'}`}>
                <div className="h-full rounded-full bg-gradient-to-b from-lime-300 to-green-600 transition-all duration-500" style={{ width: `${(xp.into / xp.need) * 100}%` }} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/25" />
              </div>
            </div>
            <Bar compact={compact} icon="❤️" value={health} color="bg-gradient-to-b from-red-400 to-red-600" />
            <div className="grid grid-cols-2 gap-1">
              <Bar compact={compact} icon="⚡" value={energy} color="bg-gradient-to-b from-yellow-300 to-yellow-500" />
              <Bar compact={compact} icon="🍽️" value={hunger} color="bg-gradient-to-b from-orange-400 to-orange-600" />
            </div>
          </div>
        </div>
        <QuestTracker state={state} onClaim={A.mainClaim} onTravel={A.travel} defaultOpen={tall} compact={compact} />
      </div>

      {/* ===== top-center: coins + gems, clock, event banner (banner only on big screens) ===== */}
      <div className="absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1" style={{ top: safe('top') }}>
        <div className="flex gap-1">
          <Pill compact={compact} icon="🪙" value={money} color="bg-yellow-400" onAdd={A.addCoins} />
          <Pill compact={compact} icon="💎" value={gems} color="bg-sky-400" onAdd={A.addGems} />
        </div>
        <div className={`whitespace-nowrap rounded-full border border-white/10 bg-slate-900/75 text-center font-bold leading-tight text-white shadow ${compact ? 'px-2 py-px text-[10px]' : 'px-3 py-0.5 text-xs'}`}>{fmtTime(day, minutes)} · {wIcon} {wLabel}</div>
        {tall && <EventBanner state={state} onOpen={() => (A.events || A.quests)?.('event')} />}
      </div>

      {/* ===== top-right: buttons, minimap, online ===== */}
      <div className="absolute z-10 flex flex-col items-end gap-1" style={{ top: safe('top'), right: safe('right') }}>
        <div className="flex gap-0.5">
          {A.quests && <IconBtn size={bsz} icon="📜" label="Quest" dot={questDot(state)} onClick={() => A.quests('daily')} />}
          {A.events && <IconBtn size={bsz} icon="🎁" label="Event" dot={eventDot} onClick={() => A.events('event')} />}
          {A.shop && <IconBtn size={bsz} icon="🏪" label="Shop" onClick={A.shop} />}
          {tall && A.bag && <IconBtn size={bsz} icon="🎒" label="Bag" onClick={A.bag} />}
          {A.jobs && <IconBtn size={bsz} icon="💼" label="Jobs" onClick={A.jobs} />}
          {A.menu && <IconBtn size={bsz} icon="☰" label="Menu" onClick={A.menu} />}
        </div>
        {tall && <span className="rounded-full border border-white/20 bg-blue-700/90 px-3 py-0.5 text-[11px] font-extrabold text-white shadow">{areaName(bridge?.mini)}</span>}
        <Minimap bridge={bridge} target={questTarget(q?.where)} onOpenMap={A.openMap} size={tall ? 120 : 80} />
        <div className={compact ? 'mt-0.5' : 'mt-1'}><OnlineChip compact={compact} onRetry={() => multiplayer.connect(bridge)} /></div>
      </div>

      {/* ===== right edge: activity shortcuts (Mini Games / Farming / Pet / House) ===== */}
      {side.length > 0 && (
        <div className="absolute z-10 grid grid-cols-2 gap-x-1 gap-y-2" style={{ right: safe('right'), bottom: '11.5rem' }}>
          {side.map(([k, icon, label]) => <IconBtn key={k} size="sm" icon={icon} label={label} onClick={A[k]} />)}
        </div>
      )}

      {/* ===== bottom row: Emote / Action / Inventory / Map ===== */}
      {bottom.length > 0 && (
        <div className={`absolute left-1/2 z-10 flex -translate-x-1/2 ${compact ? 'gap-1' : 'gap-1.5'}`} style={{ bottom: bottomPad }}>
          {bottom.map(([k, icon, label]) => <RoundBtn key={k} compact={compact} icon={icon} label={label} onClick={A[k]} />)}
        </div>
      )}

      {/* ===== Dance / Sit / Wave: left of the jump button on small screens, above it on big ones ===== */}
      {quick.length > 0 && (
        <div
          className="absolute z-10 flex gap-1"
          style={compact
            ? { right: 'calc(max(0.5rem, env(safe-area-inset-right)) + 4.2rem)', bottom: bottomPad }
            : { right: safe('right'), bottom: 'calc(max(0.5rem, env(safe-area-inset-bottom)) + 5.8rem)' }}
        >
          {quick.map(([k, icon, label, color]) => <QuickBtn key={k} compact={compact} icon={icon} label={label} color={color} onClick={A[k]} />)}
        </div>
      )}

      {/* ===== level-up toast ===== */}
      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-30 -translate-x-1/2 text-center" style={{ animation: 'elph-pop 0.3s both' }}>
          <div className="rounded-3xl border-4 border-yellow-300 bg-gradient-to-b from-orange-400 to-red-600 px-6 py-3 shadow-2xl">
            <p className="text-sm font-extrabold text-yellow-100">LEVEL UP!</p>
            <p className="text-4xl font-extrabold text-white">Lv. {toast}</p>
            <p className="text-xs font-bold text-yellow-100">+₱100 · +5 💎</p>
          </div>
        </div>
      )}

      <ChatPanel bridge={bridge} />
    </>
  )
}