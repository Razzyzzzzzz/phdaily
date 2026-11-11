// Free-roaming 2D town, front-facing (3/4) view. Coordinates are world pixels.
// Map was 2400x1700. Now 2x wider and ~1.65x taller. ALL OLD COORDINATES ARE UNCHANGED,
// the new land is added to the east (x > 2400) and south (y > 1700).
export const WW = 4800, WH = 2800

// Second road (east-west) in the south part of the map
export const ROAD2 = { y: 1700, h: 160 }
// Fishpond (south). Water rect in px; `dock` = where the player stands to fish
export const POND = { x: 3000, z: 2350, w: 900, d: 330, dock: [3450, 2322] }
// Vertical road x-range, used to skip poles / road markings
export const VROAD = { x: 1240, w: 160 }

// base = y of the building's bottom edge; door = x of the entrance
export const PLACES = [
  // --- original ---
  { id: 'house', label: 'Bahay', x: 80, w: 320, base: 480, color: 0xf4a261, roof: 0xb23a48, door: 240 },
  { id: 'sari', label: 'Sari-Sari Store', x: 480, w: 280, base: 480, color: 0x2a9d8f, roof: 0xe9c46a, door: 620, awning: true },
  { id: 'restaurant', label: 'Karinderya', x: 840, w: 320, base: 480, color: 0xe76f51, roof: 0x7f1d1d, door: 1000, awning: true },
  { id: 'market', label: 'Palengke', x: 1480, w: 360, base: 480, color: 0x3b82f6, roof: 0xfcd116, door: 1660, awning: true },
  { id: 'terminal', label: 'Jeepney Terminal', x: 1560, w: 640, base: 1020, color: 0x64748b, roof: 0x0038a8, door: 1880 },
  // --- NEW: north row (base 480), continues east ---
  { id: 'barangay', label: 'Barangay Hall', x: 2400, w: 340, base: 480, color: 0xfde68a, roof: 0x0038a8, door: 2570 },
  { id: 'hospital', label: 'Ospital', x: 2840, w: 360, base: 480, color: 0xf8fafc, roof: 0xdc2626, door: 3020 },
  { id: 'church', label: 'Simbahan', x: 3300, w: 440, base: 480, color: 0xe7e5e4, roof: 0x78350f, door: 3520 },
  { id: 'bakery', label: 'Panaderya', x: 3840, w: 300, base: 480, color: 0xfdba74, roof: 0x9a3412, door: 3990, awning: true },
  { id: 'school', label: 'Paaralan', x: 4240, w: 440, base: 480, color: 0xfacc15, roof: 0x166534, door: 4460 },
  // --- NEW: middle row (base 1020), east of the terminal ---
  { id: 'mall', label: 'Mall', x: 2560, w: 560, base: 1020, color: 0xa78bfa, roof: 0x4c1d95, door: 2840 },
  { id: 'police', label: 'Himpilan ng Pulis', x: 3300, w: 360, base: 1020, color: 0x93c5fd, roof: 0x1e3a8a, door: 3480 },
  { id: 'gym', label: 'Gym / Court', x: 3860, w: 520, base: 1020, color: 0x34d399, roof: 0x065f46, door: 4120 },
  // --- NEW: south row (base 2160), below the second road ---
  { id: 'library', label: 'Aklatan', x: 200, w: 320, base: 2160, color: 0xfca5a5, roof: 0x7f1d1d, door: 360 },
  { id: 'barber', label: 'Barber Shop', x: 700, w: 300, base: 2160, color: 0x67e8f9, roof: 0x155e75, door: 850, awning: true },
  { id: 'hardware', label: 'Hardware', x: 1500, w: 360, base: 2160, color: 0xfb923c, roof: 0x7c2d12, door: 1680 },
]

// teleport targets [x, y] (feet)
export const LOCATIONS = {
  house: [240, 520], sari: [620, 520], restaurant: [1000, 520], market: [1660, 520], park: [580, 1310], terminal: [1880, 1070],
  barangay: [2570, 520], hospital: [3020, 520], church: [3520, 520], bakery: [3990, 520], school: [4460, 520],
  mall: [2840, 1060], police: [3480, 1060], gym: [4120, 1060],
  fishpond: [3450, 2322], library: [360, 2200], barber: [850, 2200], hardware: [1680, 2200],
}

const L = (skin, hair, shirt, gender, style) => ({ skin, hair, shirt, gender, hairStyle: style })
export const NPCS = [
  { id: 'nena', name: 'Aling Nena', shop: 'sari', x: 700, y: 510, look: L('#e0ac69', '#555555', '#e63946', 'female', 2), line: 'Hi! Want to buy something from the store?' },
  { id: 'joy', name: 'Ate Joy', shop: 'restaurant', x: 1080, y: 510, look: L('#c68642', '#1b1b1b', '#fcd116', 'female', 2), line: 'Adobo ang ulam ngayon. Kain ka muna?' },
  { id: 'maria', name: 'Ate Maria', shop: 'market', x: 1740, y: 510, look: L('#f1c27d', '#3b2417', '#f472b6', 'female', 2), line: 'Hi! Want to buy some fresh fruits?' },
  { id: 'dodong', name: 'Kuya Dodong', x: 700, y: 1220, look: L('#e0ac69', '#4a2c17', '#0038a8', 'male', 1), line: 'Pahinga muna dito sa parke. Basketball tayo mamaya, pre!' },
  // umiiyak na NPC: kapag lumapit ka, sasabihin niya ang `line` tapos tatakbo palayo
  { id: 'bea', name: 'Bea', cry: true, x: 430, y: 1184, look: L('#f1c27d', '#2b1b12', '#a78bfa', 'female', 2), line: 'Ako nalang kasi...',
    // sinasabi niya habang hinahabol mo siya (paiba-iba, paulit-ulit)
    chaseLines: [
      'Miss na miss ko na siya...',
      'Bakit mo pa ako hinahabol?',
      'Iniwan niya ako, hik...',
      'Sana bumalik na siya...',
      'Huwag mo na akong sundan...',
      'Mahal ko pa rin siya...',
      'Ako nalang kasi sana...',
      'Hindi ko na kaya, hu hu...',
    ] },
  { id: 'tonyo', name: 'Mang Tonyo', x: 1760, y: 1100, look: L('#8d5524', '#1b1b1b', '#2a9d8f', 'male', 0), line: 'Para po! Jeepney driver ako dito. Kailangan ng rider? Punta ka sa terminal.' },
  // --- NEW NPCs ---
  { id: 'lita', name: 'Ate Lita', shop: 'bakery', x: 3990, y: 510, look: L('#e0ac69', '#2b1b12', '#fb923c', 'female', 2), line: 'Mainit pa ang pandesal! Bili ka na?' },
  { id: 'ramon', name: 'Sir Ramon', x: 3480, y: 1050, look: L('#c68642', '#111111', '#1e3a8a', 'male', 0), line: 'Ligtas ang barangay natin. Mag-ingat sa kalsada, ha.' },
  { id: 'nurse', name: 'Nurse Gina', x: 3020, y: 510, look: L('#f1c27d', '#2b1b12', '#f8fafc', 'female', 2), line: 'Kung masama ang pakiramdam mo, magpahinga at uminom ng gamot.' },
  { id: 'padre', name: 'Fr. Nato', x: 3520, y: 510, look: L('#e0ac69', '#555555', '#e7e5e4', 'male', 0), line: 'Pagpalain ka, anak. Tuloy ka sa simbahan.' },
  { id: 'teacher', name: 'Ma\'am Cruz', x: 4460, y: 510, look: L('#f1c27d', '#3b2417', '#16a34a', 'female', 2), line: 'Mag-aral nang mabuti! Malayo ang mararating mo.' },
  { id: 'aling', name: 'Mang Boyet', x: 850, y: 2200, look: L('#8d5524', '#1b1b1b', '#0891b2', 'male', 1), line: 'Gupit muna, pre? Libre ang kuwentuhan!' },
]