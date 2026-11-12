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
  // --- huli sa palaisdaan (loot: true = pwedeng ibenta sa Palaisdaan) ---
  tilapia: { name: 'Tilapia', emoji: '🐟', cat: 'Food', price: 30, hunger: 20, loot: true },
  hito: { name: 'Hito', emoji: '🐟', cat: 'Food', price: 40, hunger: 18, loot: true },
  bangus: { name: 'Bangus', emoji: '🐠', cat: 'Food', price: 55, hunger: 28, loot: true },
  dalag: { name: 'Dalag', emoji: '🐍', cat: 'Food', price: 90, hunger: 35, health: 3, loot: true },
  alimango: { name: 'Alimango', emoji: '🦀', cat: 'Food', price: 80, hunger: 30, loot: true },
  bota: { name: 'Lumang Bota', emoji: '👢', cat: 'Items', price: 5, loot: true },
  tubig: { name: 'Water', emoji: '💧', cat: 'Items', price: 15, hunger: 3, energy: 5 },
  kape: { name: 'Kape', emoji: '☕', cat: 'Items', price: 15, energy: 12 },
  gamot: { name: 'Medicine', emoji: '💊', cat: 'Items', price: 30, health: 25 },
}
export const SHOPS = {
  sari: { title: 'Sari-Sari Store', icon: '🏪', owner: 'Aling Nena', stock: ['pandesal', 'kanin', 'siomai', 'tubig', 'kape', 'gamot'], job: 'cashier' },
  restaurant: { title: 'Karinderya', icon: '🍽️', owner: 'Ate Joy', stock: ['kanin', 'sinigang', 'halo', 'siomai', 'kape'], job: 'restaurant' },
  market: { title: 'Palengke', icon: '🛒', owner: 'Ate Maria', stock: ['saging', 'mangga', 'itlog', 'isda', 'tubig'] },
  bakery: { title: 'Panaderya', icon: '🥖', owner: 'Ate Lita', stock: ['pandesal', 'itlog', 'kape', 'tubig'] },
  // every place that is not 'house' / 'terminal' opens ShopPanel, so each needs an entry here
  barangay: { title: 'Barangay Hall', icon: '🏛️', owner: 'Kapitan', stock: [] },
  hospital: { title: 'Ospital', icon: '🏥', owner: 'Nurse Gina', stock: ['gamot', 'tubig'] },
  church: { title: 'Simbahan', icon: '⛪', owner: 'Fr. Nato', stock: [] },
  school: { title: 'Paaralan (Canteen)', icon: '🏫', owner: 'Ma\'am Cruz', stock: ['pandesal', 'kanin', 'tubig', 'saging'] },
  mall: { title: 'Mall', icon: '🏬', owner: 'Cashier', stock: ['siomai', 'halo', 'kape', 'tubig', 'gamot'] },
  police: { title: 'Himpilan ng Pulis', icon: '🚓', owner: 'Sir Ramon', stock: [] },
  gym: { title: 'Gym / Court', icon: '🏀', owner: 'Coach', stock: ['tubig', 'saging'] },
  library: { title: 'Aklatan', icon: '📚', owner: 'Librarian', stock: [] },
  barber: { title: 'Barber Shop', icon: '💈', owner: 'Mang Boyet', stock: [] },
  hardware: { title: 'Hardware', icon: '🔨', owner: 'Tindero', stock: [] },
}
// Things you can DO inside a place (shown in ShopPanel). Values are deltas:
// cost = pesos paid, money = pesos earned, energy/hunger/health = change (0-100 stats), minutes = game time passed.
export const ACTIVITIES = {
  gym: [
    { id: 'workout', secs: 6, emoji: '🏋️', name: 'Workout', text: 'Lift and sweat it out.', cost: 0, energy: -20, hunger: -15, health: 10, minutes: 60 },
    { id: 'basketball', secs: 8, emoji: '🏀', name: 'Play Basketball', text: 'Laro tayo, pre!', cost: 20, energy: -25, hunger: -15, health: 8, minutes: 90 },
  ],
  hospital: [
    { id: 'checkup', secs: 5, emoji: '🩺', name: 'Check-up', text: 'Full check-up and treatment.', cost: 100, health: 50, minutes: 45 },
    { id: 'hospbed', secs: 6, emoji: '🛏️', name: 'Rest in Ward', text: 'Rest and recover.', cost: 60, energy: 25, health: 15, minutes: 120 },
  ],
  church: [
    { id: 'pray', secs: 5, emoji: '🙏', name: 'Pray', text: 'Quiet moment of peace.', cost: 0, energy: 5, health: 3, minutes: 20 },
    { id: 'mass', secs: 7, emoji: '⛪', name: 'Attend Mass', text: 'Attend the service.', cost: 0, energy: 8, health: 5, minutes: 60 },
  ],
  barangay: [
    { id: 'cleanup', secs: 7, emoji: '🧹', name: 'Community Clean-up', text: 'Volunteer and get a small allowance.', cost: 0, money: 120, energy: -15, hunger: -10, minutes: 60 },
  ],
  school: [
    { id: 'study', secs: 6, emoji: '📖', name: 'Attend Class', text: 'Learn something new.', cost: 0, energy: -15, hunger: -8, minutes: 90 },
    { id: 'tutor', secs: 7, emoji: '🧑‍🏫', name: 'Tutor Students', text: 'Part-time tutoring.', cost: 0, money: 180, energy: -22, hunger: -12, minutes: 120 },
  ],
  police: [
    { id: 'tanod', secs: 7, emoji: '🚓', name: 'Tanod Duty', text: 'Help patrol the barangay.', cost: 0, money: 160, energy: -22, hunger: -12, minutes: 120 },
  ],
  library: [
    { id: 'read', secs: 6, emoji: '📚', name: 'Read a Book', text: 'Relax with a good book.', cost: 0, energy: -5, health: 2, minutes: 60 },
  ],
  barber: [
    { id: 'haircut', secs: 5, emoji: '✂️', name: 'Haircut', text: 'Fresh look, fresh start.', cost: 80, energy: 3, health: 2, minutes: 30 },
  ],
  hardware: [
    { id: 'oddjob', secs: 7, emoji: '🔨', name: 'Odd Jobs', text: 'Carry and fix things for pay.', cost: 0, money: 190, energy: -25, hunger: -15, minutes: 120 },
  ],
  mall: [
    { id: 'stroll', secs: 6, emoji: '🛍️', name: 'Window Shopping', text: 'Walk around and relax.', cost: 0, energy: -3, health: 1, minutes: 45 },
  ],
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
  { id: 'fish', icon: '🎣', text: 'Catch a fish at the fishpond', reward: 150, done: (s) => s.stats.fished >= 1 },
  { id: 'sleep', icon: '🛏️', text: 'Sleep for 1 time', reward: 50, done: (s) => s.stats.slept >= 1 },
]
export const MAP_SPOTS = [['house', '🏠', 'Home'], ['sari', '🏪', 'Sari-Sari'], ['restaurant', '🍽️', 'Karinderya'], ['market', '🛒', 'Market'], ['park', '🌳', 'Park'], ['terminal', '🚌', 'Jeepney Terminal'],
  ['barangay', '🏛️', 'Barangay Hall'], ['hospital', '🏥', 'Ospital'], ['church', '⛪', 'Simbahan'], ['bakery', '🥖', 'Panaderya'], ['school', '🏫', 'Paaralan'],
  ['mall', '🏬', 'Mall'], ['police', '🚓', 'Pulis'], ['gym', '🏀', 'Gym / Court'],
  ['library', '📚', 'Aklatan'], ['barber', '💈', 'Barber Shop'], ['hardware', '🔨', 'Hardware'], ['fishpond', '🎣', 'Palaisdaan']]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const fmtTime = (day, m) => {
  const h = Math.floor(m / 60)
  return `${DAYS[(day - 1) % 7]} ${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
export const weatherIndex = (day) => (day * 5) % 3 // 0 = Sunny, 1 = Cloudy, 2 = Rainy
export const weather = (day) => [['☀️', 'Sunny'], ['⛅', 'Cloudy'], ['🌧️', 'Rainy']][weatherIndex(day)]
export const level = (s) => 1 + Math.floor(s.stats.jobs / 3)
export const effectText = (it) => [it.hunger && `🍽️ +${it.hunger}`, it.energy && `⚡ +${it.energy}`, it.health && `❤️ +${it.health}`].filter(Boolean).join('  ')