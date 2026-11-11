export const HAIRS = [0, 1, 2]            // short, bushy, long
export const OUTFITS = ['#f8fafc', '#1f2937', '#dc2626']

export const ITEMS = {
  kanin: { name: 'Rice', emoji: '🍚', cat: 'Food', price: 20, hunger: 25 },
  siomai: { name: 'Siomai', emoji: '🥟', cat: 'Food', price: 25, hunger: 20 },
  pandesal: { name: 'Pandesal', emoji: '🥖', cat: 'Food', price: 10, hunger: 10 },
  sinigang: { name: 'Sinigang', emoji: '🍲', cat: 'Food', price: 90, hunger: 50, health: 5 },
  halo: { name: 'Halo-Halo', emoji: '🍧', cat: 'Food', price: 50, hunger: 20, energy: 8 },
  saging: { name: 'Saging', emoji: '🍌', cat: 'Food', price: 8, hunger: 12 },
  mangga: { name: 'Mangga', emoji: '🥭', cat: 'Food', price: 25, hunger: 18, health: 2 },
  isda: { name: 'Pritong Tilapia', emoji: '🐟', cat: 'Food', price: 70, hunger: 35 },
  itlog: { name: 'Itlog', emoji: '🥚', cat: 'Food', price: 12, hunger: 12 },
  tubig: { name: 'Water', emoji: '💧', cat: 'Items', price: 15, hunger: 3, energy: 5 },
  kape: { name: 'Kape', emoji: '☕', cat: 'Items', price: 15, energy: 12 },
  gamot: { name: 'Medicine', emoji: '💊', cat: 'Items', price: 30, health: 25 },
}
export const SHOPS = {
  sari: { title: 'Sari-Sari Store', icon: '🏪', owner: 'Aling Nena', stock: ['pandesal', 'kanin', 'siomai', 'tubig', 'kape', 'gamot'], job: 'cashier' },
  restaurant: { title: 'Karinderya', icon: '🍽️', owner: 'Ate Joy', stock: ['kanin', 'sinigang', 'halo', 'siomai', 'kape'], job: 'restaurant' },
  market: { title: 'Palengke', icon: '🛒', owner: 'Ate Maria', stock: ['saging', 'mangga', 'itlog', 'isda', 'tubig'] },
}
export const JOBS = {
  cashier: { name: 'Cashier', emoji: '🧑‍💼', place: 'Sari-Sari Store', placeId: 'sari', pay: 200, energy: 20, hunger: 10, taps: 5, task: 'Scan item' },
  rider: { name: 'Delivery Rider', emoji: '🛵', place: 'Jeepney Terminal', placeId: 'terminal', pay: 250, energy: 30, hunger: 15, taps: 7, task: 'Deliver parcel' },
  restaurant: { name: 'Restaurant Worker', emoji: '🧑‍🍳', place: 'Karinderya', placeId: 'restaurant', pay: 220, energy: 25, hunger: 15, taps: 6, task: 'Serve order' },
}
export const JOB_BY_PLACE = Object.fromEntries(Object.entries(JOBS).map(([id, j]) => [j.placeId, id]))
export const MISSIONS = [
  { id: 'buy', icon: '🧺', text: 'Buy food at the market', reward: 100, done: (s) => s.stats.bought >= 1 },
  { id: 'work', icon: '💼', text: 'Work at any job', reward: 200, done: (s) => s.stats.jobs >= 1 },
  { id: 'sleep', icon: '🛏️', text: 'Sleep for 1 time', reward: 50, done: (s) => s.stats.slept >= 1 },
]
export const MAP_SPOTS = [['house', '🏠', 'Home'], ['sari', '🏪', 'Sari-Sari'], ['restaurant', '🍽️', 'Karinderya'], ['market', '🛒', 'Market'], ['park', '🌳', 'Park'], ['terminal', '🚌', 'Jeepney Terminal']]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const fmtTime = (day, m) => {
  const h = Math.floor(m / 60)
  return `${DAYS[(day - 1) % 7]} ${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
export const weatherIndex = (day) => (day * 5) % 3 // 0 = Sunny, 1 = Cloudy, 2 = Rainy
export const weather = (day) => [['☀️', 'Sunny'], ['⛅', 'Cloudy'], ['🌧️', 'Rainy']][weatherIndex(day)]
export const level = (s) => 1 + Math.floor(s.stats.jobs / 3)
export const effectText = (it) => [it.hunger && `🍽️ +${it.hunger}`, it.energy && `⚡ +${it.energy}`, it.health && `❤️ +${it.health}`].filter(Boolean).join('  ')