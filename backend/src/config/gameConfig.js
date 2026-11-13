// Keep WORLD / SPAWN / LOCATIONS in sync with src/game/world.js on the frontend.
export const WORLD = { width: 4800, height: 2800 }
export const SPAWN = { x: 300, z: 520 }

export const LOCATIONS = {
  house: [240, 520], sari: [620, 520], restaurant: [1000, 520], market: [1660, 520], park: [580, 1310], terminal: [1880, 1070],
  barangay: [2570, 520], hospital: [3020, 520], church: [3520, 520], bakery: [3990, 520], school: [4460, 520],
  mall: [2840, 1060], police: [3480, 1060], gym: [4120, 1060],
  fishpond: [3450, 2322], library: [360, 2200], barber: [850, 2200], hardware: [1680, 2200],
}

export const NET = {
  tickHz: 15,                // world snapshots per second
  persistEveryMs: 30_000,    // how often last-known positions are written to MySQL
  graceMs: 10_000,           // a dropped player stays in the world this long so a quick reconnect is seamless
  minStateIntervalMs: 30,    // server-side cap on position packets per player
  maxSpeed: 450,             // px/s. Walking is 165 and jeepneys 170; the rest is lag tolerance
  speedSlack: 160,           // extra px allowed per packet (e.g. stepping off a jeepney)
  teleportRadius: 160,       // a jump that lands this close to a known map location is accepted (Map panel travel)
}

export const CHAT = { maxLen: 200, history: 50, minIntervalMs: 500, windowMs: 10_000, maxPerWindow: 8 }

export const LIMITS = {
  maxMoney: 1_000_000_000,
  maxStateBytes: 1_000_000,
  maxInventoryKinds: 200,
  maxItemQty: 99_999,
}
