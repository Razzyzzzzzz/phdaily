import { ITEMS, JOBS, MISSIONS } from '../data/gameData'
const c = (v) => Math.max(0, Math.min(100, v))

export const initialState = {
  player: null, money: 1000, energy: 100, hunger: 100, health: 100, day: 1, minutes: 480,
  inventory: {}, stats: { jobs: 0, play: 0, bought: 0, slept: 0, fished: 0 }, claimed: {}, furniture: null,
}

export function reducer(s, a) {
  switch (a.type) {
    case 'LOAD': return { ...initialState, ...a.state, stats: { ...initialState.stats, ...a.state.stats } }
    case 'NEW': return { ...initialState, player: a.player }
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
      // a.act = { cost, money, energy, hunger, health, minutes, id } from ACTIVITIES in gameData.js
      const x = a.act
      if (s.money < (x.cost || 0)) return s
      if ((x.energy || 0) < 0 && s.energy + x.energy < 0) return s
      if ((x.hunger || 0) < 0 && s.hunger + x.hunger < 0) return s
      let minutes = s.minutes + (x.minutes || 0), day = s.day
      while (minutes >= 1440) { minutes -= 1440; day++ }
      let player = s.player
      if (x.id === 'haircut' && player) player = { ...player, look: { ...player.look, hairStyle: ((player.look.hairStyle ?? 0) + 1) % 3 } }
      return {
        ...s, player, day, minutes,
        money: s.money - (x.cost || 0) + (x.money || 0),
        energy: c(s.energy + (x.energy || 0)), hunger: c(s.hunger + (x.hunger || 0)), health: c(s.health + (x.health || 0)),
        stats: { ...s.stats, activities: (s.stats.activities || 0) + 1, jobs: s.stats.jobs + (x.money ? 1 : 0) },
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
    default: return s
  }
}