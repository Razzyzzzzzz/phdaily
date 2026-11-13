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
  // --- NEW food ---
  adobo: { name: 'Adobo', emoji: '🍛', cat: 'Food', price: 60, hunger: 45, energy: 5 },
  turon: { name: 'Turon', emoji: '🥠', cat: 'Food', price: 15, hunger: 14 },
  bibingka: { name: 'Bibingka', emoji: '🥞', cat: 'Food', price: 30, hunger: 22, energy: 4 },
  kwekkwek: { name: 'Kwek-Kwek', emoji: '🍢', cat: 'Food', price: 20, hunger: 15 },
  // --- huli sa palaisdaan (loot: true = pwedeng ibenta sa Palaisdaan) ---
  tilapia: { name: 'Tilapia', emoji: '🐟', cat: 'Food', price: 30, hunger: 20, loot: true },
  hito: { name: 'Hito', emoji: '🐟', cat: 'Food', price: 40, hunger: 18, loot: true },
  bangus: { name: 'Bangus', emoji: '🐠', cat: 'Food', price: 55, hunger: 28, loot: true },
  dalag: { name: 'Dalag', emoji: '🐍', cat: 'Food', price: 90, hunger: 35, health: 3, loot: true },
  alimango: { name: 'Alimango', emoji: '🦀', cat: 'Food', price: 80, hunger: 30, loot: true },
  bota: { name: 'Lumang Bota', emoji: '👢', cat: 'Items', price: 5, loot: true },
  tubig: { name: 'Water', emoji: '💧', cat: 'Items', price: 15, hunger: 3, energy: 5 },
  kape: { name: 'Kape', emoji: '☕', cat: 'Items', price: 15, energy: 12 },
  gulaman: { name: "Sago't Gulaman", emoji: '🥤', cat: 'Items', price: 18, hunger: 4, energy: 10 },
  gamot: { name: 'Medicine', emoji: '💊', cat: 'Items', price: 30, health: 25 },
}
export const SHOPS = {
  sari: { title: 'Sari-Sari Store', icon: '🏪', owner: 'Aling Nena', stock: ['pandesal', 'kanin', 'siomai', 'kwekkwek', 'turon', 'gulaman', 'tubig', 'kape', 'gamot'], job: 'cashier' },
  restaurant: { title: 'Karinderya', icon: '🍽️', owner: 'Ate Joy', stock: ['kanin', 'adobo', 'sinigang', 'halo', 'siomai', 'kape'], job: 'restaurant' },
  market: { title: 'Palengke', icon: '🛒', owner: 'Ate Maria', stock: ['saging', 'mangga', 'itlog', 'isda', 'tubig'] },
  bakery: { title: 'Panaderya', icon: '🥖', owner: 'Ate Lita', stock: ['pandesal', 'bibingka', 'itlog', 'kape', 'tubig'] },
  // every place that is not 'house' / 'terminal' opens ShopPanel, so each needs an entry here
  barangay: { title: 'Barangay Hall', icon: '🏛️', owner: 'Kapitan', stock: [] },
  hospital: { title: 'Ospital', icon: '🏥', owner: 'Nurse Gina', stock: ['gamot', 'tubig'] },
  church: { title: 'Simbahan', icon: '⛪', owner: 'Fr. Nato', stock: [] },
  school: { title: 'Paaralan (Canteen)', icon: '🏫', owner: 'Ma\'am Cruz', stock: ['pandesal', 'kanin', 'tubig', 'saging'] },
  mall: { title: 'Mall', icon: '🏬', owner: 'Cashier', stock: ['siomai', 'halo', 'kape', 'tubig', 'gamot'] },
  police: { title: 'Himpilan ng Pulis', icon: '🚓', owner: 'Sir Ramon', stock: [] },
  gym: { title: 'Gym / Court', icon: '🏀', owner: 'Coach', stock: ['tubig', 'gulaman', 'saging'] },
  library: { title: 'Aklatan', icon: '📚', owner: 'Librarian', stock: [] },
  barber: { title: 'Barber Shop', icon: '💈', owner: 'Mang Boyet', stock: [] },
  hardware: { title: 'Hardware', icon: '🔨', owner: 'Tindero', stock: [] },
}

// Things you can DO inside a place (shown in ShopPanel). Values are deltas:
// cost = pesos paid, money = pesos earned, energy/hunger/health = change (0-100 stats), minutes = game time passed.
//   work: true  -> counts as a job (for Level / "Work" mission)
//   give: { itemId: qty } -> items added to inventory
//   game: { type, ... } -> opens a mini-game first (see MiniGame.jsx). Better score = bigger positive rewards.
//        type: 'tap' {target,time} | 'timing' {rounds} | 'memory' {length,pool} | 'quiz' {topic,count} | 'pick' {prizes}
export const ACTIVITIES = {
  gym: [
    { id: 'workout', secs: 6, emoji: '🏋️', name: 'Workout', text: 'Lift and sweat it out.', cost: 0, energy: -20, hunger: -15, health: 14, minutes: 60,
      game: { type: 'tap', target: 25, time: 6, label: 'Mag-reps! Pindutin nang mabilis!' } },
    { id: 'basketball', secs: 8, emoji: '🏀', name: 'Play Basketball', text: 'Laro tayo, pre! Mag-shoot sa tamang timing.', cost: 20, energy: -25, hunger: -15, health: 10, minutes: 90,
      game: { type: 'timing', rounds: 5, label: 'Pindutin kapag nasa berdeng zone ang bola!' } },
    { id: 'liga', secs: 8, emoji: '🏆', name: 'Liga ng Barangay', text: 'Sumali sa liga. May premyo kapag nanalo!', cost: 50, money: 250, energy: -30, hunger: -20, health: 6, minutes: 120,
      game: { type: 'timing', rounds: 7, label: '7 tira. Mas maraming pasok, mas malaki ang premyo!' } },
    { id: 'zumba', secs: 7, emoji: '💃', name: 'Zumba Class', text: 'Sundan ang sayaw ni Coach.', cost: 30, energy: -18, hunger: -10, health: 12, minutes: 60,
      game: { type: 'memory', length: 5, pool: ['⬆️', '⬇️', '⬅️', '➡️'], label: 'Tandaan ang sunod-sunod na galaw!' } },
  ],
  hospital: [
    { id: 'checkup', secs: 5, emoji: '🩺', name: 'Check-up', text: 'Full check-up and treatment.', cost: 100, health: 50, minutes: 45 },
    { id: 'hospbed', secs: 6, emoji: '🛏️', name: 'Rest in Ward', text: 'Rest and recover.', cost: 60, energy: 25, health: 15, minutes: 120 },
    { id: 'volunteer', secs: 6, emoji: '🧑‍⚕️', name: 'Volunteer Aide', text: 'Tumulong sa mga pasyente. May allowance.', cost: 0, money: 150, energy: -18, hunger: -10, minutes: 90, work: true,
      game: { type: 'tap', target: 18, time: 6, label: 'Mag-ayos ng kama at gamit. Pindutin nang mabilis!' } },
  ],
  church: [
    { id: 'pray', secs: 5, emoji: '🙏', name: 'Pray', text: 'Quiet moment of peace.', cost: 0, energy: 5, health: 3, minutes: 20 },
    { id: 'mass', secs: 7, emoji: '⛪', name: 'Attend Mass', text: 'Attend the service.', cost: 0, energy: 8, health: 5, minutes: 60 },
    { id: 'choir', secs: 7, emoji: '🎶', name: 'Sing in the Choir', text: 'Kumanta sa koro. May tip mula sa mabait na parokyano.', cost: 0, money: 90, energy: -8, hunger: -5, health: 3, minutes: 60,
      game: { type: 'timing', rounds: 4, label: 'Sabayan ang tono! Pindutin sa tamang oras.' } },
  ],
  barangay: [
    { id: 'cleanup', secs: 7, emoji: '🧹', name: 'Community Clean-up', text: 'Volunteer and get a small allowance.', cost: 0, money: 120, energy: -15, hunger: -10, minutes: 60, work: true,
      game: { type: 'tap', target: 20, time: 6, label: 'Walisin ang kalsada! Pindutin nang mabilis!' } },
    { id: 'raffle', secs: 4, emoji: '🎟️', name: 'Fiesta Raffle', text: 'Pumili ng isang kahon. Sinong swerte?', cost: 30, energy: -2, minutes: 20,
      game: { type: 'pick', prizes: [0, 30, 200], label: 'Pumili ng isang regalo!' } },
    { id: 'palaro', secs: 7, emoji: '🥫', name: 'Tumbang Preso', text: 'Palarong Pinoy! Patamaan ang lata.', cost: 0, money: 80, energy: -15, hunger: -8, health: 4, minutes: 60,
      game: { type: 'timing', rounds: 5, label: 'Patamaan ang lata sa tamang timing!' } },
  ],
  school: [
    { id: 'study', secs: 6, emoji: '📖', name: 'Attend Class', text: 'Learn something new.', cost: 0, energy: -15, hunger: -8, minutes: 90 },
    { id: 'quizbee', secs: 8, emoji: '🧠', name: 'Quiz Bee', text: 'Sagutan ang tanong tungkol sa Pilipinas. May premyo!', cost: 0, money: 120, energy: -15, hunger: -8, minutes: 90,
      game: { type: 'quiz', topic: 'pinoy', count: 5, label: '5 tanong. Galingan mo!' } },
    { id: 'tutor', secs: 7, emoji: '🧑‍🏫', name: 'Tutor Students', text: 'Part-time tutoring.', cost: 0, money: 180, energy: -22, hunger: -12, minutes: 120, work: true,
      game: { type: 'quiz', topic: 'school', count: 4, label: 'Sagutan nang tama ang tanong ng estudyante!' } },
    // learn: true -> binubuksan ang LearningPanel (upload ng sariling module + quiz)
    { id: 'modules', emoji: '📂', name: 'My Learning Modules', text: 'I-upload ang sarili mong module (.txt / .md), basahin, at sagutan ang quiz. May premyo!', cost: 0, learn: true },
  ],
  police: [
    { id: 'tanod', secs: 7, emoji: '🚓', name: 'Tanod Duty', text: 'Help patrol the barangay.', cost: 0, money: 160, energy: -22, hunger: -12, minutes: 120, work: true,
      game: { type: 'timing', rounds: 5, label: 'Mag-ronda! Pindutin kapag nasa zone ang kahina-hinala.' } },
  ],
  library: [
    { id: 'read', secs: 6, emoji: '📚', name: 'Read a Book', text: 'Relax with a good book.', cost: 0, energy: -5, health: 2, minutes: 60 },
    { id: 'trivia', secs: 7, emoji: '❓', name: 'Trivia Night', text: 'Patalasan tayo. Kumita sa tamang sagot.', cost: 0, money: 70, energy: -8, hunger: -5, minutes: 45,
      game: { type: 'quiz', topic: 'pinoy', count: 3, label: '3 tanong tungkol sa Pilipinas.' } },
    { id: 'modules', emoji: '📂', name: 'My Learning Modules', text: 'I-upload ang sarili mong module (.txt / .md), basahin, at sagutan ang quiz. May premyo!', cost: 0, learn: true },
  ],
  barber: [
    { id: 'haircut', secs: 5, emoji: '✂️', name: 'Haircut', text: 'Fresh look, fresh start.', cost: 80, energy: 3, health: 2, minutes: 30 },
    { id: 'sweep', secs: 6, emoji: '🧹', name: 'Help Mang Boyet', text: 'Magwalis ng buhok at mag-ayos ng tindahan.', cost: 0, money: 100, energy: -12, hunger: -6, minutes: 45, work: true,
      game: { type: 'tap', target: 15, time: 5, label: 'Walisin ang buhok! Pindutin nang mabilis!' } },
  ],
  hardware: [
    { id: 'oddjob', secs: 7, emoji: '🔨', name: 'Odd Jobs', text: 'Carry and fix things for pay.', cost: 0, money: 190, energy: -25, hunger: -15, minutes: 120, work: true,
      game: { type: 'tap', target: 30, time: 7, label: 'Magbuhat ng semento! Pindutin nang mabilis!' } },
    { id: 'paint', secs: 7, emoji: '🎨', name: 'Paint the Fence', text: 'Magpintura nang pantay.', cost: 0, money: 140, energy: -20, hunger: -10, minutes: 90, work: true,
      game: { type: 'timing', rounds: 5, label: 'Pindutin kapag nasa zone ang brotsa!' } },
  ],
  mall: [
    { id: 'stroll', secs: 6, emoji: '🛍️', name: 'Window Shopping', text: 'Walk around and relax.', cost: 0, energy: -3, health: 1, minutes: 45 },
    { id: 'karaoke', secs: 7, emoji: '🎤', name: 'Videoke Contest', text: 'Kumanta at manalo ng premyo!', cost: 50, money: 150, energy: -10, hunger: -6, health: 5, minutes: 60,
      game: { type: 'timing', rounds: 6, label: 'Sabayan ang beat! Pindutin sa tamang oras.' } },
    { id: 'arcade', secs: 6, emoji: '🕹️', name: 'Arcade', text: 'Tandaan ang pattern, manalo ng tiket.', cost: 30, money: 100, energy: -6, minutes: 30,
      game: { type: 'memory', length: 5, pool: ['🔴', '🟢', '🔵', '🟡'], label: 'Tandaan ang sunod-sunod na kulay!' } },
  ],
  market: [
    { id: 'tawad', secs: 5, emoji: '🗣️', name: 'Tumawad sa Suki', text: 'Mamili at tumawad. Pag magaling, may libreng paninda!', cost: 0, energy: -5, minutes: 20, give: { saging: 2, mangga: 1 },
      game: { type: 'timing', rounds: 3, label: 'Pindutin sa tamang tawad. Mas tama, mas maraming libre!' } },
    { id: 'magtinda', secs: 7, emoji: '🧺', name: 'Magtinda', text: 'Tulungan si Ate Maria magbenta.', cost: 0, money: 130, energy: -20, hunger: -10, minutes: 90, work: true,
      game: { type: 'tap', target: 20, time: 6, label: 'Mag-abot ng paninda! Pindutin nang mabilis!' } },
  ],
  sari: [
    { id: 'sukli', secs: 6, emoji: '🧮', name: 'Magsukli', text: 'Tulungan si Aling Nena sa sukli. Dapat tama!', cost: 0, money: 90, energy: -8, hunger: -5, minutes: 30, work: true,
      game: { type: 'quiz', topic: 'sukli', count: 4, label: 'Kuwentahin ang sukli!' } },
  ],
  restaurant: [
    { id: 'adobo', secs: 7, emoji: '🍳', name: 'Magluto ng Adobo', text: 'Sundan ang tamang sangkap. Makakakuha ka ng adobo!', cost: 40, energy: -12, hunger: -5, minutes: 60, give: { adobo: 3 },
      game: { type: 'memory', length: 4, pool: ['🧄', '🧅', '🌶️', '🫚'], label: 'Tandaan ang sunod ng sangkap!' } },
  ],
  bakery: [
    { id: 'bake', secs: 6, emoji: '🥖', name: 'Mag-bake ng Pandesal', text: 'Masahin ang masa. Mas mabilis, mas maraming pandesal!', cost: 15, energy: -10, minutes: 45, give: { pandesal: 4 },
      game: { type: 'tap', target: 20, time: 6, label: 'Masahin ang masa! Pindutin nang mabilis!' } },
  ],
}

export const JOBS = {
  cashier: { name: 'Cashier', emoji: '🧑‍💼', place: 'Sari-Sari Store', placeId: 'sari', pay: 200, energy: 20, hunger: 10, taps: 5, task: 'Scan item' },
  rider: { name: 'Delivery Rider', emoji: '🛵', place: 'Jeepney Terminal', placeId: 'terminal', pay: 250, energy: 30, hunger: 15, taps: 7, task: 'Deliver parcel' },
  restaurant: { name: 'Restaurant Worker', emoji: '🧑‍🍳', place: 'Karinderya', placeId: 'restaurant', pay: 220, energy: 25, hunger: 15, taps: 6, task: 'Serve order' },
}
export const JOB_BY_PLACE = Object.fromEntries(Object.entries(JOBS).map(([id, j]) => [j.placeId, id]))

// ---------- Learning modules (LearningPanel.jsx) ----------
// Gastos kada quiz + hanggang ilang tanong ang lalabas bawat attempt
export const LEARN = { energy: 8, hunger: 4, minutes: 30, pass: 0.6, maxQ: 10, maxModules: 20 }
// prev = state.learn[hash] ({ best, passed, perfect, tries }). Ang premyo ay sa PAGBUTI lang ng score
// (hanggang ₱100) + bonus sa unang pasa (₱50) + unang perfect (₱100) => max ₱250 bawat module,
// kaya hindi mapa-farm sa pag-ulit ng parehong quiz.
export const learnReward = (prev, correct, total) => {
  const pct = total ? correct / total : 0
  const passed = pct >= LEARN.pass
  const perfect = total > 0 && correct === total
  const firstPass = passed && !prev?.passed
  const firstPerfect = perfect && !prev?.perfect
  const money = Math.round(Math.max(0, pct - (prev?.best || 0)) * 100) + (firstPass ? 50 : 0) + (firstPerfect ? 100 : 0)
  return { money, pct, passed, perfect, firstPass, firstPerfect }
}

// stats.acts = { [activityId]: times done }
const acts = (s, id) => (s.stats.acts || {})[id] || 0
// prog(s) -> [current, goal] (optional, for the progress text in MissionsPanel)
export const MISSIONS = [
  { id: 'buy', icon: '🧺', text: 'Buy food at the market', reward: 100, done: (s) => s.stats.bought >= 1 },
  { id: 'work', icon: '💼', text: 'Work at any job', reward: 200, done: (s) => s.stats.jobs >= 1 },
  { id: 'fish', icon: '🎣', text: 'Catch a fish at the fishpond', reward: 150, done: (s) => s.stats.fished >= 1 },
  { id: 'sleep', icon: '🛏️', text: 'Sleep for 1 time', reward: 50, done: (s) => s.stats.slept >= 1 },
  { id: 'cook', icon: '🍛', text: 'Magluto ng adobo sa Karinderya', reward: 150, done: (s) => acts(s, 'adobo') >= 1 },
  { id: 'bargain', icon: '🗣️', text: 'Tumawad sa Palengke', reward: 80, done: (s) => acts(s, 'tawad') >= 1 },
  { id: 'hoops', icon: '🏀', text: 'Mag-basketball ng 3 beses', reward: 200, done: (s) => acts(s, 'basketball') >= 3, prog: (s) => [Math.min(3, acts(s, 'basketball')), 3] },
  { id: 'quizbee', icon: '🧠', text: 'Sumali sa Quiz Bee', reward: 150, done: (s) => acts(s, 'quizbee') >= 1 },
  { id: 'raffle', icon: '🎟️', text: 'Sumali sa Fiesta Raffle', reward: 80, done: (s) => acts(s, 'raffle') >= 1 },
  { id: 'karaoke', icon: '🎤', text: 'Kumanta sa Videoke Contest', reward: 120, done: (s) => acts(s, 'karaoke') >= 1 },
  { id: 'busy', icon: '⭐', text: 'Gumawa ng 10 activities', reward: 250, done: (s) => (s.stats.activities || 0) >= 10, prog: (s) => [Math.min(10, s.stats.activities || 0), 10] },
  { id: 'saver', icon: '💰', text: 'Mag-ipon ng ₱3,000', reward: 300, done: (s) => s.money >= 3000, prog: (s) => [Math.min(3000, Math.floor(s.money)), 3000] },
  { id: 'lvl3', icon: '🎖️', text: 'Abutin ang Level 3', reward: 300, done: (s) => level(s) >= 3, prog: (s) => [Math.min(3, level(s)), 3] },
  { id: 'scholar', icon: '🎓', text: 'Pumasa sa isang Learning Module (60%+)', reward: 150, done: (s) => (s.stats.learned || 0) >= 1 },
  { id: 'bookworm', icon: '📚', text: 'Pumasa sa 3 Learning Modules', reward: 300, done: (s) => (s.stats.learned || 0) >= 3, prog: (s) => [Math.min(3, s.stats.learned || 0), 3] },
  { id: 'honor', icon: '🏅', text: 'Perfect score sa isang module quiz', reward: 250, done: (s) => (s.stats.perfects || 0) >= 1 },
]

// Tip ng mga NPC (button na "May maipapagawa ka ba?" sa DialogPanel)
export const NPC_TIPS = {
  nena: 'Subukan mong magsukli sa tindahan ko! Bayad na, may turon at kwek-kwek pa.',
  joy: 'Gusto mo bang matutong magluto ng adobo? Pumasok ka sa karinderya, ituturo ko!',
  maria: 'Tumawad ka sa akin sa palengke! Kapag magaling ka, may libreng saging at mangga.',
  dodong: 'Pumunta ka sa Gym! May Liga ng Barangay, may premyo pag nanalo ka.',
  bea: 'Hik... kahit sino, pwede mo akong kausapin...',
  tonyo: 'Magtrabaho ka bilang rider. Palakihin mo ang level mo para sa mas maraming pera.',
  lita: 'Mag-bake ka ng pandesal kasama ko! Mas mabilis ka, mas marami ang makukuha mo.',
  ramon: 'Kailangan namin ng tanod. Maglingkod ka sa barangay, may allowance!',
  nurse: 'Kailangan namin ng volunteer aide. Libre ang pagod, may allowance pa.',
  padre: 'Sumali ka sa koro tuwing may misa. Napakasarap pakinggan ang boses ng kabataan.',
  teacher: 'Sumali ka sa Quiz Bee! May "My Learning Modules" din dito: i-upload mo ang sarili mong aralin at sagutan ang quiz, may premyo!',
  aling: 'Baka gusto mong tumulong dito sa barber shop? Libre ang kuwentuhan, may bayad pa!',
}

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
// ---------- XP / Level (replaces the old jobs-based level) ----------
// xpNeed(lv) = XP needed to go from level `lv` to `lv + 1`
export const xpNeed = (lv) => 100 + (lv - 1) * 50
// total XP needed to REACH level `lv`
export const xpToReach = (lv) => { let t = 0; for (let i = 1; i < lv; i++) t += xpNeed(i); return t }
// { level, into, need }  -> `into` / `need` is the progress bar inside the current level
export const xpInfo = (xp = 0) => {
  let lv = 1, rem = Math.max(0, xp)
  while (rem >= xpNeed(lv)) { rem -= xpNeed(lv); lv++ }
  return { level: lv, into: rem, need: xpNeed(lv) }
}
export const level = (s) => xpInfo(s.xp || 0).level
export const effectText = (it) => [it.hunger && `🍽️ +${it.hunger}`, it.energy && `⚡ +${it.energy}`, it.health && `❤️ +${it.health}`].filter(Boolean).join('  ')