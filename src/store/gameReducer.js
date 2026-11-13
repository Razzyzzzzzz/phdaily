import { ITEMS, JOBS, MISSIONS, LEARN, learnReward, xpInfo, xpToReach } from '../data/gameData'
import {
  MAIN_QUESTS, DAILY_BY_ID, DAILY_BONUS, genDaily, dailyProgress, LOGIN_REWARDS, ACH_BY_ID,
  COLLECT_BY_ID, EVENT_BY_ID, eventState, eventProgress, prevDayKey,
} from '../data/progression'
const c = (v) => Math.max(0, Math.min(100, v))

export const initialState = {
  player: null, money: 1000, energy: 100, hunger: 100, health: 100, day: 1, minutes: 480,
  inventory: {}, stats: { jobs: 0, play: 0, bought: 0, slept: 0, fished: 0, activities: 0, acts: {}, quizzes: 0, learned: 0, perfects: 0 }, claimed: {}, furniture: null,
  modules: [], // na-upload na learning modules: { id, title, lesson, questions: [{ q, o: [], a }] }
  learn: {},   // progreso kada module (key = module id): { best, passed, perfect, tries }
  // ---- progression (XP / gems / quests / rewards) ----
  xp: 0, gems: 50, levelUp: null,
  mq: 0,            // index ng kasalukuyang main quest (MAIN_QUESTS)
  visited: {},      // { placeId: true } mga lugar na napuntahan na
  collected: {},    // { collectibleId: true }
  ach: {},          // { achievementId: true } na-claim na
  daily: null,      // { date, ids, base, claimed, bonus }
  login: { last: null, streak: 0, claimed: null },
  events: {},       // { [slot]: { evId, base, claimed } }
}

// Give a reward ({ money, xp, gems }). Each level gained pays ₱100 + 5 gems and flags `levelUp` for the HUD toast.
export function grant(s, r = {}) {
  const xp = (s.xp || 0) + (r.xp || 0)
  const before = xpInfo(s.xp || 0).level, after = xpInfo(xp).level
  let money = s.money + (r.money || 0), gems = (s.gems || 0) + (r.gems || 0), levelUp = s.levelUp
  if (after > before) {
    money += (after - before) * 100
    gems += (after - before) * 5
    levelUp = { level: after, n: (s.levelUp?.n || 0) + 1 }
  }
  return { ...s, money, gems, xp, levelUp }
}

// XP for the existing actions (so everything the player already does now levels them up)
const XP = {
  BUY: () => 2,
  WORK: () => 30,
  ACTIVITY: (a) => (a.act?.id === 'fish' ? 1 : a.act?.work ? 30 : 10), // casting a line = tiny XP; the catch gives the real XP
  CATCH: (a) => (a.id === 'bota' ? 2 : 8),
  SELL_FISH: () => 5,
  SLEEP: () => 5,
  MODULE_DONE: () => 25,
  CLAIM: (a) => 40,
}

function inner(s, a) {
  // proteksyon: ang state mula sa lumang code (hot reload / lumang save) ay maaaring walang modules / learn
  if (!s.modules || !s.learn) s = { ...s, modules: s.modules || [], learn: s.learn || {} }
  switch (a.type) {
    case 'LOAD': {
      const jobs = a.state.stats?.jobs || 0
      return {
        ...initialState, ...a.state,
        stats: { ...initialState.stats, ...a.state.stats, acts: { ...(a.state.stats?.acts || {}) } },
        xp: a.state.xp ?? xpToReach(1 + Math.floor(jobs / 3)), // old level = 1 + jobs / 3
        login: { ...initialState.login, ...(a.state.login || {}) },
        levelUp: null,
      }
    }
    case 'NEW': return { ...initialState, player: a.player }
    case 'RESET': return initialState // logout: forget the previous account's state so the next login starts clean
    case 'FURNITURE': return { ...s, furniture: a.furniture }
    case 'TICK': {
      const hunger = c(s.hunger - 0.5 * a.rate), energy = c(s.energy - 0.25 * a.rate)
      let health = s.health
      if (hunger <= 0 || energy <= 0) health = c(health - a.rate)
      else if (hunger > 60 && energy > 30) health = c(health + 0.25 * a.rate)
      let minutes = s.minutes + 5, day = s.day
      if (minutes >= 1440) { minutes -= 1440; day++ }
      return { ...s, hunger, energy, health, minutes, day, stats: { ...s.stats, play: s.stats.play + 2 } }
    }
    case 'BUY': {
      const it = ITEMS[a.id]
      if (s.money < it.price) return s
      return { ...s, money: s.money - it.price, inventory: { ...s.inventory, [a.id]: (s.inventory[a.id] || 0) + 1 }, stats: { ...s.stats, bought: s.stats.bought + 1 } }
    }
    case 'USE': case 'DROP': {
      const it = ITEMS[a.id], q = s.inventory[a.id] || 0
      if (!q) return s
      const inventory = { ...s.inventory }
      if (q === 1) delete inventory[a.id]; else inventory[a.id] = q - 1
      if (a.type === 'DROP') return { ...s, inventory }
      return { ...s, inventory, hunger: c(s.hunger + (it.hunger || 0)), energy: c(s.energy + (it.energy || 0)), health: c(s.health + (it.health || 0)) }
    }
    case 'WORK': {
      const j = JOBS[a.id]
      return { ...s, money: s.money + j.pay, energy: c(s.energy - j.energy), hunger: c(s.hunger - j.hunger), stats: { ...s.stats, jobs: s.stats.jobs + 1 } }
    }
    case 'ACTIVITY': {
      // a.act = { id, cost, money, energy, hunger, health, minutes, give, work } (ACTIVITIES in gameData.js,
      // possibly already scaled by the mini-game score in ShopPanel)
      const x = a.act
      if (s.money < (x.cost || 0)) return s
      if ((x.energy || 0) < 0 && s.energy + x.energy < 0) return s
      if ((x.hunger || 0) < 0 && s.hunger + x.hunger < 0) return s
      let minutes = s.minutes + (x.minutes || 0), day = s.day
      while (minutes >= 1440) { minutes -= 1440; day++ }
      let player = s.player
      if (x.id === 'haircut' && player) player = { ...player, look: { ...player.look, hairStyle: ((player.look.hairStyle ?? 0) + 1) % 3 } }
      let inventory = s.inventory
      if (x.give) {
        inventory = { ...inventory }
        for (const [id, q] of Object.entries(x.give)) if (ITEMS[id]) inventory[id] = (inventory[id] || 0) + q
      }
      const prev = s.stats.acts || {}
      return {
        ...s, player, day, minutes, inventory,
        money: s.money - (x.cost || 0) + (x.money || 0),
        energy: c(s.energy + (x.energy || 0)), hunger: c(s.hunger + (x.hunger || 0)), health: c(s.health + (x.health || 0)),
        stats: {
          ...s.stats,
          activities: (s.stats.activities || 0) + 1,
          acts: { ...prev, [x.id]: (prev[x.id] || 0) + 1 },
          jobs: s.stats.jobs + (x.work ? 1 : 0),
        },
      }
    }
    case 'MODULE_ADD': {
      const m = a.module
      if (!m?.id || !Array.isArray(m.questions) || m.questions.length < 3) return s
      const exists = s.modules.some((x) => x.id === m.id)
      if (!exists && s.modules.length >= LEARN.maxModules) return s
      return { ...s, modules: exists ? s.modules.map((x) => (x.id === m.id ? m : x)) : [...s.modules, m] }
    }
    case 'MODULE_DEL': return { ...s, modules: s.modules.filter((x) => x.id !== a.id) } // naiiwan ang `learn` para hindi ma-farm sa pag-delete/re-upload
    case 'MODULE_DONE': {
      // a = { hash, correct, total }
      if (!a.total || s.energy < LEARN.energy || s.hunger < LEARN.hunger) return s
      const prev = s.learn[a.hash]
      const r = learnReward(prev, a.correct, a.total)
      let minutes = s.minutes + LEARN.minutes, day = s.day
      while (minutes >= 1440) { minutes -= 1440; day++ }
      return {
        ...s, day, minutes,
        money: s.money + r.money,
        energy: c(s.energy - LEARN.energy), hunger: c(s.hunger - LEARN.hunger),
        learn: { ...s.learn, [a.hash]: { best: Math.max(prev?.best || 0, r.pct), passed: !!(prev?.passed || r.passed), perfect: !!(prev?.perfect || r.perfect), tries: (prev?.tries || 0) + 1 } },
        stats: {
          ...s.stats,
          quizzes: (s.stats.quizzes || 0) + 1,
          learned: (s.stats.learned || 0) + (r.firstPass ? 1 : 0),
          perfects: (s.stats.perfects || 0) + (r.firstPerfect ? 1 : 0),
          jobs: s.stats.jobs + (r.firstPass ? 1 : 0), // unang pasa = +1 sa Level progress
        },
      }
    }
    case 'CATCH': {
      if (!ITEMS[a.id]) return s
      return { ...s, inventory: { ...s.inventory, [a.id]: (s.inventory[a.id] || 0) + 1 }, stats: { ...s.stats, fished: (s.stats.fished || 0) + (a.id === 'bota' ? 0 : 1) } }
    }
    case 'SELL_FISH': {
      let total = 0
      const inventory = { ...s.inventory }
      for (const [id, q] of Object.entries(inventory)) if (ITEMS[id]?.loot) { total += ITEMS[id].price * q; delete inventory[id] }
      return total ? { ...s, inventory, money: s.money + total } : s
    }
    case 'SLEEP': return { ...s, energy: 100, hunger: c(s.hunger - 15), health: c(s.health + 10), day: s.day + 1, minutes: 360, stats: { ...s.stats, slept: s.stats.slept + 1 } }
    case 'CLAIM': {
      const m = MISSIONS.find((x) => x.id === a.id)
      if (!m || s.claimed[a.id] || !m.done(s)) return s
      return { ...s, money: s.money + m.reward, claimed: { ...s.claimed, [a.id]: true } }
    }
    // ---------------- progression ----------------
    case 'VISIT': return s.visited?.[a.id] ? s : { ...s, visited: { ...s.visited, [a.id]: true } }
    case 'MAIN_CLAIM': {
      const q = MAIN_QUESTS[s.mq]
      if (!q || !q.done(s)) return s
      return { ...grant(s, q.reward), mq: s.mq + 1 }
    }
    case 'DAILY_SYNC': {
      // a.date = 'YYYY-MM-DD' (local). Makes the day's quests + advances the login streak.
      let n = s
      if (s.login.last !== a.date) {
        const streak = s.login.last === prevDayKey(a.date) ? s.login.streak + 1 : 1
        n = { ...n, login: { ...s.login, last: a.date, streak } }
      }
      if (!s.daily || s.daily.date !== a.date) n = { ...n, daily: genDaily(a.date, n) }
      return n
    }
    case 'LOGIN_CLAIM': {
      if (!s.login.last || s.login.claimed === s.login.last) return s
      const r = LOGIN_REWARDS[(s.login.streak - 1) % LOGIN_REWARDS.length]
      return { ...grant(s, r.reward), login: { ...s.login, claimed: s.login.last } }
    }
    case 'DAILY_CLAIM': {
      const q = DAILY_BY_ID[a.id]
      if (!q || !s.daily || !s.daily.ids.includes(a.id) || s.daily.claimed[a.id]) return s
      const [cur, goal] = dailyProgress(s, a.id)
      if (cur < goal) return s
      return grant({ ...s, daily: { ...s.daily, claimed: { ...s.daily.claimed, [a.id]: true } } }, q.reward)
    }
    case 'DAILY_BONUS': {
      if (!s.daily || s.daily.bonus || !s.daily.ids.every((id) => s.daily.claimed[id])) return s
      return grant({ ...s, daily: { ...s.daily, bonus: true } }, DAILY_BONUS)
    }
    case 'ACH_CLAIM': {
      const x = ACH_BY_ID[a.id]
      if (!x || s.ach[a.id] || !x.done(s)) return s
      return grant({ ...s, ach: { ...s.ach, [a.id]: true } }, x.reward)
    }
    case 'COLLECT': {
      const c = COLLECT_BY_ID[a.id]
      if (!c || s.collected[a.id]) return s
      return grant({ ...s, collected: { ...s.collected, [a.id]: true } }, c.reward)
    }
    case 'EVENT_JOIN': {
      const e = eventState(a.now)
      if (!e.live || s.events[e.slot]) return s
      const keep = Object.keys(s.events).map(Number).sort((x, y) => y - x).slice(0, 9)
      const events = Object.fromEntries(keep.map((k) => [k, s.events[k]]))
      events[e.slot] = { evId: e.ev.id, base: e.ev.metric(s), claimed: false }
      return { ...s, events }
    }
    case 'EVENT_CLAIM': {
      const e = s.events[a.slot], ev = e && EVENT_BY_ID[e.evId]
      if (!e || e.claimed || !ev) return s
      // you can claim until the end of that 30-minute slot
      if (Math.floor(a.now / (30 * 60000)) !== Number(a.slot)) return s
      const [cur, goal] = eventProgress(s, a.slot, e.evId)
      if (cur < goal) return s
      return grant({ ...s, events: { ...s.events, [a.slot]: { ...e, claimed: true } } }, ev.reward)
    }
    default: return s
  }
}

export function reducer(s, a) {
  const n = inner(s, a)
  const xp = XP[a.type]
  return n !== s && xp ? grant(n, { xp: xp(a, s) }) : n
}