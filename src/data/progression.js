// Progression layer: main quest, daily quests, daily login, achievements, town events, collectibles.
// Everything here is DATA + pure helpers. Progress is measured from the counters the game already keeps
// (state.stats.*), so existing activities, fishing, shopping and jobs count automatically.
//
// reward = { money, xp, gems }
import { level } from './gameData'

const acts = (s, id) => (s.stats.acts || {})[id] || 0
const count = (o) => Object.keys(o || {}).length

// ---------- helpers ----------
export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const prevDayKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return todayKey(new Date(y, m - 1, d - 1))
}

const hash = (n) => {
  let h = (Math.imul(Math.floor(n) ^ 0x9e3779b9, 2654435761) >>> 0)
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0
  return (h ^ (h >>> 13)) >>> 0
}
const hashStr = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0; return h }
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

export const rewardText = (r = {}) => [r.money && `🪙 ₱${r.money}`, r.gems && `💎 ${r.gems}`, r.xp && `⭐ ${r.xp} XP`].filter(Boolean).join('  ')

// ---------- MAIN QUEST (shown in the HUD quest tracker) ----------
// `where` = place id in LOCATIONS (minimap marker + Travel). `done(s)` / `prog(s)` read the saved state.
export const MAIN_QUESTS = [
  { id: 'explore', title: 'Explore the Town', text: 'Talk to the Mayor at the Barangay Hall', where: 'barangay', reward: { money: 200, xp: 40, gems: 2 },
    done: (s) => !!s.visited?.barangay, prog: (s) => [s.visited?.barangay ? 1 : 0, 1] },
  { id: 'job', title: 'Hanapbuhay', text: 'Magtrabaho nang 1 beses sa kahit anong trabaho', where: 'sari', reward: { money: 250, xp: 60, gems: 2 },
    done: (s) => s.stats.jobs >= 1, prog: (s) => [Math.min(1, s.stats.jobs), 1] },
  { id: 'fish', title: 'Mangingisda', text: 'Manghuli ng isda sa Palaisdaan', where: 'fishpond', reward: { money: 250, xp: 60, gems: 2 },
    done: (s) => s.stats.fished >= 1, prog: (s) => [Math.min(1, s.stats.fished), 1] },
  { id: 'cook', title: 'Magluto Tayo', text: 'Magluto ng adobo sa Karinderya', where: 'restaurant', reward: { money: 300, xp: 80, gems: 3 },
    done: (s) => acts(s, 'adobo') >= 1, prog: (s) => [Math.min(1, acts(s, 'adobo')), 1] },
  { id: 'hunt', title: 'Treasure Hunter', text: 'Humanap ng 3 collectibles sa bayan', where: 'park', reward: { money: 400, xp: 100, gems: 5 },
    done: (s) => count(s.collected) >= 3, prog: (s) => [Math.min(3, count(s.collected)), 3] },
  { id: 'lvl5', title: 'Kilalang Kapitbahay', text: 'Abutin ang Level 5', where: 'barangay', reward: { money: 600, xp: 150, gems: 8 },
    done: (s) => level(s) >= 5, prog: (s) => [Math.min(5, level(s)), 5] },
]

// ---------- DAILY QUESTS (3 per day, seeded by the date) ----------
// progress = metric(now) - metric(when the day's quests were generated)
export const DAILY_POOL = [
  { id: 'd_buy', icon: '🧺', text: 'Bumili ng 3 item sa tindahan', goal: 3, metric: (s) => s.stats.bought, reward: { money: 80, xp: 30, gems: 1 } },
  { id: 'd_work', icon: '💼', text: 'Gumawa ng 2 trabaho', goal: 2, metric: (s) => s.stats.jobs, reward: { money: 120, xp: 40, gems: 1 } },
  { id: 'd_fish', icon: '🎣', text: 'Manghuli ng 3 isda', goal: 3, metric: (s) => s.stats.fished, reward: { money: 100, xp: 35, gems: 1 } },
  { id: 'd_act', icon: '⭐', text: 'Gumawa ng 4 na activities', goal: 4, metric: (s) => s.stats.activities || 0, reward: { money: 100, xp: 40, gems: 1 } },
  { id: 'd_sleep', icon: '🛏️', text: 'Matulog sa bahay', goal: 1, metric: (s) => s.stats.slept, reward: { money: 50, xp: 20, gems: 1 } },
  { id: 'd_quiz', icon: '🧠', text: 'Sumagot ng 1 learning quiz', goal: 1, metric: (s) => s.stats.quizzes || 0, reward: { money: 90, xp: 35, gems: 1 } },
  { id: 'd_hoops', icon: '🏀', text: 'Mag-basketball ng 2 beses', goal: 2, metric: (s) => acts(s, 'basketball'), reward: { money: 110, xp: 40, gems: 1 } },
  { id: 'd_tawad', icon: '🗣️', text: 'Tumawad sa Palengke', goal: 1, metric: (s) => acts(s, 'tawad'), reward: { money: 70, xp: 25, gems: 1 } },
  { id: 'd_bake', icon: '🥖', text: 'Mag-bake ng pandesal', goal: 1, metric: (s) => acts(s, 'bake'), reward: { money: 70, xp: 25, gems: 1 } },
  { id: 'd_collect', icon: '💎', text: 'Maghanap ng 1 collectible', goal: 1, metric: (s) => count(s.collected), reward: { money: 100, xp: 40, gems: 2 } },
]
export const DAILY_BY_ID = Object.fromEntries(DAILY_POOL.map((q) => [q.id, q]))
export const DAILY_BONUS = { money: 200, xp: 60, gems: 3 } // all 3 claimed

export const genDaily = (date, s) => {
  const r = rng(hashStr(date))
  const pool = [...DAILY_POOL]
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
  const picked = pool.slice(0, 3)
  return { date, ids: picked.map((q) => q.id), base: Object.fromEntries(picked.map((q) => [q.id, q.metric(s)])), claimed: {}, bonus: false }
}
export const dailyProgress = (s, id) => {
  const q = DAILY_BY_ID[id]
  if (!q || !s.daily) return [0, 1]
  return [Math.max(0, Math.min(q.goal, q.metric(s) - (s.daily.base[id] || 0))), q.goal]
}

// ---------- DAILY LOGIN (7-day cycle, streak resets if you miss a day) ----------
export const LOGIN_REWARDS = [
  { icon: '🪙', reward: { money: 100, xp: 10 } },
  { icon: '🪙', reward: { money: 150, xp: 15, gems: 1 } },
  { icon: '🍛', reward: { money: 200, xp: 20, gems: 1 } },
  { icon: '💎', reward: { money: 250, xp: 25, gems: 3 } },
  { icon: '🪙', reward: { money: 350, xp: 30, gems: 3 } },
  { icon: '🎁', reward: { money: 500, xp: 40, gems: 5 } },
  { icon: '👑', reward: { money: 1000, xp: 100, gems: 15 } },
]

// ---------- ACHIEVEMENTS ----------
export const ACHIEVEMENTS = [
  { id: 'a_lv3', icon: '🎖️', text: 'Abutin ang Level 3', reward: { money: 150, gems: 2 }, done: (s) => level(s) >= 3, prog: (s) => [Math.min(3, level(s)), 3] },
  { id: 'a_lv10', icon: '🏅', text: 'Abutin ang Level 10', reward: { money: 1000, gems: 10 }, done: (s) => level(s) >= 10, prog: (s) => [Math.min(10, level(s)), 10] },
  { id: 'a_rich', icon: '💰', text: 'Magkaroon ng ₱10,000', reward: { money: 500, gems: 5 }, done: (s) => s.money >= 10000, prog: (s) => [Math.min(10000, Math.floor(s.money)), 10000] },
  { id: 'a_fish', icon: '🎣', text: 'Manghuli ng 25 isda', reward: { money: 400, gems: 4 }, done: (s) => s.stats.fished >= 25, prog: (s) => [Math.min(25, s.stats.fished), 25] },
  { id: 'a_chef', icon: '🍛', text: 'Magluto ng adobo ng 3 beses', reward: { money: 300, gems: 3 }, done: (s) => acts(s, 'adobo') >= 3, prog: (s) => [Math.min(3, acts(s, 'adobo')), 3] },
  { id: 'a_busy', icon: '⭐', text: 'Gumawa ng 50 activities', reward: { money: 600, gems: 6 }, done: (s) => (s.stats.activities || 0) >= 50, prog: (s) => [Math.min(50, s.stats.activities || 0), 50] },
  { id: 'a_scholar', icon: '🎓', text: 'Pumasa sa 3 Learning Modules', reward: { money: 400, gems: 4 }, done: (s) => (s.stats.learned || 0) >= 3, prog: (s) => [Math.min(3, s.stats.learned || 0), 3] },
  { id: 'a_hunter', icon: '💎', text: 'Makakuha ng 5 collectibles', reward: { money: 500, gems: 6 }, done: (s) => count(s.collected) >= 5, prog: (s) => [Math.min(5, count(s.collected)), 5] },
  { id: 'a_all', icon: '🗺️', text: 'Makuha ang LAHAT ng collectibles', reward: { money: 2000, gems: 25 }, done: (s) => count(s.collected) >= COLLECTIBLES.length, prog: (s) => [count(s.collected), COLLECTIBLES.length] },
  { id: 'a_streak', icon: '🔥', text: '7-araw na login streak', reward: { money: 700, gems: 7 }, done: (s) => (s.login?.streak || 0) >= 7, prog: (s) => [Math.min(7, s.login?.streak || 0), 7] },
  { id: 'a_event', icon: '🎉', text: 'Sumali sa 3 town events', reward: { money: 500, gems: 5 }, done: (s) => Object.values(s.events || {}).filter((e) => e.claimed).length >= 3, prog: (s) => [Math.min(3, Object.values(s.events || {}).filter((e) => e.claimed).length), 3] },
]
export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))

// ---------- TOWN EVENTS ----------
// The schedule comes from the REAL clock, so every player sees the same event at the same time without any server
// message: every 30-minute slot has one event; it is LIVE during the first 10 minutes of the slot.
export const EVENT_SLOT_MS = 30 * 60000
export const EVENT_LIVE_MS = 10 * 60000
export const TOWN_EVENTS = [
  { id: 'fishing', icon: '🎣', name: 'Fishing Tournament', where: 'fishpond', text: 'Manghuli ng 3 isda', goal: 3, metric: (s) => s.stats.fished, reward: { money: 300, xp: 60, gems: 3 } },
  { id: 'fiesta', icon: '🎉', name: 'Barangay Fiesta', where: 'barangay', text: 'Gumawa ng 2 activities', goal: 2, metric: (s) => s.stats.activities || 0, reward: { money: 250, xp: 50, gems: 3 } },
  { id: 'liga', icon: '🏀', name: 'Basketball Liga', where: 'gym', text: 'Mag-basketball ng 2 beses', goal: 2, metric: (s) => acts(s, 'basketball') + acts(s, 'liga'), reward: { money: 300, xp: 60, gems: 3 } },
  { id: 'quizbee', icon: '🧠', name: 'Quiz Bee Night', where: 'school', text: 'Sumali sa Quiz Bee', goal: 1, metric: (s) => acts(s, 'quizbee'), reward: { money: 280, xp: 60, gems: 3 } },
  { id: 'palaro', icon: '🥫', name: 'Palarong Pinoy', where: 'barangay', text: 'Maglaro ng Tumbang Preso', goal: 1, metric: (s) => acts(s, 'palaro'), reward: { money: 250, xp: 50, gems: 3 } },
  { id: 'sale', icon: '🛒', name: 'Palengke Sale', where: 'market', text: 'Bumili ng 3 item', goal: 3, metric: (s) => s.stats.bought, reward: { money: 200, xp: 40, gems: 2 } },
]
export const EVENT_BY_ID = Object.fromEntries(TOWN_EVENTS.map((e) => [e.id, e]))
const eventOf = (slot) => TOWN_EVENTS[hash(slot) % TOWN_EVENTS.length]

// Current state of the schedule at `now` (ms).
//  live = true  -> `ev` is running, `msLeft` until it ends
//  live = false -> `ev` is the NEXT event, `msToStart` until it starts
export const eventState = (now = Date.now()) => {
  const slot = Math.floor(now / EVENT_SLOT_MS), start = slot * EVENT_SLOT_MS
  if (now - start < EVENT_LIVE_MS) return { slot, ev: eventOf(slot), live: true, msLeft: start + EVENT_LIVE_MS - now, msToStart: 0 }
  return { slot: slot + 1, ev: eventOf(slot + 1), live: false, msLeft: 0, msToStart: start + EVENT_SLOT_MS - now }
}
export const eventProgress = (s, slot, evId) => {
  const e = s.events?.[slot], ev = EVENT_BY_ID[evId]
  if (!e || !ev) return [0, ev?.goal || 1]
  return [Math.max(0, Math.min(ev.goal, ev.metric(s) - e.base)), ev.goal]
}
export const fmtMs = (ms) => {
  const t = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(t / 60)
  return m >= 1 ? `${m}m` : `${t}s`
}

// ---------- COLLECTIBLES / TREASURE HUNT ----------
// x, z = world px (same coordinates as world.js). `secret` ones only show up when you are close.
export const COLLECTIBLES = [
  { id: 'c_bayong', icon: '🧺', name: 'Lumang Bayong', clue: 'Nasa landas ng parke, malapit sa fountain.', x: 580, z: 900, reward: { money: 80, xp: 20, gems: 1 } },
  { id: 'c_parol', icon: '🏮', name: 'Parol', clue: 'Sa kanlurang dulo ng daan sa parke.', x: 200, z: 1220, reward: { money: 80, xp: 20, gems: 1 } },
  { id: 'c_sampaguita', icon: '🌼', name: 'Sampaguita', clue: 'Sa silangang dulo ng daan sa parke.', x: 1100, z: 1220, reward: { money: 80, xp: 20, gems: 1 } },
  { id: 'c_tsinelas', icon: '🩴', name: 'Tsinelas ni Lolo', clue: 'Sa timog na dulo ng parke.', x: 580, z: 1600, reward: { money: 100, xp: 25, gems: 1 } },
  { id: 'c_barya', icon: '🪙', name: 'Lumang Barya', clue: 'Sa gilid ng kalsada, malapit sa terminal.', x: 1300, z: 1500, reward: { money: 100, xp: 25, gems: 1 } },
  { id: 'c_plaza', icon: '🏺', name: 'Banga', clue: 'Sa south plaza, sa ilalim ng fountain.', x: 2400, z: 2610, reward: { money: 150, xp: 35, gems: 2 } },
  { id: 'c_gintong', icon: '👑', name: 'Gintong Korona', clue: 'Sikreto! Hanapin ang dulong kanluran-timog ng mapa.', x: 160, z: 2650, secret: true, reward: { money: 400, xp: 80, gems: 5 } },
  { id: 'c_perlas', icon: '🦪', name: 'Perlas', clue: 'Sikreto! Sa dulong silangan-timog ng mapa.', x: 4640, z: 2650, secret: true, reward: { money: 400, xp: 80, gems: 5 } },
  { id: 'c_mapa', icon: '🗺️', name: 'Lumang Mapa', clue: 'Sikreto! Sa dulong silangan ng bayan.', x: 4640, z: 1450, secret: true, reward: { money: 400, xp: 80, gems: 5 } },
]
export const COLLECT_BY_ID = Object.fromEntries(COLLECTIBLES.map((c) => [c.id, c]))
